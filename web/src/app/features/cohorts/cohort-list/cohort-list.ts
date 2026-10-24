import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  EnrollmentApiService,
  EnrollmentImportResult,
} from '../../enrollments/enrollment-list/enrollment-api.service';
import {
  CohortApiService,
  CohortCreate,
  CohortProgram,
  CohortRecord,
  CohortTrainer,
  CohortTrainee,
} from './cohort-api.service';

@Component({
  imports: [
    FormsModule,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
  ],
  selector: 'app-cohort-list',
  styleUrl: './cohort-list.css',
  templateUrl: './cohort-list.html',
})
export class CohortList {
  private readonly cohortApi = inject(CohortApiService);
  private readonly enrollmentApi = inject(EnrollmentApiService);
  private readonly route = inject(ActivatedRoute);
  protected readonly programs = signal<CohortProgram[]>([]);
  protected readonly trainers = signal<CohortTrainer[]>([]);
  protected readonly trainees = signal<CohortTrainee[]>([]);
  protected readonly cohorts = signal<CohortRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly finishing = signal(false);
  protected readonly confirmingFinishId = signal<number | null>(null);
  protected readonly importingCsv = signal(false);
  protected readonly csvImportResult = signal<EnrollmentImportResult | null>(null);
  protected programFilterId: number | null = null;
  protected selectedCohortId: number | null = null;
  protected createProgramId: number | null = null;
  protected selectedTrainerId: number | null = null;
  protected selectedTraineeId: number | null = null;
  protected showCreateForm = false;
  protected showFinished = false;
  protected cohortName = '';
  protected startDate = '';
  protected endDate = '';
  protected errorMessage = '';
  protected successMessage = '';
  protected csvImportError = '';
  protected selectedCsv: File | null = null;
  private csvFileInput: HTMLInputElement | null = null;

  constructor() {
    this.loadDirectory();
  }

  protected get filteredCohorts(): CohortRecord[] {
    return this.cohorts().filter(
      (cohort) => this.programFilterId === null || cohort.programId === this.programFilterId,
    );
  }

  protected get selectedCohort(): CohortRecord | undefined {
    return this.cohorts().find((cohort) => cohort.id === this.selectedCohortId);
  }

  protected get availableTrainers(): CohortTrainer[] {
    const cohort = this.selectedCohort;
    return this.trainers().filter(
      (trainer) => !cohort?.trainers.some((assigned) => assigned.id === trainer.id),
    );
  }

  protected get availableTrainees(): CohortTrainee[] {
    const cohort = this.selectedCohort;
    return this.trainees().filter(
      (trainee) => !cohort?.trainees.some((enrolled) => enrolled.id === trainee.id),
    );
  }

  protected loadDirectory(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.cohortApi.listDirectory(this.showFinished).subscribe({
      next: ({ programs, trainers, trainees, cohorts }) => {
        this.programs.set(programs);
        this.trainers.set(trainers);
        this.trainees.set(trainees);
        this.cohorts.set(cohorts);
        if (this.createProgramId === null) {
          this.createProgramId = programs[0]?.id ?? null;
        }
        if (!cohorts.some((cohort) => cohort.id === this.selectedCohortId)) {
          const requestedCohortId = Number(this.route.snapshot.queryParamMap.get('cohortId'));
          this.selectedCohortId = cohorts.some((cohort) => cohort.id === requestedCohortId)
            ? requestedCohortId
            : (cohorts[0]?.id ?? null);
        }
        this.onProgramChange();
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load cohorts', error);
        this.loadError.set("Couldn't load cohorts. Please try again.");
        this.loading.set(false);
      },
    });
  }

  protected onProgramChange(): void {
    this.successMessage = '';
    if (
      this.selectedCohortId !== null &&
      !this.filteredCohorts.some((cohort) => cohort.id === this.selectedCohortId)
    ) {
      this.selectedCohortId = this.filteredCohorts[0]?.id ?? null;
      this.clearAssignmentSelections();
      this.clearCsvImport();
    }
  }

