import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ClassApiService } from './class-api.service';

describe('ClassApiService', () => {
  let service: ClassApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ClassApiService],
    });
    service = TestBed.inject(ClassApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads scheduled classes and attendance summaries', () => {
    let result: unknown;
    service.getDirectory().subscribe((directory) => (result = directory));
    httpTesting.expectOne('/api/programs/').flush([{ id: 1, name: 'Web Development' }]);
    httpTesting.expectOne('/api/trainers/').flush([{ id: 7, name: 'Ada Trainer' }]);
    httpTesting.expectOne('/api/cohorts/by-program/1').flush([
      {
        id: 10,
        program_id: 1,
        name: 'Cohort A',
        start_date: '2026-01-01',
        end_date: '2026-06-30',
      },
    ]);
    httpTesting.expectOne('/api/cohorts/10/trainers').flush([{ id: 7, name: 'Ada Trainer' }]);
    httpTesting.expectOne('/api/cohorts/10/enrollments').flush([{ id: 20 }, { id: 21 }]);
    httpTesting.expectOne('/api/cohorts/10/classes').flush([
      {
        id: 30,
        cohort_id: 10,
        trainer_id: 7,
        class_date: '2026-02-01',
        topic: 'HTML',
      },
    ]);
    httpTesting
      .expectOne('/api/classes/30/attendance')
      .flush([{ status: 'present' }, { status: 'late' }]);

    expect(result).toEqual({
      cohorts: [
        {
          id: 10,
          programId: 1,
          programName: 'Web Development',
          name: 'Cohort A',
          startDate: '2026-01-01',
          endDate: '2026-06-30',
          trainers: [{ id: 7, name: 'Ada Trainer' }],
          traineeCount: 2,
          classes: [
            {
              id: 30,
              cohortId: 10,
              cohortName: 'Cohort A',
              programName: 'Web Development',
              cohortStartDate: '2026-01-01',
              cohortEndDate: '2026-06-30',
              trainerId: 7,
              trainerName: 'Ada Trainer',
              date: '2026-02-01',
              topic: 'HTML',
              attendance: ['present', 'late'],
              traineeCount: 2,
            },
          ],
        },
      ],
      trainers: [{ id: 7, name: 'Ada Trainer' }],
    });
  });

  it('assigns a trainer to a cohort before class creation when needed', () => {
    service.assignTrainer(10, 7).subscribe();
    const request = httpTesting.expectOne('/api/cohorts/10/trainers');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ trainer_id: 7 });
    request.flush({});
  });

  it('creates a class using the cohort class endpoint contract', () => {
    let result: unknown;
    service
      .create({
        cohortId: 10,
        trainerId: 7,
        date: '2026-02-01',
        topic: 'HTML',
      })
      .subscribe((classItem) => (result = classItem));

    const request = httpTesting.expectOne('/api/cohorts/10/classes');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      trainer_id: 7,
      class_date: '2026-02-01',
      topic: 'HTML',
    });
    request.flush({
      id: 30,
      cohort_id: 10,
      trainer_id: 7,
      class_date: '2026-02-01',
      topic: 'HTML',
    });
    expect(result).toMatchObject({
      id: 30,
      cohortId: 10,
      trainerId: 7,
      date: '2026-02-01',
      topic: 'HTML',
    });
  });

  it('creates a recurring schedule using selected weekdays', () => {
    let result: unknown;
    service
      .createRepeating({
        cohortId: 10,
        trainerId: 7,
        weekdays: [0, 2],
        topic: 'API Foundations',
      })
      .subscribe((schedule) => (result = schedule));

    const request = httpTesting.expectOne('/api/cohorts/10/classes/repeating');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      trainer_id: 7,
      weekdays: [0, 2],
      topic: 'API Foundations',
    });
    request.flush({
      created_count: 1,
      skipped_dates: ['2026-01-07'],
      classes: [
        {
          id: 40,
          cohort_id: 10,
          trainer_id: 7,
          class_date: '2026-01-12',
          topic: 'API Foundations',
        },
      ],
    });
    expect(result).toEqual({
      createdCount: 1,
      skippedDates: ['2026-01-07'],
      classes: [
        {
          id: 40,
          cohortId: 10,
          cohortName: '',
          programName: '',
          cohortStartDate: '',
          cohortEndDate: '',
          trainerId: 7,
          trainerName: '',
          date: '2026-01-12',
          topic: 'API Foundations',
          attendance: [],
          traineeCount: 0,
        },
      ],
    });
  });
});
