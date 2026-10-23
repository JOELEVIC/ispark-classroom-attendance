import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { AttendanceStatus, MockClass, MockData } from '../../../core/mock-data';

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
  protected readonly data = inject(MockData);
  protected readonly statuses: AttendanceStatus[] = [
    'present',
    'absent',
    'late',
    'excused',
  ];
  private readonly route = inject(ActivatedRoute);
  protected cohortId: number | null = this.data.cohorts[0]?.id ?? null;
  protected classId: number | null = null;
  protected trainerId: number | null = null;
  protected attendanceDraft: Record<number, AttendanceStatus | null> = {};
  protected saved = false;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const queryClassId = Number(params.get('classId'));
      if (!Number.isNaN(queryClassId) && queryClassId > 0) {
        const classItem = this.data.classes.find(
          (item) => item.id === queryClassId,
        );
        if (classItem) {
          this.cohortId = classItem.cohortId;
          this.selectClass(classItem.id);
        }
      }
    });
    if (this.classId === null && this.classes.length) {
      this.selectClass(this.classes[0].id);
    } else {
      this.refreshDraft();
    }
  }

  protected get classes(): MockClass[] {
    return this.cohortId === null ? [] : this.data.classesFor(this.cohortId);
  }

  protected get trainees() {
    return this.cohortId === null ? [] : this.data.traineesFor(this.cohortId);
  }

  protected get trainers() {
    return this.cohortId === null ? [] : this.data.trainersFor(this.cohortId);
  }

  protected get selectedClass(): MockClass | undefined {
    return this.data.classes.find((item) => item.id === this.classId);
  }

  protected onCohortChange(): void {
    this.classId = null;
    this.trainerId = null;
    this.saved = false;
    this.refreshDraft();
  }

  protected selectClass(classId: number | null): void {
    this.classId = classId;
    const classItem = this.selectedClass;
    this.trainerId = classItem?.trainerId ?? this.trainers[0]?.id ?? null;
    this.saved = false;
    this.refreshDraft();
  }

  protected statusFor(traineeId: number): AttendanceStatus | null {
    return (
      this.attendanceDraft[traineeId] ??
      this.selectedClass?.attendance[traineeId] ??
      null
    );
  }

  protected setStatus(traineeId: number, status: AttendanceStatus): void {
    this.attendanceDraft[traineeId] = status;
    this.saved = false;
  }

  protected saveAttendance(): void {
    if (
      this.classId === null ||
      !this.trainees.length ||
      this.trainees.some((trainee) => this.statusFor(trainee.id) === null)
    ) {
      return;
    }
    const records: Record<number, AttendanceStatus> = {};
    this.trainees.forEach((trainee) => {
      const status = this.statusFor(trainee.id);
      if (status !== null) records[trainee.id] = status;
    });
    this.data.recordAttendance(this.classId, records);
    this.saved = true;
  }

  protected completedCount(): number {
    return this.trainees.filter(
      (trainee) => this.statusFor(trainee.id) !== null,
    ).length;
  }

  protected statusLabel(status: AttendanceStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  protected programName(programId: number): string {
    return this.data.programs.find((item) => item.id === programId)?.name ?? '';
  }

  private refreshDraft(): void {
    this.attendanceDraft = {};
    if (this.selectedClass) {
      this.trainees.forEach((trainee) => {
        this.attendanceDraft[trainee.id] =
          this.selectedClass?.attendance[trainee.id] ?? null;
      });
    }
  }
}
