import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AttendanceApiService } from './attendance-api.service';

describe('AttendanceApiService', () => {
  let service: AttendanceApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AttendanceApiService,
      ],
    });
    service = TestBed.inject(AttendanceApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads cohorts with enrolled trainees, trainers, and classes', () => {
    let result: unknown;
    service.getCohorts().subscribe((cohorts) => (result = cohorts));
    httpTesting
      .expectOne('/api/programs/')
      .flush([{ id: 1, name: 'Web Development' }]);
    httpTesting.expectOne('/api/cohorts/by-program/1').flush([
      { id: 10, program_id: 1, name: 'Cohort A' },
    ]);
    httpTesting
      .expectOne('/api/cohorts/10/trainers')
      .flush([{ id: 7, name: 'Ada Trainer' }]);
    httpTesting.expectOne('/api/cohorts/10/enrollments').flush([
      { trainee_id: 20, trainee_name: 'Sam Trainee' },
    ]);
    httpTesting.expectOne('/api/cohorts/10/classes').flush([
      {
        id: 30,
        cohort_id: 10,
        trainer_id: 7,
        class_date: '2026-02-01',
        topic: 'HTML',
      },
    ]);
    expect(result).toEqual([
      {
        id: 10,
        programId: 1,
        programName: 'Web Development',
        name: 'Cohort A',
        trainees: [{ id: 20, name: 'Sam Trainee' }],
        trainers: [{ id: 7, name: 'Ada Trainer' }],
        classes: [
          {
            id: 30,
            cohortId: 10,
            trainerId: 7,
            date: '2026-02-01',
            topic: 'HTML',
          },
        ],
      },
    ]);
  });

  it('loads saved status by trainee', () => {
    let result: unknown;
    service.getClassAttendance(30).subscribe((attendance) => (result = attendance));
    httpTesting.expectOne('/api/classes/30/attendance').flush([
      { trainee_id: 20, status: 'PRESENT' },
      { trainee_id: 21, status: 'late' },
    ]);
    expect(result).toEqual(
      new Map([
        [20, 'present'],
        [21, 'late'],
      ]),
    );
  });

  it('posts attendance with cohort and trainer query parameters', () => {
    service
      .saveAttendance(30, 10, 7, [
        { trainee_id: 20, status: 'absent' },
        { trainee_id: 21, status: 'present' },
      ])
      .subscribe();
    const request = httpTesting.expectOne(
      (req) =>
        req.url === '/api/classes/30/attendance' &&
        req.params.get('cohort_id') === '10' &&
        req.params.get('trainer_id') === '7',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      records: [
        { trainee_id: 20, status: 'absent' },
        { trainee_id: 21, status: 'present' },
      ],
    });
    request.flush({ records: [] });
  });
});
