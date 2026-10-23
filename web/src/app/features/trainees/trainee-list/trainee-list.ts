import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Trainee, TraineeApiService } from './trainee-api.service';

@Component({
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  selector: 'app-trainee-list',
  styleUrl: './trainee-list.css',
  templateUrl: './trainee-list.html',
})
export class TraineeList {
  private readonly traineeApi = inject(TraineeApiService);
  protected readonly trainees = signal<Trainee[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected searchTerm = '';
  protected traineeName = '';
  protected showCreateForm = false;
  protected errorMessage = '';

  constructor() {
    this.loadTrainees();
  }

  protected get filteredTrainees(): Trainee[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.trainees().filter((trainee) =>
      trainee.name.toLocaleLowerCase().includes(query),
    );
  }

  protected loadTrainees(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.traineeApi.list().subscribe({
      next: (trainees) => {
        this.trainees.set(trainees);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load trainees', error);
        this.loadError.set("Couldn't load trainees. Please try again.");
        this.loading.set(false);
      },
    });
  }

  protected createTrainee(): void {
    if (this.traineeName.trim().length < 2) {
      this.errorMessage = 'Enter a trainee name with at least 2 characters.';
      return;
    }
    this.errorMessage = '';
    this.submitting.set(true);
    this.traineeApi.create(this.traineeName.trim()).subscribe({
      next: (trainee) => {
        this.trainees.update((trainees) =>
          [...trainees, trainee].sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
        );
        this.traineeName = '';
        this.showCreateForm = false;
        this.submitting.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to create trainee', error);
        this.errorMessage = "Couldn't create trainee. Please try again.";
        this.submitting.set(false);
      },
    });
  }
}
