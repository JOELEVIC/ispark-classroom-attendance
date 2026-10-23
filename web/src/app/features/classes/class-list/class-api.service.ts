import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { AttendanceStatus } from '../../../core/mock-data';
import { environment } from '../../../../environments/environment';

interface ApiCohort {
  id: number;
  program_id: number;
  name: string;
  start_date: string;
  end_date: string;
}

interface ApiTrainer {
  id: number;
  name: string;
}

interface ApiClass {
  id: number;
  cohort_id: number;
  trainer_id: number;
  class_date: string;
  topic: string;
}

interface ApiEnrollment {
  id: number;
}

interface ApiAttendance {
  status: string;
}

export interface ClassTrainer {
  id: number;
  name: string;
}

export interface ClassRecord {
  id: number;
  cohortId: number;
  cohortName: string;
  programName: string;
  cohortStartDate: string;
  cohortEndDate: string;
  trainerId: number;
  trainerName: string;
  date: string;
  topic: string;
  attendance: AttendanceStatus[];
  traineeCount: number;
}

export interface ClassCohort {
  id: number;
  programId: number;
  programName: string;
  name: string;
  startDate: string;
  endDate: string;
  trainers: ClassTrainer[];
  traineeCount: number;
  classes: ClassRecord[];
}

export interface ClassDirectory {
  cohorts: ClassCohort[];
  trainers: ClassTrainer[];
}

export interface ClassCreate {
  cohortId: number;
  trainerId: number;
  date: string;
  topic: string;
}

@Injectable({ providedIn: 'root' })
export class ClassApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getDirectory(): Observable<ClassDirectory> {
    return forkJoin({
      programs: this.http.get<{ id: number; name: string }[]>(
        `${this.apiBaseUrl}/programs/`,
      ),
      trainers: this.http.get<ClassTrainer[]>(
        `${this.apiBaseUrl}/trainers/`,
      ),
    }).pipe(
      switchMap(({ programs, trainers }) =>
        programs.length
          ? forkJoin(
              programs.map((program) =>
                this.http
                  .get<ApiCohort[]>(
                    `${this.apiBaseUrl}/cohorts/by-program/${program.id}`,
                  )
                  .pipe(
                    switchMap((cohorts) =>
                      cohorts.length
                        ? forkJoin(
                            cohorts.map((cohort) =>
                              this.getCohort(cohort, program.name, trainers),
                            ),
                          )
                        : of([]),
                    ),
                  ),
              ),
            ).pipe(
              map((groups) => ({
                cohorts: groups.flat(),
                trainers,
              })),
            )
          : of({ cohorts: [], trainers }),
      ),
    );
  }

  create(payload: ClassCreate): Observable<ClassRecord> {
    return this.http
      .post<ApiClass>(
        `${this.apiBaseUrl}/cohorts/${payload.cohortId}/classes`,
        {
          trainer_id: payload.trainerId,
          class_date: payload.date,
          topic: payload.topic,
        },
      )
      .pipe(
        map((classItem) => ({
          id: classItem.id,
          cohortId: classItem.cohort_id,
          cohortName: '',
          programName: '',
          cohortStartDate: '',
          cohortEndDate: '',
          trainerId: classItem.trainer_id,
          trainerName: '',
          date: classItem.class_date,
          topic: classItem.topic,
          attendance: [],
          traineeCount: 0,
        })),
      );
  }

  assignTrainer(cohortId: number, trainerId: number): Observable<unknown> {
    return this.http.post(
      `${this.apiBaseUrl}/cohorts/${cohortId}/trainers`,
      { trainer_id: trainerId },
    );
  }

  private getCohort(
    cohort: ApiCohort,
    programName: string,
    allTrainers: ClassTrainer[],
  ): Observable<ClassCohort> {
    return forkJoin({
      trainers: this.http.get<ClassTrainer[]>(
        `${this.apiBaseUrl}/cohorts/${cohort.id}/trainers`,
      ),
      enrollments: this.http.get<ApiEnrollment[]>(
        `${this.apiBaseUrl}/cohorts/${cohort.id}/enrollments`,
      ),
      classes: this.http.get<ApiClass[]>(
        `${this.apiBaseUrl}/cohorts/${cohort.id}/classes`,
      ),
    }).pipe(
      switchMap(({ trainers, enrollments, classes }) =>
        classes.length
          ? forkJoin(
              classes.map((classItem) =>
                this.http
                  .get<ApiAttendance[]>(
                    `${this.apiBaseUrl}/classes/${classItem.id}/attendance`,
                  )
                  .pipe(
                    map((attendance) =>
                      this.mapClass(
                        classItem,
                        cohort,
                        programName,
                        allTrainers,
                        attendance,
                        enrollments.length,
                      ),
                    ),
                  ),
              ),
            ).pipe(
              map((classRecords) =>
                this.mapCohort(
                  cohort,
                  programName,
                  trainers,
                  enrollments.length,
                  classRecords,
                ),
              ),
            )
          : of(
              this.mapCohort(
                cohort,
                programName,
                trainers,
                enrollments.length,
                [],
              ),
            ),
      ),
    );
  }

  private mapCohort(
    cohort: ApiCohort,
    programName: string,
    trainers: ClassTrainer[],
    traineeCount: number,
    classes: ClassRecord[],
  ): ClassCohort {
    return {
      id: cohort.id,
      programId: cohort.program_id,
      programName,
      name: cohort.name,
      startDate: cohort.start_date,
      endDate: cohort.end_date,
      trainers,
      traineeCount,
      classes,
    };
  }

  private mapClass(
    classItem: ApiClass,
    cohort: ApiCohort,
    programName: string,
    trainers: ClassTrainer[],
    attendance: ApiAttendance[],
    traineeCount: number,
  ): ClassRecord {
    return {
      id: classItem.id,
      cohortId: cohort.id,
      cohortName: cohort.name,
      programName,
      cohortStartDate: cohort.start_date,
      cohortEndDate: cohort.end_date,
      trainerId: classItem.trainer_id,
      trainerName:
        trainers.find((trainer) => trainer.id === classItem.trainer_id)?.name ??
        'Trainer',
      date: classItem.class_date,
      topic: classItem.topic,
      attendance: attendance.map((record) =>
        this.normalizeStatus(record.status),
      ),
      traineeCount,
    };
  }

  private normalizeStatus(status: string): AttendanceStatus {
    switch (status.toLowerCase()) {
      case 'present':
        return 'present';
      case 'absent':
        return 'absent';
      case 'late':
        return 'late';
      case 'excused':
        return 'excused';
      default:
        throw new Error(`Unrecognized attendance status: ${status}`);
    }
  }
}
