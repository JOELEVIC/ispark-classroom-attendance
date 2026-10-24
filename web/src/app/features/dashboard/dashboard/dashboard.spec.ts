import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Dashboard } from './dashboard';
import { DashboardApiService } from './dashboard-api.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let dashboardApi: { getStats: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dashboardApi = {
      getStats: vi.fn().mockReturnValue(
        of({
          programs: 3,
          cohorts: 5,
          trainees: 24,
          averageAttendance: 76.4,
          todaysClasses: [],
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), { provide: DashboardApiService, useValue: dashboardApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers class scheduling when there is no class today', () => {
    const link = fixture.nativeElement.querySelector('.attendance-card') as HTMLAnchorElement;

    expect(link.textContent).toContain('No class scheduled today');
    expect(link.getAttribute('href')).toBe('/classes');
  });

  it('opens the only class scheduled today directly', async () => {
    dashboardApi.getStats.mockReturnValue(
      of({
        programs: 3,
        cohorts: 5,
        trainees: 24,
        averageAttendance: 76.4,
        todaysClasses: [
          {
            id: 30,
            cohortId: 10,
            cohortName: 'Cohort A',
            programName: 'Web Development',
            date: '2026-10-24',
            topic: 'HTML',
          },
        ],
      }),
    );
    const todayFixture = TestBed.createComponent(Dashboard);
    await todayFixture.whenStable();
    todayFixture.detectChanges();

    const link = todayFixture.nativeElement.querySelector('.attendance-card') as HTMLAnchorElement;
    expect(link.textContent).toContain('Web Development');
    expect(link.textContent).toContain('Cohort A');
    expect(link.textContent).toContain('HTML');
    expect(link.getAttribute('href')).toBe('/attendance?classId=30');
  });

  it('asks the user to choose when multiple classes are scheduled today', async () => {
    dashboardApi.getStats.mockReturnValue(
      of({
        programs: 3,
        cohorts: 5,
        trainees: 24,
        averageAttendance: 76.4,
        todaysClasses: [
          {
            id: 30,
            cohortId: 10,
            cohortName: 'Cohort A',
            programName: 'Web Development',
            date: '2026-10-24',
            topic: 'HTML',
          },
          {
            id: 31,
            cohortId: 11,
            cohortName: 'Cohort B',
            programName: 'Data Analytics',
            date: '2026-10-24',
            topic: 'SQL',
          },
        ],
      }),
    );
    const todayFixture = TestBed.createComponent(Dashboard);
    await todayFixture.whenStable();
    todayFixture.detectChanges();

    const links = Array.from(
      (todayFixture.nativeElement as HTMLElement).querySelectorAll('.today-class-link'),
    ) as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/attendance?classId=30',
      '/attendance?classId=31',
    ]);
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
    const values = Array.from(dashboardElement.querySelectorAll('.stat-copy strong')).map(
      (element) => element.textContent,
    );

    expect(values).toEqual(['3', '5', '24', '76%']);
  });
});
