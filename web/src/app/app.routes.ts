
import { Routes } from '@angular/router';

import { AppLayout } from './layout/app-layout/app-layout';
// import { Dashboard } from './features/dashboard/dashboard';
import { Dashboard } from './features/dashboard/dashboard/dashboard'
import { ProgramList } from './features/programs/program-list/program-list'
import { CohortList } from './features/cohorts/cohort-list/cohort-list'
import { TrainerList } from  './features/trainers/trainer-list/trainer-list'
import { TraineeList } from './features/trainees/trainee-list/trainee-list'
import { ClassList } from './features/classes/class-list/class-list';
import { TakeAttendance } from './features/attendance/take-attendance/take-attendance';
import { CohortReport } from './features/reports/cohort-report/cohort-report';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: '', component: Dashboard },
      { path: 'programs', component: ProgramList },
      { path: 'cohorts', component: CohortList },
      { path: 'trainers', component: TrainerList },
      { path: 'trainees', component: TraineeList },
      { path: 'classes', component: ClassList },
      { path: 'attendance', component: TakeAttendance },
      { path: 'reports', component: CohortReport },
    ],
  },
  { path: '**', redirectTo: '' },
];
