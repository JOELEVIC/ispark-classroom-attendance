import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { AttendanceStatus } from '../../../core/mock-data';
import {
  AttendanceApiService,
  AttendanceChange,
  AttendanceClass,
  AttendanceCohort,
  AttendanceEntry,
  AttendanceTrainer,
} from './attendance-api.service';

@Component({
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  selector: 'app-take-attendance',
  styleUrl: './take-attendance.css',
  templateUrl: './take-attendance.html',
})
export class TakeAttendance implements OnInit {
  private readonly attendanceApi = inject(AttendanceApiService);
  private readonly route = inject(ActivatedRoute);
  protected readonly statuses: AttendanceStatus[] = [
    'present',
    'absent',
    'late',
    'excused',
  ];
  protected readonly cohorts = signal<AttendanceCohort[]>([]);
  protected readonly loading = signal(true);
  protected readonly attendanceLoading = signal(false);
  protected readonly attendanceReady = signal(false);
  protected readonly attendanceLoadFailed = signal(false);
  protected readonly changeHistory = signal<Record<number, AttendanceChange[]>>(
    {},
  );
  protected readonly historyLoading = signal<Record<number, boolean>>({});
  protected readonly historyErrors = signal<Record<number, string>>({});
  protected readonly expandedHistoryId = signal<number | null>(null);
  protected readonly submitting = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected errorMessage = '';
  protected cohortId: number | null = null;
  protected classId: number | null = null;
  protected trainerId: number | null = null;
  protected attendanceDraft: Record<number, AttendanceStatus | null> = {};
  protected saved = false;
  private requestedClassId: number | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const classId = Number(params.get('classId'));
      this.requestedClassId =
        Number.isInteger(classId) && classId > 0 ? classId : null;
      this.selectRequestedClass();
    });
    this.loadDirectory();
  }

  protected get selectedCohort(): AttendanceCohort | undefined {
    return this.cohorts().find((cohort) => cohort.id === this.cohortId);
  }

  protected get classes(): AttendanceClass[] {
    return this.selectedCohort?.classes ?? [];
  }

  protected get trainees() {
    return this.selectedCohort?.trainees ?? [];
  }

  protected get trainers(): AttendanceTrainer[] {
    return this.selectedCohort?.trainers ?? [];
  }

  protected get assignedTrainer(): AttendanceTrainer | undefined {
    const trainerId = this.selectedClass?.trainerId;
    return this.trainers.find((trainer) => trainer.id === trainerId);
  }

  protected get recordingTrainers(): AttendanceTrainer[] {
    const trainer = this.assignedTrainer;
    return trainer ? [trainer] : [];
  }

  protected get selectedClass(): AttendanceClass | undefined {
    return this.classes.find((item) => item.id === this.classId);
  }

  protected loadDirectory(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.attendanceApi.getCohorts().subscribe({
      next: (cohorts) => {
        this.cohorts.set(cohorts);
        if (!cohorts.some((cohort) => cohort.id === this.cohortId)) {
          this.cohortId = cohorts[0]?.id ?? null;
        }
        this.loading.set(false);
        this.selectRequestedClass();
        if (this.classId === null && this.classes.length > 0) {
          this.selectClass(this.classes[0].id);
        }
      },
      error: (error: unknown) => {
        console.error('Failed to load attendance directory', error);
        this.loadError.set("Couldn't load attendance data. Please try again.");
        this.loading.set(false);
      },
    });
  }

  protected onCohortChange(): void {
    this.classId = null;
    this.trainerId = null;
    this.errorMessage = '';
    this.saved = false;
    this.attendanceDraft = {};
    if (this.classes.length > 0) {
      this.selectClass(this.classes[0].id);
    }
  }

  protected selectClass(classId: number | null): void {
    this.classId = classId;
    const selectedClass = this.selectedClass;
    this.trainerId = selectedClass?.trainerId ?? null;
    this.saved = false;
    this.errorMessage = '';
    this.attendanceDraft = Object.fromEntries(
      this.trainees.map((trainee) => [trainee.id, null]),
    );
    this.changeHistory.set({});
    this.historyLoading.set({});
    this.historyErrors.set({});
    this.expandedHistoryId.set(null);
    this.attendanceReady.set(false);
    this.attendanceLoadFailed.set(false);
    if (classId === null) {
      this.attendanceLoading.set(false);
      return;
    }

    this.attendanceLoading.set(true);
    this.attendanceApi.getClassAttendance(classId).subscribe({
      next: (attendance) => {
        for (const [traineeId, status] of attendance) {
          if (Object.hasOwn(this.attendanceDraft, traineeId)) {
            this.attendanceDraft[traineeId] = status;
          }
        }
        this.attendanceReady.set(true);
        this.attendanceLoading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load class attendance', error);
        this.errorMessage =
          "Couldn't load saved attendance. Please try again.";
        this.attendanceLoadFailed.set(true);
        this.attendanceLoading.set(false);
      },
    });
  }

  protected statusFor(traineeId: number): AttendanceStatus | null {
    return this.attendanceDraft[traineeId] ?? null;
  }

  protected setStatus(traineeId: number, status: AttendanceStatus): void {
    this.attendanceDraft[traineeId] = status;
    this.saved = false;
    this.errorMessage = '';
  }

  protected toggleHistory(traineeId: number): void {
    if (this.expandedHistoryId() === traineeId) {
      this.expandedHistoryId.set(null);
      return;
    }

    this.expandedHistoryId.set(traineeId);
    if (Object.hasOwn(this.changeHistory(), traineeId)) {
      return;
    }
    this.loadChangeHistory(traineeId);
  }

  protected retryHistory(traineeId: number): void {
    this.loadChangeHistory(traineeId);
  }

  protected historyFor(traineeId: number): AttendanceChange[] {
    return this.changeHistory()[traineeId] ?? [];
  }

  protected statusLabel(status: AttendanceStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  protected saveAttendance(): void {
    const classItem = this.selectedClass;
    if (
      !classItem ||
      !this.attendanceReady() ||
      this.cohortId === null ||
      this.trainerId === null ||
      !this.trainees.length ||
      this.trainees.some((trainee) => this.statusFor(trainee.id) === null)
    ) {
      return;
    }

    const records: AttendanceEntry[] = [];
    for (const trainee of this.trainees) {
      const status = this.statusFor(trainee.id);
      if (status === null) {
        return;
      }
      records.push({ trainee_id: trainee.id, status });
    }
    this.errorMessage = '';
    this.saved = false;
    this.submitting.set(true);
    this.attendanceApi
      .saveAttendance(classItem.id, this.cohortId, this.trainerId, records)
      .subscribe({
        next: () => {
          this.saved = true;
          this.submitting.set(false);
          this.changeHistory.set({});
          const expandedTraineeId = this.expandedHistoryId();
          if (expandedTraineeId !== null) {
            this.loadChangeHistory(expandedTraineeId);
          }
        },
        error: (error: any) => {
          console.error('Failed to save attendance', error);
          let msg = error?.error?.detail? error.error.detail : "Couldn't save attendance. Please try again."
          this.errorMessage =  msg
            
          this.submitting.set(false);
        },
      });
  }

  protected completedCount(): number {
    return this.trainees.filter(
      (trainee) => this.statusFor(trainee.id) !== null,
    ).length;
  }

  private selectRequestedClass(): void {
    const requestedId = this.requestedClassId;
    if (requestedId === null || this.loading()) {
      return;
    }
    const cohort = this.cohorts().find((item) =>
      item.classes.some((classItem) => classItem.id === requestedId),
    );
    if (!cohort) {
      return;
    }
    this.cohortId = cohort.id;
    if (this.classId !== requestedId) {
      this.selectClass(requestedId);
    }
  }

  private loadChangeHistory(traineeId: number): void {
    const classId = this.classId;
    if (classId === null) {
      return;
    }

    this.historyLoading.update((loading) => ({
      ...loading,
      [traineeId]: true,
    }));
    this.historyErrors.update((errors) => {
      const next = { ...errors };
      delete next[traineeId];
      return next;
    });
    this.attendanceApi
      .getAttendanceChangeHistory(classId, traineeId)
      .subscribe({
        next: (history) => {
          if (this.classId !== classId) {
            return;
          }
          this.changeHistory.update((current) => ({
            ...current,
            [traineeId]: history,
          }));
          this.historyLoading.update((loading) => ({
            ...loading,
            [traineeId]: false,
          }));
        },
        error: (error: unknown) => {
          if (this.classId !== classId) {
            return;
          }
          console.error('Failed to load attendance change history', error);
          this.historyErrors.update((errors) => ({
            ...errors,
            [traineeId]: "Couldn't load change history. Try again.",
          }));
          this.historyLoading.update((loading) => ({
            ...loading,
            [traineeId]: false,
          }));
        },
      });
  }
}
