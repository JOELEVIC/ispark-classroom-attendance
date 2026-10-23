import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
  ],
  selector: 'app-cohort-list',
  styleUrl: './cohort-list.css',
  templateUrl: './cohort-list.html',
})
export class CohortList {
  private readonly cohortApi = inject(CohortApiService);
  protected readonly programs = signal<CohortProgram[]>([]);
  protected readonly trainers = signal<CohortTrainer[]>([]);
  protected readonly trainees = signal<CohortTrainee[]>([]);
  protected readonly cohorts = signal<CohortRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected programFilterId: number | null = null;
  protected selectedCohortId: number | null = null;
  protected createProgramId: number | null = null;
  protected selectedTrainerId: number | null = null;
  protected selectedTraineeId: number | null = null;
  protected showCreateForm = false;
  protected cohortName = '';
  protected startDate = '';
  protected endDate = '';
  protected errorMessage = '';

  constructor() {
    this.loadDirectory();
  }

  protected get filteredCohorts(): CohortRecord[] {
    return this.cohorts().filter(
      (cohort) =>
        this.programFilterId === null ||
        cohort.programId === this.programFilterId,
    );
  }

  protected get selectedCohort(): CohortRecord | undefined {
    return this.cohorts().find(
      (cohort) => cohort.id === this.selectedCohortId,
    );
  }

  protected get availableTrainers(): CohortTrainer[] {
    const cohort = this.selectedCohort;
    return this.trainers().filter(
      (trainer) =>
        !cohort?.trainers.some((assigned) => assigned.id === trainer.id),
    );
  }

  protected get availableTrainees(): CohortTrainee[] {
    const cohort = this.selectedCohort;
    return this.trainees().filter(
      (trainee) =>
        !cohort?.trainees.some((enrolled) => enrolled.id === trainee.id),
    );
  }

  protected loadDirectory(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.cohortApi.listDirectory().subscribe({
      next: ({ programs, trainers, trainees, cohorts }) => {
        this.programs.set(programs);
        this.trainers.set(trainers);
        this.trainees.set(trainees);
        this.cohorts.set(cohorts);
        if (this.createProgramId === null) {
          this.createProgramId = programs[0]?.id ?? null;
        }
        if (!cohorts.some((cohort) => cohort.id === this.selectedCohortId)) {
          this.selectedCohortId = cohorts[0]?.id ?? null;
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
    if (
      this.selectedCohortId !== null &&
      !this.filteredCohorts.some(
        (cohort) => cohort.id === this.selectedCohortId,
      )
    ) {
      this.selectedCohortId = this.filteredCohorts[0]?.id ?? null;
      this.clearAssignmentSelections();
    }
  }

  protected selectCohort(cohortId: number): void {
    if (this.selectedCohortId !== cohortId) {
      this.selectedCohortId = cohortId;
      this.clearAssignmentSelections();
    }
    this.errorMessage = '';
  }

  protected openCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.errorMessage = '';
    if (this.createProgramId === null) {
      this.createProgramId = this.programs()[0]?.id ?? null;
    }
  }

  protected createCohort(): void {
    if (
      this.createProgramId === null ||
      this.cohortName.trim().length < 2 ||
      !this.startDate ||
      !this.endDate ||
      this.endDate <= this.startDate
    ) {
      this.errorMessage =
        'Choose a program, enter a cohort name, and select a valid date range.';
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
        const program = this.programs().find(
          (item) => item.id === cohort.programId,
        );
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
        this.errorMessage = "Couldn't create cohort. Please try again.";
        this.submitting.set(false);
      },
    });
  }

  protected assignTrainer(): void {
    const cohort = this.selectedCohort;
    const trainerId = this.selectedTrainerId;
    if (!cohort || trainerId === null) {
      return;
    }

    this.errorMessage = '';
    this.submitting.set(true);
    this.cohortApi.assignTrainer(cohort.id, trainerId).subscribe({
      next: () => {
        const trainer = this.trainers().find((item) => item.id === trainerId);
        if (trainer) {
          this.cohorts.update((cohorts) =>
            cohorts.map((item) =>
              item.id === cohort.id
                ? { ...item, trainers: [...item.trainers, trainer] }
                : item,
            ),
          );
        }
        this.selectedTrainerId = null;
        this.submitting.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to assign trainer to cohort', error);
        this.errorMessage =
          "Couldn't assign trainer. They may already be assigned to this cohort.";
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
    this.submitting.set(true);
    this.cohortApi.enrollTrainee(cohort.id, traineeId).subscribe({
      next: () => {
        const trainee = this.trainees().find((item) => item.id === traineeId);
        if (trainee) {
          this.cohorts.update((cohorts) =>
            cohorts.map((item) =>
              item.id === cohort.id
                ? { ...item, trainees: [...item.trainees, trainee] }
                : item,
            ),
          );
        }
        this.selectedTraineeId = null;
        this.submitting.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to enroll trainee', error);
        this.errorMessage =
          "Couldn't enroll trainee. They may already be in this cohort.";
        this.submitting.set(false);
      },
    });
  }

  private clearAssignmentSelections(): void {
    this.selectedTrainerId = null;
    this.selectedTraineeId = null;
  }
}
