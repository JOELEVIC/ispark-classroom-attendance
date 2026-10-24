import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardApiService } from './dashboard-api.service';

describe('DashboardApiService', () => {
  let service: DashboardApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), DashboardApiService],
    });

    service = TestBed.inject(DashboardApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads counts and computes weighted attendance from API data', () => {
    let result:
      | {
          programs: number;
          cohorts: number;
          trainees: number;
          averageAttendance: number | null;
          todaysClasses: {
            id: number;
            cohortId: number;
            cohortName: string;
            programName: string;
            date: string;
            topic: string;
          }[];
        }
      | undefined;

    service.getStats().subscribe((stats) => (result = stats));

    httpTesting.expectOne('/api/programs/').flush([
      { id: 1, name: 'Web Development' },
      { id: 2, name: 'Data Analytics' },
    ]);
    httpTesting.expectOne('/api/cohorts/by-program/1').flush([{ id: 10, name: 'Cohort A' }]);
    httpTesting.expectOne('/api/cohorts/by-program/2').flush([]);

    httpTesting
      .expectOne('/api/trainees/')
      .flush(Array.from({ length: 8 }, (_, index) => ({ id: index + 1 })));
    httpTesting.expectOne('/api/cohorts/10/classes').flush([
      {
        id: 20,
        cohort_id: 10,
        class_date: localDate(),
        topic: 'HTML',
      },
      {
        id: 21,
        cohort_id: 10,
        class_date: '2020-01-01',
        topic: 'CSS',
      },
    ]);

    httpTesting
      .expectOne('/api/classes/20/attendance')
      .flush([
        { status: 'present' },
        { status: 'late' },
        { status: 'absent' },
        { status: 'excused' },
      ]);
    httpTesting
      .expectOne('/api/classes/21/attendance')
      .flush([{ status: 'present' }, { status: 'absent' }]);

    expect(result).toEqual({
      programs: 2,
      cohorts: 1,
      trainees: 8,
      averageAttendance: 60,
      todaysClasses: [
        {
          id: 20,
          cohortId: 10,
          cohortName: 'Cohort A',
          programName: 'Web Development',
          date: localDate(),
          topic: 'HTML',
        },
      ],
    });
  });

  it('returns no average attendance when there are no classes', () => {
    let result:
      | {
          programs: number;
          cohorts: number;
          trainees: number;
          averageAttendance: number | null;
          todaysClasses: unknown[];
        }
      | undefined;

    service.getStats().subscribe((stats) => (result = stats));
    httpTesting.expectOne('/api/programs/').flush([]);
    httpTesting.expectOne('/api/trainees/').flush([{ id: 1 }]);

    expect(result).toEqual({
      programs: 0,
      cohorts: 0,
      trainees: 1,
      averageAttendance: null,
      todaysClasses: [],
    });
  });

  function localDate(): string {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  }
});
