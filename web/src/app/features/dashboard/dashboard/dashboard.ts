import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  imports: [MatCardModule, MatIconModule, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly stats = [
    {
      label: 'Programs',
      value: '2',
      icon: 'library_books',
      color: 'blue',
    },
    { label: 'Cohorts', value: '2', icon: 'groups', color: 'green' },
    { label: 'Trainees', value: '12', icon: 'group', color: 'purple' },
    {
      label: 'Avg. Attendance',
      value: '68%',
      icon: 'fact_check',
      color: 'amber',
    },
  ];
}
