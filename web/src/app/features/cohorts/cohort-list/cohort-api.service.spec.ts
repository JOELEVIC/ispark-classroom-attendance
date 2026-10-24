import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CohortApiService } from './cohort-api.service';

describe('CohortApiService', () => {
  let service: CohortApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CohortApiService],
    });
    service = TestBed.inject(CohortApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads cohorts with their trainers, enrollments, and classes', () => {
    let result: unknown;
    service.listDirectory().subscribe((directory) => (result = directory));

    httpTesting.expectOne('/api/programs/').flush([{ id: 1, name: 'Web Development' }]);
    httpTesting.expectOne('/api/trainers/').flush([{ id: 5, name: 'Ada Trainer' }]);
    httpTesting.expectOne('/api/trainees/').flush([
      { id: 20, name: 'Sam Trainee' },
      { id: 21, name: 'Rae Trainee' },
    ]);
    httpTesting.expectOne('/api/cohorts/by-program/1').flush([
      {
        id: 10,
        program_id: 1,
        name: 'Cohort A',
        start_date: '2026-01-01',
        end_date: '2026-06-30',
        is_finished: false,
      },
    ]);
    httpTesting.expectOne('/api/cohorts/10/trainers').flush([{ id: 5, name: 'Ada Trainer' }]);
    httpTesting.expectOne('/api/cohorts/10/enrollments').flush([
      { id: 20, trainee_id: 20, trainee_name: 'Sam Trainee' },
      { id: 21, trainee_id: 21, trainee_name: 'Rae Trainee' },
    ]);
    httpTesting.expectOne('/api/cohorts/10/classes').flush([{ id: 30 }, { id: 31 }, { id: 32 }]);

    expect(result).toEqual({
      programs: [{ id: 1, name: 'Web Development' }],
      trainers: [{ id: 5, name: 'Ada Trainer' }],
      trainees: [
        { id: 20, name: 'Sam Trainee' },
        { id: 21, name: 'Rae Trainee' },
      ],
      cohorts: [
        {
          id: 10,
          programId: 1,
          programName: 'Web Development',
          name: 'Cohort A',
          startDate: '2026-01-01',
          endDate: '2026-06-30',
          isFinished: false,
          trainers: [{ id: 5, name: 'Ada Trainer' }],
          trainees: [
            { id: 20, name: 'Sam Trainee' },
            { id: 21, name: 'Rae Trainee' },
          ],
          classCount: 3,
        },
      ],
    });
  });

  it('requests finished cohorts only when explicitly included', () => {
    service.listDirectory(true).subscribe();
    httpTesting.expectOne('/api/programs/').flush([{ id: 1, name: 'Web Development' }]);
    httpTesting.expectOne('/api/trainers/').flush([]);
    httpTesting.expectOne('/api/trainees/').flush([]);
    httpTesting
      .expectOne(
        (request) =>
          request.url === '/api/cohorts/by-program/1' &&
          request.params.get('include_finished') === 'true',
      )
      .flush([]);
  });

  it('creates cohorts with the API field names', () => {
    let result: unknown;
    service
      .create({
        programId: 1,
        name: 'Cohort B',
        startDate: '2026-07-01',
        endDate: '2026-12-31',
      })
      .subscribe((cohort) => (result = cohort));

    const request = httpTesting.expectOne('/api/cohorts/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      program_id: 1,
      name: 'Cohort B',
      start_date: '2026-07-01',
      end_date: '2026-12-31',
    });
    request.flush({
      id: 11,
      program_id: 1,
      name: 'Cohort B',
      start_date: '2026-07-01',
      end_date: '2026-12-31',
      is_finished: false,
    });
    expect(result).toEqual({
      id: 11,
      programId: 1,
      programName: '',
      name: 'Cohort B',
      startDate: '2026-07-01',
      endDate: '2026-12-31',
      isFinished: false,
      trainers: [],
      trainees: [],
      classCount: 0,
    });
  });

  it('finishes a cohort without deleting its records', () => {
    let result: unknown;
    service.finish(10).subscribe((cohort) => (result = cohort));

    const request = httpTesting.expectOne('/api/cohorts/10/finish');
    expect(request.request.method).toBe('POST');
    request.flush({
      id: 10,
      program_id: 1,
      name: 'Cohort A',
      start_date: '2026-01-01',
      end_date: '2026-06-30',
      is_finished: true,
    });
    expect(result).toEqual({
      id: 10,
      program_id: 1,
      name: 'Cohort A',
      start_date: '2026-01-01',
      end_date: '2026-06-30',
      is_finished: true,
    });
  });

  it('assigns trainers to a cohort', () => {
    service.assignTrainer(10, 5).subscribe();

    const request = httpTesting.expectOne('/api/cohorts/10/trainers');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ trainer_id: 5 });
    request.flush({});
  });

  it('enrolls a trainee in a cohort', () => {
    service.enrollTrainee(10, 20).subscribe();

    const request = httpTesting.expectOne('/api/cohorts/10/enrollments');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ trainee_id: 20 });
    request.flush({
      id: 20,
      trainee_id: 20,
      cohort_id: 10,
      enrolled_at: '2026-01-01T10:00:00Z',
    });
  });
});
