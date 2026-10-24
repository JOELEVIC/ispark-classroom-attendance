import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface ApiCohort {
  id: number;
  program_id: number;
  name: string;
}

interface ApiEnrollment {
  id: number;
  trainee_id: number;
  trainee_name: string;
}

export interface EnrollmentCohort {
  id: number;
  programId: number;
  name: string;
  programName: string;
  trainees: EnrolledTrainee[];
}

export interface EnrolledTrainee {
  id: number;
  name: string;
}

export interface EnrollmentDirectory {
  cohorts: EnrollmentCohort[];
  trainees: EnrolledTrainee[];
}

export interface EnrollmentImportFailure {
  row: number;
  name: string | null;
  reason: string;
}

export interface EnrollmentImportResult {
  imported_count: number;
  total_rows: number;
  failures: EnrollmentImportFailure[];
}

@Injectable({ providedIn: 'root' })
export class EnrollmentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getDirectory(): Observable<EnrollmentDirectory> {
    return forkJoin({
      programs: this.http.get<{ id: number; name: string }[]>(`${this.apiBaseUrl}/programs/`),
      trainees: this.http.get<EnrolledTrainee[]>(`${this.apiBaseUrl}/trainees/`),
    }).pipe(
      switchMap(({ programs, trainees }) => {
        if (programs.length === 0) {
          return of({ cohorts: [], trainees });
        }
        return forkJoin(
          programs.map((program) =>
            this.http.get<ApiCohort[]>(`${this.apiBaseUrl}/cohorts/by-program/${program.id}`).pipe(
              switchMap((cohorts) =>
                cohorts.length
                  ? forkJoin(
                      cohorts.map((cohort) =>
                        this.http
                          .get<ApiEnrollment[]>(
                            `${this.apiBaseUrl}/cohorts/${cohort.id}/enrollments`,
                          )
                          .pipe(
                            map((enrollments) => ({
                              id: cohort.id,
                              programId: cohort.program_id,
                              name: cohort.name,
                              programName: program.name,
                              trainees: enrollments.map((enrollment) => ({
                                id: enrollment.trainee_id,
                                name: enrollment.trainee_name,
                              })),
                            })),
                          ),
                      ),
                    )
                  : of([]),
              ),
            ),
          ),
        ).pipe(
          map((cohortGroups) => ({
            cohorts: cohortGroups.flat(),
            trainees,
          })),
        );
      }),
    );
  }

  enroll(cohortId: number, traineeId: number): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/cohorts/${cohortId}/enrollments`, {
      trainee_id: traineeId,
    });
  }

  importCsv(cohortId: number, file: File): Observable<EnrollmentImportResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<EnrollmentImportResult>(
      `${this.apiBaseUrl}/cohorts/${cohortId}/enrollments/import`,
      formData,
    );
  }
}
