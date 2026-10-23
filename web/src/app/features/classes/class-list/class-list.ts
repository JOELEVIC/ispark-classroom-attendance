import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { AttendanceStatus } from '../../../core/mock-data';
import {
  ClassApiService,
  ClassCohort,
  ClassCreate,
  ClassRecord,
} from './class-api.service';

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
  private readonly classApi = inject(ClassApiService);
  protected readonly cohorts = signal<ClassCohort[]>([]);
  protected readonly trainers = signal<ClassCohort['trainers']>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected cohortId: number | null = null;
  protected classDate = '';
  protected classTopic = '';
  protected trainerId: number | null = null;
  protected showCreateForm = false;
  protected selectedSummaryId: number | null = null;
  protected errorMessage = '';

  constructor() {
    this.loadDirectory();
  }

  protected get selectedCohort(): ClassCohort | undefined {
    return this.cohorts().find((cohort) => cohort.id === this.cohortId);
  }

  protected get classes(): ClassRecord[] {
    return this.selectedCohort?.classes ?? [];
  }

  protected get assignedTrainers() {
    return this.selectedCohort?.trainers ?? [];
  }

  protected get schedulableTrainers() {
    return this.trainers();
  }

  protected toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.errorMessage = '';
    if (this.showCreateForm) {
      this.setValidDefaultDate();
    }
  }

  protected loadDirectory(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.classApi.getDirectory().subscribe({
      next: ({ cohorts, trainers }) => {
        this.cohorts.set(cohorts);
        this.trainers.set(trainers);
        if (!cohorts.some((cohort) => cohort.id === this.cohortId)) {
          this.cohortId = cohorts[0]?.id ?? null;
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load classes', error);
        this.loadError.set("Couldn't load classes. Please try again.");
        this.loading.set(false);
      },
    });
  }

  protected onCohortChange(): void {
    this.trainerId = null;
    this.selectedSummaryId = null;
    this.errorMessage = '';
    if (this.showCreateForm) {
      this.setValidDefaultDate();
    }
  }

  protected createClass(): void {
    const cohort = this.selectedCohort;
    if (
      !cohort ||
      this.trainerId === null ||
      !this.classDate ||
      this.classTopic.trim().length < 2
    ) {
      this.errorMessage =
        'Choose a cohort and trainer, then add a date and topic.';
      return;
    }
    if (
      this.classDate < cohort.startDate ||
      this.classDate > cohort.endDate
    ) {
      this.errorMessage =
        `Choose a class date between ${this.formatDate(cohort.startDate)} ` +
        `and ${this.formatDate(cohort.endDate)}.`;
      return;
    }

    const payload: ClassCreate = {
      cohortId: cohort.id,
      trainerId: this.trainerId,
      date: this.classDate,
      topic: this.classTopic.trim(),
    };
    this.errorMessage = '';
    this.submitting.set(true);
    const trainerIsAssigned = cohort.trainers.some(
      (trainer) => trainer.id === payload.trainerId,
    );
    const schedule = () => this.saveClass(payload);

    if (trainerIsAssigned) {
      schedule();
      return;
    }

    this.errorMessage = '';
    this.submitting.set(true);
    this.classApi.assignTrainer(cohort.id, payload.trainerId).subscribe({
      next: () => {
        const trainer = this.trainers().find(
          (item) => item.id === payload.trainerId,
        );
        if (trainer) {
          this.cohorts.update((cohorts) =>
            cohorts.map((item) =>
              item.id === cohort.id
                ? { ...item, trainers: [...item.trainers, trainer] }
                : item,
            ),
          );
        }
        schedule();
      },
      error: (error: unknown) => {
        console.error('Failed to assign trainer before scheduling class', error);
        this.errorMessage =
          "Couldn't assign the selected trainer to this cohort. Please try again.";
        this.submitting.set(false);
      },
    });
  }

  protected countFor(classItem: ClassRecord, status: AttendanceStatus): number {
    return classItem.attendance.filter((value) => value === status).length;
  }

  protected unmarkedCount(classItem: ClassRecord): number {
    return Math.max(
      0,
      classItem.traineeCount - classItem.attendance.length,
    );
  }

  private setValidDefaultDate(): void {
    const cohort = this.selectedCohort;
    if (!cohort) {
      this.classDate = '';
      return;
    }
    if (
      this.classDate &&
      this.classDate >= cohort.startDate &&
      this.classDate <= cohort.endDate
    ) {
      return;
    }

    const today = new Date();
    const localToday = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    this.classDate =
      localToday < cohort.startDate
        ? cohort.startDate
        : localToday > cohort.endDate
          ? cohort.endDate
          : localToday;
  }

  private formatDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
    }).format(new Date(year, month - 1, day));
  }

  private saveClass(payload: ClassCreate): void {
    const cohort = this.cohorts().find((item) => item.id === payload.cohortId);
    if (!cohort) {
      this.errorMessage = "Couldn't schedule class. Please try again.";
      this.submitting.set(false);
      return;
    }

    this.classApi.create(payload).subscribe({
      next: (classItem) => {
        const trainer = cohort.trainers.find(
          (item) => item.id === classItem.trainerId,
        );
        const newClass = {
          ...classItem,
          cohortName: cohort.name,
          programName: cohort.programName,
          cohortStartDate: cohort.startDate,
          cohortEndDate: cohort.endDate,
          trainerName: trainer?.name ?? 'Trainer',
          traineeCount: cohort.traineeCount,
        };
        this.cohorts.update((cohorts) =>
          cohorts.map((item) =>
            item.id === cohort.id
              ? {
                  ...item,
                  classes: [...item.classes, newClass].sort((left, right) =>
                    left.date.localeCompare(right.date),
                  ),
                }
              : item,
          ),
        );
        this.classDate = '';
        this.classTopic = '';
        this.trainerId = null;
        this.showCreateForm = false;
        this.submitting.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to create class', error);
        this.errorMessage = "Couldn't schedule class. Please try again.";
        this.submitting.set(false);
      },
    });
  }
}
