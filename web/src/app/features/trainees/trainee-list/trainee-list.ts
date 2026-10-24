import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { catchError, EMPTY, finalize, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TraineePage, TraineeApiService, TraineeSearchResult } from './trainee-api.service';

interface TraineePageRequest {
  query: string;
  page: number;
}

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
  private readonly pageRequests = new Subject<TraineePageRequest>();
  private readonly pageSize = 10;
  protected readonly trainees = signal<TraineeSearchResult[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected searchTerm = '';
  protected traineeName = '';
  protected showCreateForm = false;
  protected errorMessage = '';

  constructor() {
    this.pageRequests
      .pipe(
        switchMap(({ query, page }) => {
          this.loading.set(true);
          this.loadError.set(null);
          return this.traineeApi.search(query, page, this.pageSize).pipe(
            catchError((error: unknown) => {
              console.error('Failed to search trainees', error);
              this.loadError.set("Couldn't load trainees. Please try again.");
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.applyPage(result));
    this.loadTrainees();
  }

  protected get firstResultNumber(): number {
    return this.total() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1;
  }

  protected get lastResultNumber(): number {
    return Math.min(this.currentPage() * this.pageSize, this.total());
  }

  protected loadTrainees(): void {
    this.requestPage(this.currentPage());
  }

  protected onSearchChange(query: string): void {
    this.searchTerm = query;
    this.currentPage.set(1);
    this.requestPage(1);
  }

  protected changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.requestPage(page);
  }

  protected createTrainee(): void {
    if (this.traineeName.trim().length < 2) {
      this.errorMessage = 'Enter a trainee name with at least 2 characters.';
      return;
    }
    this.errorMessage = '';
    this.submitting.set(true);
    this.traineeApi.create(this.traineeName.trim()).subscribe({
      next: () => {
        this.searchTerm = '';
        this.currentPage.set(1);
        this.traineeName = '';
        this.showCreateForm = false;
        this.submitting.set(false);
        this.requestPage(1);
      },
      error: (error: unknown) => {
        console.error('Failed to create trainee', error);
        this.errorMessage = "Couldn't create trainee. Please try again.";
        this.submitting.set(false);
      },
    });
  }

  private requestPage(page: number): void {
    this.pageRequests.next({
      query: this.searchTerm.trim(),
      page,
    });
  }

  private applyPage(result: TraineePage): void {
    this.trainees.set(result.items);
    this.total.set(result.total);
    this.currentPage.set(result.page);
    this.totalPages.set(result.total_pages);
  }
}
