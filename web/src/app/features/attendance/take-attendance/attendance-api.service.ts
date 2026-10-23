import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { AttendanceStatus } from '../../../core/mock-data';
import { environment } from '../../../../environments/environment';

interface ApiCohort {
  id: number;
  program_id: number;
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
  trainee_id: number;
  trainee_name: string;
}

interface ApiAttendance {
  trainee_id: number;
  status: string;
}

export interface AttendanceTrainee {
  id: number;
  name: string;
}

export interface AttendanceTrainer {
  id: number;
  name: string;
}

export interface AttendanceClass {
  id: number;
  cohortId: number;
  trainerId: number;
  date: string;
  topic: string;
}

export interface AttendanceCohort {
  id: number;
  programId: number;
  programName: string;
  name: string;
  trainees: AttendanceTrainee[];
  trainers: AttendanceTrainer[];
  classes: AttendanceClass[];
}

export interface AttendanceEntry {
  trainee_id: number;
  status: AttendanceStatus;
}

@Injectable({ providedIn: 'root' })
export class AttendanceApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getCohorts(): Observable<AttendanceCohort[]> {
    return forkJoin({
      programs: this.http.get<{ id: number; name: string }[]>(
        `${this.apiBaseUrl}/programs/`,
      ),
    }).pipe(
      switchMap(({ programs }) =>
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
                              this.getCohort(cohort, program.name),
                            ),
                          )
                        : of([]),
                    ),
                  ),
              ),
            ).pipe(map((groups) => groups.flat()))
          : of([]),
      ),
    );
  }

  getClassAttendance(classId: number): Observable<Map<number, AttendanceStatus>> {
    return this.http
      .get<ApiAttendance[]>(
        `${this.apiBaseUrl}/classes/${classId}/attendance`,
      )
      .pipe(
        map(
          (records) =>
            new Map(
              records.map((record) => [
                record.trainee_id,
                this.normalizeStatus(record.status),
              ]),
            ),
        ),
      );
  }

  saveAttendance(
    classId: number,
    cohortId: number,
    trainerId: number,
    records: AttendanceEntry[],
  ): Observable<unknown> {
    const params = new HttpParams()
      .set('cohort_id', cohortId)
      .set('trainer_id', trainerId);
    return this.http.post(
      `${this.apiBaseUrl}/classes/${classId}/attendance`,
      { records },
      { params },
    );
  }

  private getCohort(
    cohort: ApiCohort,
    programName: string,
  ): Observable<AttendanceCohort> {
    return forkJoin({
      trainers: this.http.get<AttendanceTrainer[]>(
        `${this.apiBaseUrl}/cohorts/${cohort.id}/trainers`,
      ),
      enrollments: this.http.get<ApiEnrollment[]>(
        `${this.apiBaseUrl}/cohorts/${cohort.id}/enrollments`,
      ),
      classes: this.http.get<ApiClass[]>(
        `${this.apiBaseUrl}/cohorts/${cohort.id}/classes`,
      ),
    }).pipe(
      map(({ trainers, enrollments, classes }) => ({
        id: cohort.id,
        programId: cohort.program_id,
        programName,
        name: cohort.name,
        trainers,
        trainees: enrollments.map((enrollment) => ({
          id: enrollment.trainee_id,
          name: enrollment.trainee_name,
        })),
        classes: classes.map((classItem) => ({
          id: classItem.id,
          cohortId: classItem.cohort_id,
          trainerId: classItem.trainer_id,
          date: classItem.class_date,
          topic: classItem.topic,
        })),
      })),
    );
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