  protected selectCohort(cohortId: number): void {
    this.successMessage = '';
    if (this.selectedCohortId !== cohortId) {
      this.selectedCohortId = cohortId;
      this.clearAssignmentSelections();
    }
    this.errorMessage = '';
    this.clearCsvImport();
  }

  protected toggleFinished(): void {
    this.showFinished = !this.showFinished;
    this.confirmingFinishId.set(null);
    this.loadDirectory();
  }

  protected requestFinish(cohortId: number): void {
    this.confirmingFinishId.set(cohortId);
    this.errorMessage = '';
    this.successMessage = '';
  }

  protected cancelFinish(): void {
    this.confirmingFinishId.set(null);
  }

  protected finishCohort(cohort: CohortRecord): void {
    if (this.confirmingFinishId() !== cohort.id) {
      return;
    }
    this.finishing.set(true);
    this.errorMessage = '';
    this.cohortApi.finish(cohort.id).subscribe({
      next: () => {
        this.showFinished = true;
        this.confirmingFinishId.set(null);
        this.successMessage = `${cohort.name} is now finished and read-only.`;
        this.finishing.set(false);
        this.loadDirectory();
      },
      error: (error: unknown) => {
        console.error('Failed to finish cohort', error);
        this.errorMessage = "Couldn't finish cohort. Please try again.";
        this.finishing.set(false);
      },
    });
  }

