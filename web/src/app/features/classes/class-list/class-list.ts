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
  RepeatingClassCreate,
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
  protected scheduleMode: 'single' | 'repeating' = 'single';
  protected selectedWeekdays: number[] = [];
  protected readonly weekdays = [
    { value: 0, label: 'Mon' },
    { value: 1, label: 'Tue' },
    { value: 2, label: 'Wed' },
    { value: 3, label: 'Thu' },
    { value: 4, label: 'Fri' },
    { value: 5, label: 'Sat' },
    { value: 6, label: 'Sun' },
  ];
  protected showCreateForm = false;
  protected selectedSummaryId: number | null = null;
  protected errorMessage = '';
  protected scheduleMessage = '';

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
    this.scheduleMessage = '';
    if (this.showCreateForm) {
      this.setValidDefaultDate();
    }
  }

  protected toggleWeekday(day: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedWeekdays = checked
      ? [...this.selectedWeekdays, day].sort((left, right) => left - right)
      : this.selectedWeekdays.filter((selectedDay) => selectedDay !== day);
    this.errorMessage = '';
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
    this.scheduleMessage = '';
    if (this.showCreateForm) {
      this.setValidDefaultDate();
    }
  }

  protected createClass(): void {
    if (this.scheduleMode === 'repeating') {
      this.createRepeatingClasses();
      return;
    }

    const cohort = this.selectedCohort;
    if (
      !cohort ||
      this.trainerId === null ||
      !this.classDate ||
      this.classTopic.trim().length < 2
    ) {
      this.errorMessage = 'Choose a cohort and trainer, then add a date and topic.';
      return;
    }
    if (this.classDate < cohort.startDate || this.classDate > cohort.endDate) {
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
    const trainerIsAssigned = cohort.trainers.some((trainer) => trainer.id === payload.trainerId);
    const schedule = () => this.saveClass(payload);

    if (trainerIsAssigned) {
      schedule();
      return;
    }

    this.errorMessage = '';
    this.submitting.set(true);
    this.classApi.assignTrainer(cohort.id, payload.trainerId).subscribe({
      next: () => {
        const trainer = this.trainers().find((item) => item.id === payload.trainerId);
        if (trainer) {
          this.cohorts.update((cohorts) =>
            cohorts.map((item) =>
              item.id === cohort.id ? { ...item, trainers: [...item.trainers, trainer] } : item,
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

  protected createRepeatingClasses(): void {
    const cohort = this.selectedCohort;
    if (
      !cohort ||
      this.trainerId === null ||
      this.selectedWeekdays.length === 0 ||
      this.classTopic.trim().length < 2
    ) {
      this.errorMessage = 'Choose at least one weekday and trainer, then enter a topic.';
      return;
    }

    const payload: RepeatingClassCreate = {
      cohortId: cohort.id,
      trainerId: this.trainerId,
      weekdays: this.selectedWeekdays,
      topic: this.classTopic.trim(),
    };
    this.errorMessage = '';
    this.scheduleMessage = '';
    this.submitting.set(true);

    const schedule = () => {
      this.classApi.createRepeating(payload).subscribe({
        next: (result) => {
          const currentCohort = this.cohorts().find((item) => item.id === payload.cohortId);
          if (!currentCohort) {
            this.errorMessage = "Couldn't schedule classes. Please try again.";
            this.submitting.set(false);
            return;
          }
          const trainer = this.trainers().find((item) => item.id === payload.trainerId);
          const newClasses = result.classes.map((classItem) => ({
            ...classItem,
            cohortName: currentCohort.name,
            programName: currentCohort.programName,
            cohortStartDate: currentCohort.startDate,
            cohortEndDate: currentCohort.endDate,
            trainerName: trainer?.name ?? 'Trainer',
            traineeCount: currentCohort.traineeCount,
          }));
          this.cohorts.update((cohorts) =>
            cohorts.map((item) =>
              item.id === currentCohort.id
                ? {
                    ...item,
                    classes: [...item.classes, ...newClasses].sort((left, right) =>
                      left.date.localeCompare(right.date),
                    ),
                  }
                : item,
            ),
          );
          this.scheduleMessage =
            `Scheduled ${result.createdCount} classes.` +
            (result.skippedDates.length
              ? ` Skipped ${result.skippedDates.length} date(s) that already had a class: ` +
                result.skippedDates.map((date) => this.formatDate(date)).join(', ')
              : '');
          this.classTopic = '';
          this.trainerId = null;
          this.selectedWeekdays = [];
          this.showCreateForm = false;
          this.submitting.set(false);
        },
        error: (error: unknown) => {
          console.error('Failed to create repeating class schedule', error);
          this.errorMessage = "Couldn't schedule classes. Please try again.";
          this.submitting.set(false);
        },
      });
    };

    if (cohort.trainers.some((trainer) => trainer.id === payload.trainerId)) {
      schedule();
      return;
    }

    this.classApi.assignTrainer(cohort.id, payload.trainerId).subscribe({
      next: () => {
        const trainer = this.trainers().find((item) => item.id === payload.trainerId);
        if (trainer) {
          this.cohorts.update((cohorts) =>
            cohorts.map((item) =>
              item.id === cohort.id ? { ...item, trainers: [...item.trainers, trainer] } : item,
            ),
          );
        }
        schedule();
      },
      error: (error: unknown) => {
        console.error('Failed to assign trainer before recurring schedule', error);
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
    return Math.max(0, classItem.traineeCount - classItem.attendance.length);
  }

  private setValidDefaultDate(): void {
    const cohort = this.selectedCohort;
    if (!cohort) {
      this.classDate = '';
      return;
    }
    if (this.classDate && this.classDate >= cohort.startDate && this.classDate <= cohort.endDate) {
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
        const trainer = cohort.trainers.find((item) => item.id === classItem.trainerId);
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
        this.scheduleMessage = '';
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
