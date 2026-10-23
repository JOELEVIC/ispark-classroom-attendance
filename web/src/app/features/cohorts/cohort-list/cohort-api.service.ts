import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface ApiProgram {
  id: number;
  name: string;
}

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

interface ApiEnrollment {
  id: number;
  trainee_id: number;
  trainee_name: string;
}

interface ApiClass {
  id: number;
}

export interface CohortProgram {
  id: number;
  name: string;
}

export interface CohortTrainer {
  id: number;
  name: string;
}

export interface CohortTrainee {
  id: number;
  name: string;
}

export interface CohortRecord {
  id: number;
  programId: number;
  programName: string;
  name: string;
  startDate: string;
  endDate: string;
  trainers: CohortTrainer[];
  trainees: CohortTrainee[];
  classCount: number;
}

export interface CohortCreate {
  programId: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CohortDirectory {
  programs: CohortProgram[];
  trainers: CohortTrainer[];
  trainees: CohortTrainee[];
  cohorts: CohortRecord[];
}

@Injectable({ providedIn: 'root' })
export class CohortApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  listDirectory(): Observable<CohortDirectory> {
    return forkJoin({
      programs: this.http.get<CohortProgram[]>(
        `${this.apiBaseUrl}/programs/`,
      ),
      trainers: this.http.get<CohortTrainer[]>(
        `${this.apiBaseUrl}/trainers/`,
      ),
      trainees: this.http.get<CohortTrainee[]>(
        `${this.apiBaseUrl}/trainees/`,
      ),
    }).pipe(
      switchMap(({ programs, trainers, trainees }) =>
        this.getCohorts(programs).pipe(
          map((cohorts) => ({ programs, trainers, trainees, cohorts })),
        ),
      ),
    );
  }

  create(payload: CohortCreate): Observable<CohortRecord> {
    return this.http
      .post<ApiCohort>(`${this.apiBaseUrl}/cohorts/`, {
        program_id: payload.programId,
        name: payload.name,
        start_date: payload.startDate,
        end_date: payload.endDate,
      })
      .pipe(
        map((cohort) =>
          this.mapCohort(
            cohort,
            payload.programId,
            '',
            [],
            [],
            0,
          ),
        ),
      );
  }

  enrollTrainee(cohortId: number, traineeId: number): Observable<unknown> {
    return this.http.post(
      `${this.apiBaseUrl}/cohorts/${cohortId}/enrollments`,
      { trainee_id: traineeId },
    );
  }

  assignTrainer(cohortId: number, trainerId: number): Observable<unknown> {
    return this.http.post(
      `${this.apiBaseUrl}/cohorts/${cohortId}/trainers`,
      { trainer_id: trainerId },
    );
  }

  private getCohorts(
    programs: CohortProgram[],
  ): Observable<CohortRecord[]> {
    if (programs.length === 0) {
      return of([]);
    }

    return forkJoin(
      programs.map((program) =>
        this.http
          .get<ApiCohort[]>(
            `${this.apiBaseUrl}/cohorts/by-program/${program.id}`,
          )
          .pipe(
            switchMap((cohorts) =>
              this.getCohortDetails(cohorts, program.name),
            ),
          ),
      ),
    ).pipe(map((groups) => groups.flat()));
  }

  private getCohortDetails(
    cohorts: ApiCohort[],
    programName: string,
  ): Observable<CohortRecord[]> {
    if (cohorts.length === 0) {
      return of([]);
    }

    return forkJoin(
      cohorts.map((cohort) =>
        forkJoin({
          trainers: this.http.get<CohortTrainer[]>(
            `${this.apiBaseUrl}/cohorts/${cohort.id}/trainers`,
          ),
          enrollments: this.http.get<ApiEnrollment[]>(
            `${this.apiBaseUrl}/cohorts/${cohort.id}/enrollments`,
          ),
          classes: this.http.get<ApiClass[]>(
            `${this.apiBaseUrl}/cohorts/${cohort.id}/classes`,
          ),
        }).pipe(
          map(({ trainers, enrollments, classes }) =>
            this.mapCohort(
              cohort,
              cohort.program_id,
              programName,
              trainers,
              enrollments.map((enrollment) => ({
                id: enrollment.trainee_id,
                name: enrollment.trainee_name,
              })),
              classes.length,
            ),
          ),
        ),
      ),
    );
  }

  private mapCohort(
    cohort: ApiCohort,
    programId: number,
    programName: string,
    trainers: CohortTrainer[],
    trainees: CohortTrainee[],
    classCount: number,
  ): CohortRecord {
    return {
      id: cohort.id,
      programId,
      programName,
      name: cohort.name,
      startDate: cohort.start_date,
      endDate: cohort.end_date,
      trainers,
      trainees,
      classCount,
    };
  }
}
