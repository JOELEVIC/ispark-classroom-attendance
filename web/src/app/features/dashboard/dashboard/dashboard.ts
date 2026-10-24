import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DashboardApiService, DashboardClass, DashboardStats } from './dashboard-api.service';

@Component({
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly dashboardApi = inject(DashboardApiService);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly todaysClasses = signal<DashboardClass[]>([]);
  protected readonly stats = signal([
    {
      label: 'Programs',
      value: '—',
      icon: 'library_books',
      color: 'blue',
      route: '/programs',
    },
    {
      label: 'Cohorts',
      value: '—',
      icon: 'groups',
      color: 'green',
      route: '/cohorts',
    },
    {
      label: 'Trainees',
      value: '—',
      icon: 'group',
      color: 'purple',
      route: '/trainees',
    },
    {
      label: 'Avg. Attendance',
      value: '—',
      icon: 'fact_check',
      color: 'amber',
      route: '/attendance',
    },
  ]);

  constructor() {
    this.loadStats();
  }

  protected loadStats(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.dashboardApi.getStats().subscribe({
      next: (dashboardStats) => {
        this.updateStats(dashboardStats);
        this.todaysClasses.set(dashboardStats.todaysClasses);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load dashboard statistics', error);
        this.errorMessage.set(
          "Dashboard counts couldn't be loaded. Check the API connection and try again.",
        );
        this.loading.set(false);
      },
    });
  }

  private updateStats(dashboardStats: DashboardStats): void {
    const values = [
      String(dashboardStats.programs),
      String(dashboardStats.cohorts),
      String(dashboardStats.trainees),
      dashboardStats.averageAttendance === null
        ? '—'
        : `${Math.round(dashboardStats.averageAttendance)}%`,
    ];
    this.stats.update((stats) => stats.map((stat, index) => ({ ...stat, value: values[index] })));
  }
}
