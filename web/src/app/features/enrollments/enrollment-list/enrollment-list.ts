import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
  EnrolledTrainee,
  EnrollmentApiService,
  EnrollmentCohort,
  EnrollmentImportResult,
} from './enrollment-api.service';

@Component({
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  selector: 'app-enrollment-list',
  styleUrl: './enrollment-list.css',
  templateUrl: './enrollment-list.html',
})
export class EnrollmentList {
  private readonly enrollmentApi = inject(EnrollmentApiService);
  protected readonly cohorts = signal<EnrollmentCohort[]>([]);
  protected readonly trainees = signal<EnrolledTrainee[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly importing = signal(false);
  protected readonly importResult = signal<EnrollmentImportResult | null>(null);
  protected selectedCohortId: number | null = null;
  protected selectedTraineeId: number | null = null;
  protected selectedCsv: File | null = null;
  protected errorMessage = '';
  protected successMessage = '';
  protected importError = '';

  constructor() {
    this.loadDirectory();
  }

  protected get selectedCohort(): EnrollmentCohort | undefined {
    return this.cohorts().find((cohort) => cohort.id === this.selectedCohortId);
  }

  protected get availableTrainees(): EnrolledTrainee[] {
    const enrolledIds = new Set(this.selectedCohort?.trainees.map((trainee) => trainee.id) ?? []);
    return this.trainees().filter((trainee) => !enrolledIds.has(trainee.id));
  }

  protected loadDirectory(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.enrollmentApi.getDirectory().subscribe({
      next: ({ cohorts, trainees }) => {
        this.cohorts.set(cohorts);
        this.trainees.set(trainees);
        if (!cohorts.some((cohort) => cohort.id === this.selectedCohortId)) {
          this.selectedCohortId = cohorts[0]?.id ?? null;
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load enrollment data', error);
        this.loadError.set("Couldn't load enrollments. Please try again.");
        this.loading.set(false);
      },
    });
  }

  protected onCohortChange(): void {
    this.selectedTraineeId = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.importResult.set(null);
    this.importError = '';
  }

  protected onCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedCsv = input.files?.[0] ?? null;
    this.importResult.set(null);
    this.importError = '';
  }

  protected importCsv(): void {
    const cohortId = this.selectedCohortId;
    const file = this.selectedCsv;
    if (cohortId === null || file === null) {
      return;
    }

    this.importError = '';
    this.importResult.set(null);
    this.importing.set(true);
    this.enrollmentApi.importCsv(cohortId, file).subscribe({
      next: (result) => {
        if (this.selectedCohortId === cohortId) {
          this.importResult.set(result);
          this.loadDirectory();
        }
        this.importing.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to import enrollment CSV', error);
        if (this.selectedCohortId === cohortId) {
          this.importError =
            error instanceof HttpErrorResponse && typeof error.error?.detail === 'string'
              ? error.error.detail
              : "Couldn't import the CSV. Please check the file and try again.";
        }
        this.importing.set(false);
      },
    });
  }

  protected enrollTrainee(): void {
    const cohortId = this.selectedCohortId;
    const traineeId = this.selectedTraineeId;
    if (cohortId === null || traineeId === null) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.submitting.set(true);
    this.enrollmentApi.enroll(cohortId, traineeId).subscribe({
      next: () => {
        const trainee = this.trainees().find((item) => item.id === traineeId);
        if (trainee) {
          this.cohorts.update((cohorts) =>
            cohorts.map((cohort) =>
              cohort.id === cohortId
                ? { ...cohort, trainees: [...cohort.trainees, trainee] }
                : cohort,
            ),
          );
        }
        this.selectedTraineeId = null;
        this.successMessage = 'Trainee enrolled successfully.';
        this.submitting.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to enroll trainee', error);
        this.errorMessage = "Couldn't enroll trainee. They may already be in this cohort.";
        this.submitting.set(false);
      },
    });
  }
}
