import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { AttendanceStatus } from '../../../core/mock-data';
import { environment } from '../../../../environments/environment';

interface ApiProgram {
  id: number;
  name: string;
}

interface ApiCohort {
  id: number;
  program_id: number;
  name: string;
}

interface ApiTraineeReport {
  trainee_id: number;
  trainee_name: string;
  counts: AttendanceCounts;
  attendance_rate: number | null;
  below_threshold: boolean;
}

interface ApiClass {
  id: number;
  class_date: string;
  topic: string;
}

interface ApiTraineeHistory {
  class_id: number;
  status: string;
}

interface ApiClassSummary {
  class_id: number;
  counts: AttendanceCounts;
  unmarked_trainees: { trainee_id: number; trainee_name: string }[];
}

export interface AttendanceCounts {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface ReportCohort {
  id: number;
  name: string;
  programName: string;
}

export interface ReportTrainee {
  id: number;
  name: string;
  counts: AttendanceCounts;
  attendanceRate: number | null;
  belowThreshold: boolean;
}

export function buildCohortReportCsv(trainees: ReportTrainee[]): string {
  const rows = [
    ['Trainee', 'Present', 'Absent', 'Late', 'Excused', 'Attendance rate (%)'],
    ...trainees.map((trainee) => [
      trainee.name,
      trainee.counts.present,
      trainee.counts.absent,
      trainee.counts.late,
      trainee.counts.excused,
      trainee.attendanceRate === null ? 'N/A' : trainee.attendanceRate.toFixed(2),
    ]),
  ];
  const csvRows = rows.map((row) =>
    row
      .map((value) => {
        let cell = String(value);
        if (/^[\t\r ]*[=+\-@]/.test(cell)) {
          cell = `'${cell}`;
        }
        return `"${cell.replaceAll('"', '""')}"`;
      })
      .join(','),
  );

  return `\uFEFF${csvRows.join('\r\n')}\r\n`;
}

export interface ReportClass {
  id: number;
  date: string;
  topic: string;
}

export interface ClassAttendanceSummary {
  counts: AttendanceCounts;
  unmarkedTrainees: { id: number; name: string }[];
}

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getCohorts(includeFinished = false): Observable<ReportCohort[]> {
    return this.http.get<ApiProgram[]>(`${this.apiBaseUrl}/programs/`).pipe(
      switchMap((programs) =>
        programs.length
          ? forkJoin(
              programs.map((program) =>
                this.http
                  .get<ApiCohort[]>(
                    `${this.apiBaseUrl}/cohorts/by-program/${program.id}`,
                    includeFinished ? { params: { include_finished: true } } : {},
                  )
                  .pipe(
                    map((cohorts) =>
                      cohorts.map((cohort) => ({
                        id: cohort.id,
                        name: cohort.name,
                        programName: program.name,
                      })),
                    ),
                  ),
              ),
            ).pipe(map((groups) => groups.flat()))
          : of([]),
      ),
    );
  }

  getCohortReport(cohortId: number): Observable<ReportTrainee[]> {
    return this.http
      .get<{ trainees: ApiTraineeReport[] }>(
        `${this.apiBaseUrl}/cohorts/${cohortId}/attendance-report`,
      )
      .pipe(
        map(({ trainees }) =>
          trainees.map((trainee) => ({
            id: trainee.trainee_id,
            name: trainee.trainee_name,
            counts: trainee.counts,
            attendanceRate: trainee.attendance_rate,
            belowThreshold: trainee.below_threshold,
          })),
        ),
      );
  }

  getClasses(cohortId: number): Observable<ReportClass[]> {
    return this.http.get<ApiClass[]>(`${this.apiBaseUrl}/cohorts/${cohortId}/classes`).pipe(
      map((classes) =>
        classes.map((classItem) => ({
          id: classItem.id,
          date: classItem.class_date,
          topic: classItem.topic,
        })),
      ),
    );
  }

  getTraineeHistory(
    traineeId: number,
    cohortId: number,
  ): Observable<Map<number, AttendanceStatus>> {
    return this.http
      .get<ApiTraineeHistory[]>(`${this.apiBaseUrl}/trainees/${traineeId}/attendance`, {
        params: { cohort_id: cohortId },
      })
      .pipe(
        map(
          (entries) =>
            new Map(entries.map((entry) => [entry.class_id, this.normalizeStatus(entry.status)])),
        ),
      );
  }

  getClassSummary(classId: number): Observable<ClassAttendanceSummary> {
    return this.http
      .get<ApiClassSummary>(`${this.apiBaseUrl}/classes/${classId}/attendance-summary`)
      .pipe(
        map((summary) => ({
          counts: summary.counts,
          unmarkedTrainees: summary.unmarked_trainees.map((trainee) => ({
            id: trainee.trainee_id,
            name: trainee.trainee_name,
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
