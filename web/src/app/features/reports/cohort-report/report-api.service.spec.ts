import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { buildCohortReportCsv, ReportApiService, ReportTrainee } from './report-api.service';

describe('ReportApiService', () => {
  let service: ReportApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ReportApiService],
    });
    service = TestBed.inject(ReportApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads cohorts by program', () => {
    let result: unknown;
    service.getCohorts().subscribe((cohorts) => (result = cohorts));
    httpTesting.expectOne('/api/programs/').flush([{ id: 1, name: 'Web Development' }]);
    httpTesting
      .expectOne('/api/cohorts/by-program/1')
      .flush([{ id: 10, program_id: 1, name: 'Cohort A' }]);
    expect(result).toEqual([{ id: 10, name: 'Cohort A', programName: 'Web Development' }]);
  });

  it('includes finished cohorts only when requested', () => {
    service.getCohorts(true).subscribe();
    httpTesting.expectOne('/api/programs/').flush([{ id: 1, name: 'Web Development' }]);
    httpTesting
      .expectOne(
        (request) =>
          request.url === '/api/cohorts/by-program/1' &&
          request.params.get('include_finished') === 'true',
      )
      .flush([]);
  });

  it('maps the cohort attendance report response', () => {
    let result: unknown;
    service.getCohortReport(10).subscribe((trainees) => (result = trainees));
    const request = httpTesting.expectOne('/api/cohorts/10/attendance-report');
    expect(request.request.method).toBe('GET');
    request.flush({
      cohort_id: 10,
      trainees: [
        {
          trainee_id: 20,
          trainee_name: 'Sam Trainee',
          counts: { present: 3, absent: 1, late: 1, excused: 0 },
          attendance_rate: 80,
          below_threshold: false,
        },
      ],
    });
    expect(result).toEqual([
      {
        id: 20,
        name: 'Sam Trainee',
        counts: { present: 3, absent: 1, late: 1, excused: 0 },
        attendanceRate: 80,
        belowThreshold: false,
      },
    ]);
  });

  it('builds a quoted, formula-safe CSV report with N/A for uncounted rates', () => {
    const trainees: ReportTrainee[] = [
      {
        id: 20,
        name: '=SUM(1,2)',
        counts: { present: 2, absent: 1, late: 1, excused: 3 },
        attendanceRate: 75,
        belowThreshold: false,
      },
      {
        id: 21,
        name: 'Sam "Trainee"',
        counts: { present: 0, absent: 0, late: 0, excused: 1 },
        attendanceRate: null,
        belowThreshold: false,
      },
    ];

    expect(buildCohortReportCsv(trainees)).toBe(
      '\uFEFF"Trainee","Present","Absent","Late","Excused","Attendance rate (%)"\r\n' +
        '"\'=SUM(1,2)","2","1","1","3","75.00"\r\n' +
        '"Sam ""Trainee""","0","0","0","1","N/A"\r\n',
    );
  });

  it('loads a trainee history with the cohort filter', () => {
    let result: unknown;
    service.getTraineeHistory(20, 10).subscribe((history) => (result = history));
    const request = httpTesting.expectOne(
      (req) => req.url === '/api/trainees/20/attendance' && req.params.get('cohort_id') === '10',
    );
    request.flush([
      { class_id: 30, status: 'PRESENT' },
      { class_id: 31, status: 'late' },
    ]);
    expect(result).toEqual(
      new Map([
        [30, 'present'],
        [31, 'late'],
      ]),
    );
  });

  it('maps class attendance summary and unmarked trainees', () => {
    let result: unknown;
    service.getClassSummary(30).subscribe((summary) => (result = summary));
    const request = httpTesting.expectOne('/api/classes/30/attendance-summary');
    request.flush({
      class_id: 30,
      counts: { present: 2, absent: 1, late: 0, excused: 0 },
      unmarked_trainees: [{ trainee_id: 22, trainee_name: 'Alex Student' }],
    });
    expect(result).toEqual({
      counts: { present: 2, absent: 1, late: 0, excused: 0 },
      unmarkedTrainees: [{ id: 22, name: 'Alex Student' }],
    });
  });
});
