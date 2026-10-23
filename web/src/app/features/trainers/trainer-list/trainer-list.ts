import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MockData } from '../../../core/mock-data';

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
  selector: 'app-trainer-list',
  styleUrl: './trainer-list.css',
  templateUrl: './trainer-list.html',
})
export class TrainerList {
  protected readonly data = inject(MockData);
  protected searchTerm = '';
  protected trainerName = '';
  protected selectedCohortId: number | null = null;
  protected showCreateForm = false;
  protected showAssignFormFor: number | null = null;
  protected errorMessage = '';

  protected get filteredTrainers() {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.data.trainers.filter((trainer) =>
      trainer.name.toLocaleLowerCase().includes(query),
    );
  }

  protected createTrainer(): void {
    if (this.trainerName.trim().length < 2) {
      this.errorMessage = 'Enter a trainer name with at least 2 characters.';
      return;
    }
    this.data.createTrainer(this.trainerName);
    this.trainerName = '';
    this.errorMessage = '';
    this.showCreateForm = false;
  }

  protected assignTrainer(trainerId: number): void {
    if (this.selectedCohortId === null) {
      this.errorMessage = 'Choose a cohort first.';
      return;
    }
    this.data.assignTrainer(trainerId, this.selectedCohortId);
    this.showAssignFormFor = null;
    this.selectedCohortId = null;
    this.errorMessage = '';
  }

  protected cohortNames(cohortIds: number[]): string {
    return cohortIds
      .map((id) => {
        const cohort = this.data.cohorts.find((item) => item.id === id);
        const program = this.data.programs.find(
          (item) => item.id === cohort?.programId,
        );
        return cohort ? `${program?.name ?? ''} · ${cohort.name}` : '';
      })
      .filter(Boolean)
      .join(', ');
  }

  protected programName(programId: number): string {
    return this.data.programs.find((program) => program.id === programId)?.name ?? '';
  }
}
