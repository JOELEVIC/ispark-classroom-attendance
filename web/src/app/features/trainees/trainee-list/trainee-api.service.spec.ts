import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TraineeApiService } from './trainee-api.service';

describe('TraineeApiService', () => {
  let service: TraineeApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TraineeApiService],
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

  it('searches trainees across cohorts with page parameters', () => {
    let result: unknown;
    service.search('ada', 2, 10).subscribe((page) => (result = page));
    const request = httpTesting.expectOne(
      (req) =>
        req.url === '/api/trainees/search' &&
        req.params.get('q') === 'ada' &&
        req.params.get('page') === '2' &&
        req.params.get('page_size') === '10',
    );
    request.flush({
      items: [{ id: 1, name: 'Ada', cohorts: ['API Foundations'] }],
      total: 11,
      page: 2,
      page_size: 10,
      total_pages: 2,
    });
    expect(result).toEqual({
      items: [{ id: 1, name: 'Ada', cohorts: ['API Foundations'] }],
      total: 11,
      page: 2,
      page_size: 10,
      total_pages: 2,
    });
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
