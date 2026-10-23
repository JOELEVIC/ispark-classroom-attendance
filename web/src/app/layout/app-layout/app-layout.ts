import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  selector: 'app-app-layout',
  styleUrl: './app-layout.css',
  templateUrl: './app-layout.html',
})
export class AppLayout {
  protected readonly navigation = [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'Programs', path: '/programs', icon: 'library_books' },
    { label: 'Cohorts', path: '/cohorts', icon: 'groups' },
    { label: 'Trainers', path: '/trainers', icon: 'school' },
    { label: 'Trainees', path: '/trainees', icon: 'person' },
    { label: 'Classes', path: '/classes', icon: 'calendar_month' },
    { label: 'Attendance', path: '/attendance', icon: 'fact_check' },
    { label: 'Reports', path: '/reports', icon: 'bar_chart' },
  ];

  protected readonly mobileNavigation = this.navigation.filter(({ label }) =>
    ['Home', 'Programs', 'Attendance'].includes(label),
  );
  protected readonly secondaryNavigation = this.navigation.filter(
    ({ label }) => !['Home', 'Programs', 'Attendance'].includes(label),
  );
}