  protected onCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.csvFileInput = input;
    this.selectedCsv = input.files?.[0] ?? null;
    this.csvImportResult.set(null);
    this.csvImportError = '';
  }

  protected importCsv(): void {
    const cohort = this.selectedCohort;
    const file = this.selectedCsv;
    if (!cohort || !file) {
      return;
    }

    this.csvImportError = '';
    this.csvImportResult.set(null);
    this.importingCsv.set(true);
    this.enrollmentApi.importCsv(cohort.id, file).subscribe({
      next: (result) => {
        if (this.selectedCohortId === cohort.id) {
          this.csvImportResult.set(result);
          this.loadDirectory();
        }
        this.selectedCsv = null;
        if (this.csvFileInput) {
          this.csvFileInput.value = '';
        }
        this.importingCsv.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to import cohort enrollment CSV', error);
        if (this.selectedCohortId === cohort.id) {
          this.csvImportError =
            error instanceof HttpErrorResponse && typeof error.error?.detail === 'string'
              ? error.error.detail
              : "Couldn't import the CSV. Please check the file and try again.";
        }
        this.importingCsv.set(false);
      },
    });
  }

  protected openCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.errorMessage = '';
    this.successMessage = '';
    if (this.createProgramId === null) {
      this.createProgramId = this.programs()[0]?.id ?? null;
    }
  }

  protected createCohort(): void {
    if (this.createProgramId === null) {
      this.errorMessage = 'Choose a program for this cohort.';
      return;
    }
    if (this.cohortName.trim().length < 2) {
      this.errorMessage = 'Cohort name must be at least 2 characters.';
      return;
    }
    if (this.cohortName.trim().length > 150) {
      this.errorMessage = 'Cohort name must be 150 characters or fewer.';
      return;
    }
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Choose both a start date and an end date.';
      return;
    }
    if (this.endDate <= this.startDate) {
      this.errorMessage = 'End date must be after start date.';
      return;
    }

    const payload: CohortCreate = {
      programId: this.createProgramId,
      name: this.cohortName.trim(),
      startDate: this.startDate,
      endDate: this.endDate,
    };
    this.errorMessage = '';
    this.submitting.set(true);
    this.cohortApi.create(payload).subscribe({
      next: (cohort) => {
        const program = this.programs().find((item) => item.id === cohort.programId);
        const createdCohort = {
          ...cohort,
          programName: program?.name ?? '',
        };
        this.cohorts.update((cohorts) => [...cohorts, createdCohort]);
        this.programFilterId = null;
        this.selectedCohortId = createdCohort.id;
        this.clearAssignmentSelections();
        this.cohortName = '';
        this.startDate = '';
        this.endDate = '';
        this.showCreateForm = false;
        this.submitting.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to create cohort', error);
        this.errorMessage = this.getCohortCreationError(error);
        this.submitting.set(false);
      },
    });
  }

  private getCohortCreationError(error: unknown): string {
    const fallback = "Couldn't create cohort. Please try again.";
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const detail: unknown = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (!Array.isArray(detail)) {
      return fallback;
    }

    const fieldLabels: Record<string, string> = {
      end_date: 'End date',
      name: 'Cohort name',
      program_id: 'Program',
      start_date: 'Start date',
    };
    const messages = detail
      .map((issue: unknown) => {
        if (!issue || typeof issue !== 'object') {
          return null;
        }
        const validationIssue = issue as { loc?: unknown; msg?: unknown; type?: unknown };
        const field = Array.isArray(validationIssue.loc) ? validationIssue.loc.at(-1) : undefined;
        const message = typeof validationIssue.msg === 'string' ? validationIssue.msg : '';
        if (field === 'name' && validationIssue.type === 'string_too_short') {
          return 'Cohort name must be at least 2 characters.';
        }
        if (field === 'name' && validationIssue.type === 'string_too_long') {
          return 'Cohort name must be 150 characters or fewer.';
        }
        if (field === 'program_id') {
          return 'Choose an existing program.';
        }
        if (message.startsWith('Value error, ')) {
          return message.slice('Value error, '.length);
        }
        const label = typeof field === 'string' ? fieldLabels[field] : undefined;
        return message ? (label ? `${label}: ${message}.` : message) : null;
      })
      .filter((message): message is string => message !== null);

    return messages.length ? messages.join(' ') : fallback;
  }

  protected assignTrainer(): void {
    const cohort = this.selectedCohort;
    const trainerId = this.selectedTrainerId;
    if (!cohort || trainerId === null) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.submitting.set(true);
    this.cohortApi.assignTrainer(cohort.id, trainerId).subscribe({
      next: () => {
        const trainer = this.trainers().find((item) => item.id === trainerId);
        if (trainer) {
          this.cohorts.update((cohorts) =>
            cohorts.map((item) =>
              item.id === cohort.id ? { ...item, trainers: [...item.trainers, trainer] } : item,
            ),
          );
        }
        this.successMessage = trainer
          ? `${trainer.name} assigned to ${cohort.name}.`
          : 'Trainer assigned to cohort.';
        this.selectedTrainerId = null;
        this.submitting.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to assign trainer to cohort', error);
        this.errorMessage = "Couldn't assign trainer. They may already be assigned to this cohort.";
        this.submitting.set(false);
      },
    });
  }

  protected enrollTrainee(): void {
    const cohort = this.selectedCohort;
    const traineeId = this.selectedTraineeId;
    if (!cohort || traineeId === null) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.submitting.set(true);
    this.cohortApi.enrollTrainee(cohort.id, traineeId).subscribe({
      next: () => {
        const trainee = this.trainees().find((item) => item.id === traineeId);
        if (trainee) {
          this.cohorts.update((cohorts) =>
            cohorts.map((item) =>
              item.id === cohort.id ? { ...item, trainees: [...item.trainees, trainee] } : item,
            ),
          );
        }
        this.successMessage = trainee
          ? `${trainee.name} enrolled in ${cohort.name}.`
          : 'Trainee enrolled in cohort.';
        this.selectedTraineeId = null;
        this.submitting.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to enroll trainee', error);
        this.errorMessage = "Couldn't enroll trainee. They may already be in this cohort.";
        this.submitting.set(false);
      },
    });
  }

  private clearAssignmentSelections(): void {
    this.selectedTrainerId = null;
    this.selectedTraineeId = null;
  }

  private clearCsvImport(): void {
    this.selectedCsv = null;
    if (this.csvFileInput) {
      this.csvFileInput.value = '';
    }
    this.csvFileInput = null;
    this.csvImportResult.set(null);
    this.csvImportError = '';
  }
}
