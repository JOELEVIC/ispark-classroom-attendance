import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Dashboard } from './dashboard';
import { DashboardApiService } from './dashboard-api.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        {
          provide: DashboardApiService,
          useValue: {
            getStats: () =>
              of({
                programs: 3,
                cohorts: 5,
                trainees: 24,
                averageAttendance: 76.4,
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should link to the attendance page', () => {
    const link = fixture.nativeElement.querySelector(
      '.attendance-card',
    ) as HTMLAnchorElement;

    expect(link.textContent).toContain('Take Attendance');
    expect(link.getAttribute('href')).toBe('/attendance');
  });

  it('should provide links from each overview card to its feature page', () => {
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.stat-link'),
    ) as HTMLAnchorElement[];

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/programs',
      '/cohorts',
      '/trainees',
      '/attendance',
    ]);
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Go to Programs',
      'Go to Cohorts',
      'Go to Trainees',
      'Go to Avg. Attendance',
    ]);
  });

  it('should display dashboard counts from the API', () => {
    const dashboardElement = fixture.nativeElement as HTMLElement;
    const values = Array.from(
      dashboardElement.querySelectorAll('.stat-copy strong'),
    ).map((element) => element.textContent);

    expect(values).toEqual(['3', '5', '24', '76%']);
  });
});
