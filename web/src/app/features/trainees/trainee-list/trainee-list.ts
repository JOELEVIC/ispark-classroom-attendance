import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MockData, MockTrainee } from '../../../core/mock-data';

@Component({
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  selector: 'app-trainee-list',
  styleUrl: './trainee-list.css',
  templateUrl: './trainee-list.html',
})
export class TraineeList {
  protected readonly data = inject(MockData);
  protected searchTerm = '';
  protected cohortId: number | null = null;
  protected traineeName = '';
  protected selectedTraineeId: number | null = null;
  protected enrollmentCohortId: number | null = null;
  protected showCreateForm = false;
  protected showEnrollForm = false;
  protected errorMessage = '';

  protected get filteredTrainees(): MockTrainee[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.data.trainees.filter((trainee) => {
      const matchesName = trainee.name.toLocaleLowerCase().includes(query);
      const matchesCohort =
        this.cohortId === null || trainee.cohortIds.includes(this.cohortId);
      return matchesName && matchesCohort;
    });
  }

  protected createTrainee(): void {
    if (this.traineeName.trim().length < 2) {
      this.errorMessage = 'Enter a trainee name with at least 2 characters.';
      return;
    }
    const trainee = this.data.createTrainee(this.traineeName);
    if (this.enrollmentCohortId !== null) {
      this.data.enrollTrainee(trainee.id, this.enrollmentCohortId);
    }
    this.traineeName = '';
    this.enrollmentCohortId = null;
    this.showCreateForm = false;
    this.errorMessage = '';
  }

  protected enrollExisting(): void {
    if (this.selectedTraineeId === null || this.enrollmentCohortId === null) {
      this.errorMessage = 'Choose a trainee and cohort to enroll.';
      return;
    }
    const trainee = this.data.trainees.find(
      (item) => item.id === this.selectedTraineeId,
    );
    if (trainee?.cohortIds.includes(this.enrollmentCohortId)) {
      this.errorMessage = 'This trainee is already enrolled in that cohort.';
      return;
    }
    this.data.enrollTrainee(this.selectedTraineeId, this.enrollmentCohortId);
    this.selectedTraineeId = null;
    this.enrollmentCohortId = null;
    this.showEnrollForm = false;
    this.errorMessage = '';
  }

  protected cohortName(cohortId: number): string {
    const cohort = this.data.cohorts.find((item) => item.id === cohortId);
    const program = this.data.programs.find(
      (item) => item.id === cohort?.programId,
    );
    return cohort ? `${program?.name ?? ''} · ${cohort.name}` : '';
  }
}
