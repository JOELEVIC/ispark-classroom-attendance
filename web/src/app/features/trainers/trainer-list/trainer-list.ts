import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TrainerApiService, TrainerRecord } from './trainer-api.service';

@Component({
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  selector: 'app-trainer-list',
  styleUrl: './trainer-list.css',
  templateUrl: './trainer-list.html',
})
export class TrainerList {
  private readonly trainerApi = inject(TrainerApiService);
  protected readonly trainers = signal<TrainerRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected searchTerm = '';
  protected trainerName = '';
  protected showCreateForm = false;
  protected errorMessage = '';

  constructor() {
    this.loadTrainers();
  }

  protected get filteredTrainers() {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.trainers().filter((trainer) =>
      trainer.name.toLocaleLowerCase().includes(query),
    );
  }

  protected loadTrainers(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.trainerApi.list().subscribe({
      next: (trainers) => {
        this.trainers.set(trainers);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load trainers', error);
        this.loadError.set("Couldn't load trainers. Please try again.");
        this.loading.set(false);
      },
    });
  }

  protected createTrainer(): void {
    if (this.trainerName.trim().length < 2) {
      this.errorMessage = 'Enter a trainer name with at least 2 characters.';
      return;
    }
    this.errorMessage = '';
    this.submitting.set(true);
    this.trainerApi.create(this.trainerName.trim()).subscribe({
      next: (trainer) => {
        this.trainers.update((trainers) =>
          [...trainers, trainer].sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
        );
        this.trainerName = '';
        this.showCreateForm = false;
        this.submitting.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to create trainer', error);
        this.errorMessage = "Couldn't create trainer. Please try again.";
        this.submitting.set(false);
      },
    });
  }

}
