import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
  AttendanceStatus,
  MockClass,
  MockData,
  MockTrainee,
} from '../../../core/mock-data';

interface TraineeReportRow {
  trainee: MockTrainee;
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
  ],
  selector: 'app-cohort-report',
  styleUrl: './cohort-report.css',
  templateUrl: './cohort-report.html',
})
export class CohortReport {
  protected readonly data = inject(MockData);
  protected cohortId: number | null = this.data.cohorts[0]?.id ?? null;
  protected selectedTraineeId: number | null = null;
  protected selectedClassId: number | null = this.data.classes[0]?.id ?? null;

  protected get trainees(): MockTrainee[] {
    return this.cohortId === null ? [] : this.data.traineesFor(this.cohortId);
  }

  protected get classes(): MockClass[] {
    return this.cohortId === null ? [] : this.data.classesFor(this.cohortId);
  }

  protected get rows(): TraineeReportRow[] {
    return this.trainees.map((trainee) => {
      const statuses = this.classes
        .map((classItem) => classItem.attendance[trainee.id])
        .filter((status): status is AttendanceStatus => status !== undefined);
      const present = statuses.filter((status) => status === 'present').length;
      const absent = statuses.filter((status) => status === 'absent').length;
      const late = statuses.filter((status) => status === 'late').length;
      const excused = statuses.filter((status) => status === 'excused').length;
      const countable = present + absent + late;
      return {
        trainee,
        present,
        absent,
        late,
        excused,
        rate: countable === 0 ? null : ((present + late) / countable) * 100,
      };
    });
  }

  protected get selectedClass(): MockClass | undefined {
    return this.classes.find((classItem) => classItem.id === this.selectedClassId);
  }

  protected get historyTrainee(): MockTrainee | undefined {
    return this.trainees.find((trainee) => trainee.id === this.selectedTraineeId);
  }

  protected get cohortName(): string {
    const cohort = this.data.cohorts.find((item) => item.id === this.cohortId);
    return cohort
      ? `${this.data.programs.find((program) => program.id === cohort.programId)?.name ?? ''} · ${cohort.name}`
      : '';
  }

  protected programName(programId: number): string {
    return this.data.programs.find((program) => program.id === programId)?.name ?? '';
  }

  protected historyStatus(classItem: MockClass): AttendanceStatus | null {
    return this.historyTrainee
      ? classItem.attendance[this.historyTrainee.id] ?? null
      : null;
  }

  protected statusCount(status: AttendanceStatus): number {
    return this.selectedClass
      ? Object.values(this.selectedClass.attendance).filter(
          (item) => item === status,
        ).length
      : 0;
  }

  protected unmarkedTrainees(): MockTrainee[] {
    return this.selectedClass
      ? this.trainees.filter(
          (trainee) => !this.selectedClass?.attendance[trainee.id],
        )
      : [];
  }

  protected onCohortChange(): void {
    this.selectedTraineeId = null;
    this.selectedClassId = this.classes[0]?.id ?? null;
  }

  protected statusText(status: AttendanceStatus | null): string {
    return status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : 'Not marked';
  }
}
