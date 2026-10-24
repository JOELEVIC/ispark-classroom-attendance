import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { forkJoin } from 'rxjs';
import { AttendanceStatus } from '../../../core/mock-data';
import {
  buildCohortReportCsv,
  ClassAttendanceSummary,
  ReportApiService,
  ReportClass,
  ReportCohort,
  ReportTrainee,
} from './report-api.service';

interface TraineeReportRow {
  trainee: { id: number; name: string };
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number | null;
}

@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  selector: 'app-cohort-report',
  styleUrl: './cohort-report.css',
  templateUrl: './cohort-report.html',
})
export class CohortReport {
  private readonly reportApi = inject(ReportApiService);
  protected readonly cohorts = signal<ReportCohort[]>([]);
  protected readonly trainees = signal<ReportTrainee[]>([]);
  protected readonly classes = signal<ReportClass[]>([]);
  protected readonly loading = signal(true);
  protected readonly reportLoading = signal(false);
  protected readonly summaryLoading = signal(false);
  protected readonly historyLoading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly classSummary = signal<ClassAttendanceSummary | null>(null);
  protected readonly historyStatuses = signal(new Map<number, AttendanceStatus>());
  protected includeFinished = false;
  protected cohortId: number | null = null;
  protected selectedTraineeId: number | null = null;
  protected selectedClassId: number | null = null;

  constructor() {
    this.loadCohorts();
  }

  protected get rows(): TraineeReportRow[] {
    return this.trainees().map((trainee) => ({
      trainee: { id: trainee.id, name: trainee.name },
      present: trainee.counts.present,
      absent: trainee.counts.absent,
      late: trainee.counts.late,
      excused: trainee.counts.excused,
      rate: trainee.attendanceRate,
    }));
  }

  protected get selectedClass(): ReportClass | undefined {
    return this.classes().find((classItem) => classItem.id === this.selectedClassId);
  }

  protected get cohortName(): string {
    const cohort = this.cohorts().find((item) => item.id === this.cohortId);
    return cohort ? `${cohort.programName} · ${cohort.name}` : '';
  }

  protected historyStatus(classItem: ReportClass): AttendanceStatus | null {
    return this.historyStatuses().get(classItem.id) ?? null;
  }

  protected toggleHistory(traineeId: number): void {
    if (this.selectedTraineeId === traineeId) {
      this.selectedTraineeId = null;
      return;
    }
    const cohortId = this.cohortId;
    if (cohortId === null) {
      return;
    }

    this.selectedTraineeId = traineeId;
    this.historyStatuses.set(new Map());
    this.historyLoading.set(true);
    this.reportApi.getTraineeHistory(traineeId, cohortId).subscribe({
      next: (history) => {
        if (this.selectedTraineeId !== traineeId || this.cohortId !== cohortId) {
          return;
        }
        this.historyStatuses.set(history);
        this.historyLoading.set(false);
      },
      error: (error: unknown) => {
        if (this.selectedTraineeId !== traineeId || this.cohortId !== cohortId) {
          return;
        }
        console.error('Failed to load trainee attendance history', error);
        this.loadError.set("Couldn't load the trainee's attendance history.");
        this.historyLoading.set(false);
      },
    });
  }

  protected statusCount(status: AttendanceStatus): number {
    return this.classSummary()?.counts[status] ?? 0;
  }

  protected exportReport(): void {
    const cohort = this.cohorts().find((item) => item.id === this.cohortId);
    if (!cohort) {
      return;
    }

    const filenameBase = `${cohort.programName}-${cohort.name}`
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    const blob = new Blob([buildCohortReportCsv(this.trainees())], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase}-attendance-report.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  protected unmarkedTrainees(): { id: number; name: string }[] {
    return this.classSummary()?.unmarkedTrainees ?? [];
  }

  protected onCohortChange(): void {
    this.selectedTraineeId = null;
    this.historyStatuses.set(new Map());
    this.historyLoading.set(false);
    this.selectedClassId = null;
    this.classSummary.set(null);
    this.loadError.set(null);
    const cohortId = this.cohortId;
    if (cohortId === null) {
      this.trainees.set([]);
      this.classes.set([]);
      this.reportLoading.set(false);
      return;
    }

    this.reportLoading.set(true);
    forkJoin({
      trainees: this.reportApi.getCohortReport(cohortId),
      classes: this.reportApi.getClasses(cohortId),
    }).subscribe({
      next: ({ trainees, classes }) => {
        if (this.cohortId !== cohortId) {
          return;
        }
        this.trainees.set(trainees);
        this.classes.set(classes);
        this.selectedClassId = classes[0]?.id ?? null;
        this.reportLoading.set(false);
        this.loadClassSummary();
      },
      error: (error: unknown) => {
        if (this.cohortId !== cohortId) {
          return;
        }
        console.error('Failed to load cohort report', error);
        this.loadError.set("Couldn't load the cohort report. Please try again.");
        this.trainees.set([]);
        this.classes.set([]);
        this.reportLoading.set(false);
      },
    });
  }

  protected onClassChange(): void {
    this.loadClassSummary();
  }

  protected onIncludeFinishedChange(includeFinished: boolean): void {
    this.includeFinished = includeFinished;
    this.loadCohorts();
  }

  protected statusText(status: AttendanceStatus | null): string {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not marked';
  }

  private loadCohorts(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.reportApi.getCohorts(this.includeFinished).subscribe({
      next: (cohorts) => {
        this.cohorts.set(cohorts);
        this.loading.set(false);
        if (!cohorts.some((cohort) => cohort.id === this.cohortId)) {
          this.cohortId = cohorts[0]?.id ?? null;
        }
        this.onCohortChange();
      },
      error: (error: unknown) => {
        console.error('Failed to load report cohorts', error);
        this.loadError.set("Couldn't load reports. Please try again.");
        this.loading.set(false);
      },
    });
  }

  private loadClassSummary(): void {
    const classId = this.selectedClassId;
    this.classSummary.set(null);
    if (classId === null) {
      this.summaryLoading.set(false);
      return;
    }

    this.summaryLoading.set(true);
    this.reportApi.getClassSummary(classId).subscribe({
      next: (summary) => {
        if (this.selectedClassId !== classId) {
          return;
        }
        this.classSummary.set(summary);
        this.summaryLoading.set(false);
      },
      error: (error: unknown) => {
        if (this.selectedClassId !== classId) {
          return;
        }
        console.error('Failed to load class attendance summary', error);
        this.loadError.set("Couldn't load the class summary. Please try again.");
        this.summaryLoading.set(false);
      },
    });
  }
}
