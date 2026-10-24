import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReportApiService } from './report-api.service';
import { CohortReport } from './cohort-report';

describe('CohortReport', () => {
  let fixture: ComponentFixture<CohortReport>;
  let api: {
    getCohorts: ReturnType<typeof vi.fn>;
    getCohortReport: ReturnType<typeof vi.fn>;
    getClasses: ReturnType<typeof vi.fn>;
    getClassSummary: ReturnType<typeof vi.fn>;
    getTraineeHistory: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = {
      getCohorts: vi
        .fn()
        .mockImplementation((includeFinished = false) =>
          of([
            { id: 10, name: 'Cohort A', programName: 'Web Development' },
            ...(includeFinished
              ? [{ id: 11, name: 'Cohort B', programName: 'Web Development' }]
              : []),
          ]),
        ),
      getCohortReport: vi.fn().mockReturnValue(
        of([
          {
            id: 20,
            name: 'Sam Trainee',
            counts: { present: 1, absent: 1, late: 0, excused: 0 },
            attendanceRate: 50,
            belowThreshold: true,
          },
        ]),
      ),
      getClasses: vi.fn().mockReturnValue(of([{ id: 30, date: '2026-02-01', topic: 'HTML' }])),
      getClassSummary: vi.fn().mockReturnValue(
        of({
          counts: { present: 1, absent: 1, late: 0, excused: 0 },
          unmarkedTrainees: [{ id: 21, name: 'Alex Student' }],
        }),
      ),
      getTraineeHistory: vi.fn().mockReturnValue(of(new Map([[30, 'present']]))),
    };
    await TestBed.configureTestingModule({
      imports: [CohortReport],
      providers: [{ provide: ReportApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(CohortReport);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads and displays API-backed cohort attendance and class summary', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(api.getCohorts).toHaveBeenCalledOnce();
    expect(api.getCohortReport).toHaveBeenCalledWith(10);
    expect(api.getClasses).toHaveBeenCalledWith(10);
    expect(api.getClassSummary).toHaveBeenCalledWith(30);
    expect(text).toContain('Sam Trainee');
    expect(text).toContain('50%');
    expect(text).toContain('Alex Student');
  });

  it('loads trainee attendance history when expanded', async () => {
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button[aria-label="View Sam Trainee history"]')
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.getTraineeHistory).toHaveBeenCalledWith(20, 10);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Present');
  });

  it('reloads cohort choices when finished cohorts are toggled', async () => {
    const toggle = (fixture.nativeElement as HTMLElement).querySelector(
      'button[role="switch"]',
    ) as HTMLButtonElement;
    toggle.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.getCohorts).toHaveBeenLastCalledWith(true);
    expect(api.getCohortReport).toHaveBeenLastCalledWith(10);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cohort A');
  });
});
