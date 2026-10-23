
import { Routes } from '@angular/router';

import { AppLayout } from './layout/app-layout/app-layout';
import { Dashboard } from './features/dashboard/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: '', component: Dashboard },
      {
        path: 'programs',
        loadComponent: () =>
          import('./features/programs/program-list/program-list').then(
            (module) => module.ProgramList,
          ),
      },
      {
        path: 'cohorts',
        loadComponent: () =>
          import('./features/cohorts/cohort-list/cohort-list').then(
            (module) => module.CohortList,
          ),
      },
      {
        path: 'trainers',
        loadComponent: () =>
          import('./features/trainers/trainer-list/trainer-list').then(
            (module) => module.TrainerList,
          ),
      },
      {
        path: 'trainees',
        loadComponent: () =>
          import('./features/trainees/trainee-list/trainee-list').then(
            (module) => module.TraineeList,
          ),
      },
      {
        path: 'enrollments',
        loadComponent: () =>
          import('./features/enrollments/enrollment-list/enrollment-list').then(
            (module) => module.EnrollmentList,
          ),
      },
      {
        path: 'classes',
        loadComponent: () =>
          import('./features/classes/class-list/class-list').then(
            (module) => module.ClassList,
          ),
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./features/attendance/take-attendance/take-attendance').then(
            (module) => module.TakeAttendance,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/cohort-report/cohort-report').then(
            (module) => module.CohortReport,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
