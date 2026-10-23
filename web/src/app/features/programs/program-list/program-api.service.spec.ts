import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProgramApiService } from './program-api.service';

describe('ProgramApiService', () => {
  let service: ProgramApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProgramApiService,
      ],
    });
    service = TestBed.inject(ProgramApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('requests programs from the API', () => {
    let result: unknown;
    service.list().subscribe((programs) => (result = programs));

    httpTesting.expectOne('/api/programs/').flush([
      { id: 1, name: 'Web Development', description: null },
    ]);

    expect(result).toEqual([
      { id: 1, name: 'Web Development', description: null },
    ]);
  });

  it('creates programs through the API', () => {
    let result: unknown;
    const payload = {
      name: 'Data Analytics',
      description: 'Learn data analysis.',
    };
    service.create(payload).subscribe((program) => (result = program));

    const request = httpTesting.expectOne('/api/programs/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 2, ...payload });

    expect(result).toEqual({ id: 2, ...payload });
  });
});
