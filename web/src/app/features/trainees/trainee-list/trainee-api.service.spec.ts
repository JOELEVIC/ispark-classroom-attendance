import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TraineeApiService } from './trainee-api.service';

describe('TraineeApiService', () => {
  let service: TraineeApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TraineeApiService,
      ],
    });
    service = TestBed.inject(TraineeApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists trainees from FastAPI', () => {
    let result: unknown;
    service.list().subscribe((trainees) => (result = trainees));
    httpTesting.expectOne('/api/trainees/').flush([{ id: 1, name: 'Ada' }]);
    expect(result).toEqual([{ id: 1, name: 'Ada' }]);
  });

  it('creates a trainee through FastAPI', () => {
    let result: unknown;
    service.create('Ada Trainee').subscribe((trainee) => (result = trainee));
    const request = httpTesting.expectOne('/api/trainees/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Ada Trainee' });
    request.flush({ id: 2, name: 'Ada Trainee' });
    expect(result).toEqual({ id: 2, name: 'Ada Trainee' });
  });
});
