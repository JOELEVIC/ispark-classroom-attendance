import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MockCohort, MockData } from '../../../core/mock-data';

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
  protected readonly data = inject(MockData);
  protected programId: number | null = null;
  protected selectedCohortId: number | null = this.data.cohorts[0]?.id ?? null;
  protected showCreateForm = false;
  protected cohortName = '';
  protected startDate = '';
  protected endDate = '';
  protected selectedTrainerId: number | null = null;
  protected errorMessage = '';

  protected get filteredCohorts(): MockCohort[] {
    return this.data.cohorts.filter(
      (cohort) => this.programId === null || cohort.programId === this.programId,
    );
  }

  protected get selectedCohort(): MockCohort | undefined {
    return this.data.cohorts.find(
      (cohort) => cohort.id === this.selectedCohortId,
    );
  }

  protected programName(programId: number): string {
    return this.data.programs.find((program) => program.id === programId)?.name ?? '';
  }

  protected onProgramChange(): void {
    if (
      this.selectedCohortId !== null &&
      !this.filteredCohorts.some(
        (cohort) => cohort.id === this.selectedCohortId,
      )
    ) {
      this.selectedCohortId = this.filteredCohorts[0]?.id ?? null;
    }
  }

  protected openCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.errorMessage = '';
  }

  protected createCohort(): void {
    if (
      this.programId === null ||
      !this.cohortName.trim() ||
      !this.startDate ||
      !this.endDate ||
      this.endDate <= this.startDate
    ) {
      this.errorMessage = 'Choose a program, name, and valid date range.';
      return;
    }
    const cohort = this.data.createCohort(
      this.programId,
      this.cohortName,
      this.startDate,
      this.endDate,
    );
    this.selectedCohortId = cohort.id;
    this.cohortName = '';
    this.showCreateForm = false;
  }

  protected assignTrainer(): void {
    if (!this.selectedCohort || this.selectedTrainerId === null) return;
    this.data.assignTrainer(this.selectedTrainerId, this.selectedCohort.id);
    this.selectedTrainerId = null;
  }

  protected cohortTraineeCount(cohortId: number): number {
    return this.data.traineesFor(cohortId).length;
  }

  protected cohortTrainerCount(cohortId: number): number {
    return this.data.trainersFor(cohortId).length;
  }
}
