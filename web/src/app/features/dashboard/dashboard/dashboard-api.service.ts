import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface Program {
  id: number;
  name: string;
}

interface Cohort {
  id: number;
  name: string;
  programName: string;
}

interface Trainee {
  id: number;
}

interface ClassSession {
  id: number;
  cohortId: number;
  cohortName: string;
  programName: string;
  date: string;
  topic: string;
}

interface AttendanceRecord {
  status: string;
}

export interface DashboardStats {
  programs: number;
  cohorts: number;
  trainees: number;
  averageAttendance: number | null;
  todaysClasses: DashboardClass[];
}

export interface DashboardClass {
  id: number;
  cohortId: number;
  cohortName: string;
  programName: string;
  date: string;
  topic: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getStats(): Observable<DashboardStats> {
    return this.http.get<Program[]>(`${this.apiBaseUrl}/programs/`).pipe(
      switchMap((programs) =>
        this.getCohorts(programs).pipe(map((cohorts) => ({ programs, cohorts }))),
      ),
      switchMap(({ programs, cohorts }) =>
        forkJoin({
          trainees: this.http.get<Trainee[]>(`${this.apiBaseUrl}/trainees/`),
          classes: this.getClasses(cohorts),
        }).pipe(
          switchMap(({ trainees, classes }) =>
            this.getAttendance(classes).pipe(
              map((attendanceGroups) => ({
                programs: programs.length,
                cohorts: cohorts.length,
                trainees: trainees.length,
                averageAttendance: this.averageAttendance(attendanceGroups),
                todaysClasses: classes.filter((classItem) => classItem.date === this.localDate()),
              })),
            ),
          ),
        ),
      ),
    );
  }

  private getCohorts(programs: Program[]): Observable<Cohort[]> {
    if (programs.length === 0) {
      return of([]);
    }

    return forkJoin(
      programs.map((program) =>
        this.http.get<Cohort[]>(`${this.apiBaseUrl}/cohorts/by-program/${program.id}`).pipe(
          map((cohorts) =>
            cohorts.map((cohort) => ({
              ...cohort,
              programName: program.name,
            })),
          ),
        ),
      ),
    ).pipe(map((groups) => groups.flat()));
  }

  private getClasses(cohorts: Cohort[]): Observable<ClassSession[]> {
    if (cohorts.length === 0) {
      return of([]);
    }

    return forkJoin(
      cohorts.map((cohort) =>
        this.http
          .get<
            {
              id: number;
              cohort_id: number;
              class_date: string;
              topic: string;
            }[]
          >(`${this.apiBaseUrl}/cohorts/${cohort.id}/classes`)
          .pipe(
            map((classes) =>
              classes.map((classItem) => ({
                id: classItem.id,
                cohortId: cohort.id,
                cohortName: cohort.name,
                programName: cohort.programName,
                date: classItem.class_date,
                topic: classItem.topic,
              })),
            ),
          ),
      ),
    ).pipe(map((groups) => groups.flat()));
  }

  private getAttendance(classes: ClassSession[]): Observable<AttendanceRecord[][]> {
    if (classes.length === 0) {
      return of([]);
    }

    return forkJoin(
      classes.map((classSession) =>
        this.http.get<AttendanceRecord[]>(
          `${this.apiBaseUrl}/classes/${classSession.id}/attendance`,
        ),
      ),
    );
  }

  private averageAttendance(attendanceGroups: AttendanceRecord[][]): number | null {
    let attended = 0;
    let eligible = 0;

    for (const record of attendanceGroups.flat()) {
      switch (record.status.toLowerCase()) {
        case 'present':
        case 'late':
          attended += 1;
          eligible += 1;
          break;
        case 'absent':
          eligible += 1;
          break;
        case 'excused':
          break;
        default:
          throw new Error(`Unrecognized attendance status: ${record.status}`);
      }
    }

    return eligible === 0 ? null : (attended / eligible) * 100;
  }

  private localDate(): string {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
