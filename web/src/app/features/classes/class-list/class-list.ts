import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { AttendanceStatus, MockClass, MockData } from '../../../core/mock-data';

@Component({
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
  ],
  selector: 'app-class-list',
  styleUrl: './class-list.css',
  templateUrl: './class-list.html',
})
export class ClassList {
  protected readonly data = inject(MockData);
  protected cohortId: number | null = this.data.cohorts[0]?.id ?? null;
  protected classDate = '';
  protected classTopic = '';
  protected trainerId: number | null = null;
  protected showCreateForm = false;
  protected selectedSummaryId: number | null = null;
  protected errorMessage = '';

  protected get classes(): MockClass[] {
    return this.cohortId === null ? [] : this.data.classesFor(this.cohortId);
  }

  protected get assignedTrainers() {
    return this.cohortId === null ? [] : this.data.trainersFor(this.cohortId);
  }

  protected createClass(): void {
    if (
      this.cohortId === null ||
      this.trainerId === null ||
      !this.classDate ||
      this.classTopic.trim().length < 2
    ) {
      this.errorMessage = 'Choose a cohort and trainer, then add a date and topic.';
      return;
    }
    const cohort = this.data.cohorts.find(
      (item) => item.id === this.cohortId,
    );
    if (
      !cohort ||
      this.classDate < cohort.startDate ||
      this.classDate > cohort.endDate
    ) {
      this.errorMessage = 'Class date must fall within the cohort dates.';
      return;
    }
    this.data.createClass(
      this.cohortId,
      this.trainerId,
      this.classDate,
      this.classTopic,
    );
    this.classDate = '';
    this.classTopic = '';
    this.trainerId = null;
    this.showCreateForm = false;
    this.errorMessage = '';
  }

  protected trainerName(trainerId: number): string {
    return this.data.trainers.find((item) => item.id === trainerId)?.name ?? 'Trainer';
  }

  protected programName(programId: number): string {
    return this.data.programs.find((item) => item.id === programId)?.name ?? '';
  }

  protected countFor(classItem: MockClass, status: AttendanceStatus): number {
    return Object.values(classItem.attendance).filter((value) => value === status).length;
  }

  protected unmarkedCount(classItem: MockClass): number {
    return Math.max(
      0,
      this.data.traineesFor(classItem.cohortId).length -
        Object.keys(classItem.attendance).length,
    );
  }
}
