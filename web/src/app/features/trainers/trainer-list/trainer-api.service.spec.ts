import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TrainerApiService } from './trainer-api.service';

describe('TrainerApiService', () => {
  let service: TrainerApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TrainerApiService,
      ],
    });
    service = TestBed.inject(TrainerApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists trainers without making cohort or program requests', () => {
    let result: unknown;
    service.list().subscribe((trainers) => (result = trainers));

    httpTesting.expectOne('/api/trainers/').flush([
      { id: 5, name: 'Ada Trainer' },
      { id: 6, name: 'Ben Trainer' },
    ]);

    expect(result).toEqual([
      { id: 5, name: 'Ada Trainer' },
      { id: 6, name: 'Ben Trainer' },
    ]);
    httpTesting.expectNone('/api/cohorts/by-program/1');
    httpTesting.expectNone('/api/programs/');
  });

  it('creates a trainer through the API', () => {
    let result: unknown;
    service.create('Ada Trainer').subscribe((trainer) => (result = trainer));

    const request = httpTesting.expectOne('/api/trainers/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Ada Trainer' });
    request.flush({ id: 5, name: 'Ada Trainer' });

    expect(result).toEqual({ id: 5, name: 'Ada Trainer' });
  });
});
