import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EnrollmentApiService } from './enrollment-api.service';

describe('EnrollmentApiService', () => {
  let service: EnrollmentApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EnrollmentApiService],
    });
    service = TestBed.inject(EnrollmentApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads cohort rosters and the trainee directory', () => {
    let result: unknown;
    service.getDirectory().subscribe((directory) => (result = directory));

    httpTesting.expectOne('/api/programs/').flush([{ id: 1, name: 'Web Development' }]);
    httpTesting.expectOne('/api/trainees/').flush([{ id: 8, name: 'Ada Trainee' }]);
    httpTesting
      .expectOne('/api/cohorts/by-program/1')
      .flush([{ id: 10, program_id: 1, name: 'Cohort A' }]);
    httpTesting.expectOne('/api/cohorts/10/enrollments').flush([
      {
        id: 50,
        trainee_id: 8,
        trainee_name: 'Ada Trainee',
      },
    ]);

    expect(result).toEqual({
      trainees: [{ id: 8, name: 'Ada Trainee' }],
      cohorts: [
        {
          id: 10,
          programId: 1,
          name: 'Cohort A',
          programName: 'Web Development',
          trainees: [{ id: 8, name: 'Ada Trainee' }],
        },
      ],
    });
  });

  it('posts enrollment with the API field name', () => {
    service.enroll(10, 8).subscribe();
    const request = httpTesting.expectOne('/api/cohorts/10/enrollments');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ trainee_id: 8 });
    request.flush({});
  });

  it('uploads a CSV file for the selected cohort', async () => {
    const file = new File(['name\nAda Trainee\n'], 'trainees.csv', {
      type: 'text/csv',
    });
    let result: unknown;
    service.importCsv(10, file).subscribe((response) => (result = response));
    const request = httpTesting.expectOne('/api/cohorts/10/enrollments/import');
    expect(request.request.method).toBe('POST');
    const uploadedFile = (request.request.body as FormData).get('file');
    expect(uploadedFile).toMatchObject({ name: file.name });
    if (!(uploadedFile instanceof File)) {
      throw new Error('The upload request did not contain a file.');
    }
    expect(await uploadedFile.text()).toBe(await file.text());
    request.flush({
      imported_count: 1,
      total_rows: 1,
      failures: [],
    });
    expect(result).toEqual({
      imported_count: 1,
      total_rows: 1,
      failures: [],
    });
  });
});
