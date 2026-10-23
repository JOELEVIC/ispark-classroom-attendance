import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DashboardApiService, DashboardStats } from './dashboard-api.service';

@Component({
  imports: [MatCardModule, MatIconModule, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly dashboardApi = inject(DashboardApiService);
  protected loading = true;
  protected errorMessage: string | null = null;
  protected readonly stats = [
    {
      label: 'Programs',
      value: '—',
      icon: 'library_books',
      color: 'blue',
    },
    { label: 'Cohorts', value: '—', icon: 'groups', color: 'green' },
    { label: 'Trainees', value: '—', icon: 'group', color: 'purple' },
    {
      label: 'Avg. Attendance',
      value: '—',
      icon: 'fact_check',
      color: 'amber',
    },
  ];

  constructor() {
    this.loadStats();
  }

  protected loadStats(): void {
    this.loading = true;
    this.errorMessage = null;

    this.dashboardApi.getStats().subscribe({
      next: (dashboardStats) => {
        this.updateStats(dashboardStats);
        this.loading = false;
      },
      error: () => {
        this.errorMessage =
          "Dashboard counts couldn't be loaded. Check the API connection and try again.";
        this.loading = false;
      },
    });
  }

  private updateStats(dashboardStats: DashboardStats): void {
    this.stats[0].value = String(dashboardStats.programs);
    this.stats[1].value = String(dashboardStats.cohorts);
    this.stats[2].value = String(dashboardStats.trainees);
    this.stats[3].value =
      dashboardStats.averageAttendance === null
        ? '—'
        : `${Math.round(dashboardStats.averageAttendance)}%`;
  }
}
