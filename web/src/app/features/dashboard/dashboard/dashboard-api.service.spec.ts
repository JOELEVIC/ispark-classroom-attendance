import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { DashboardApiService } from './dashboard-api.service';

describe('DashboardApiService', () => {
  let service: DashboardApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DashboardApiService,
      ],
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
        }
      | undefined;

    service.getStats().subscribe((stats) => (result = stats));

    httpTesting.expectOne('/api/programs/').flush([{ id: 1 }, { id: 2 }]);
    httpTesting
      .expectOne('/api/cohorts/by-program/1')
      .flush([{ id: 10 }]);
    httpTesting.expectOne('/api/cohorts/by-program/2').flush([]);

    httpTesting.expectOne('/api/trainees/').flush(
      Array.from({ length: 8 }, (_, index) => ({ id: index + 1 })),
    );
    httpTesting
      .expectOne('/api/cohorts/10/classes')
      .flush([{ id: 20 }, { id: 21 }]);

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
    });
  });

  it('returns no average attendance when there are no classes', () => {
    let result:
      | {
          programs: number;
          cohorts: number;
          trainees: number;
          averageAttendance: number | null;
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
    });
  });
});
