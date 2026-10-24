import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EnrollmentApiService } from '../../enrollments/enrollment-list/enrollment-api.service';
import { CohortApiService, CohortRecord } from './cohort-api.service';
import { CohortList } from './cohort-list';

describe('CohortList', () => {
  let fixture: ComponentFixture<CohortList>;
  let api: {
    listDirectory: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    assignTrainer: ReturnType<typeof vi.fn>;
    enrollTrainee: ReturnType<typeof vi.fn>;
    importCsv: ReturnType<typeof vi.fn>;
    finish: ReturnType<typeof vi.fn>;
  };

  const cohorts: CohortRecord[] = [
    {
      id: 10,
      programId: 1,
      programName: 'Web Development',
      name: 'Cohort A',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      isFinished: false,
      trainers: [{ id: 1, name: 'Ada Trainer' }],
      trainees: [
        { id: 1, name: 'Sam Trainee' },
        { id: 2, name: 'Rae Trainee' },
      ],
      classCount: 3,
    },
  ];

  beforeEach(async () => {
    api = {
      listDirectory: vi.fn().mockReturnValue(
        of({
          programs: [{ id: 1, name: 'Web Development' }],
          trainers: [
            { id: 1, name: 'Ada Trainer' },
            { id: 2, name: 'Ben Trainer' },
          ],
          trainees: [
            { id: 1, name: 'Sam Trainee' },
            { id: 2, name: 'Rae Trainee' },
            { id: 3, name: 'Jo Trainee' },
          ],
          cohorts,
        }),
      ),
      create: vi.fn().mockReturnValue(
        of({
          ...cohorts[0],
          id: 11,
          name: 'Cohort B',
          trainers: [],
          trainees: [],
          classCount: 0,
        }),
      ),
      assignTrainer: vi.fn().mockReturnValue(of({})),
      enrollTrainee: vi.fn().mockReturnValue(of({})),
      finish: vi.fn().mockReturnValue(of({ ...cohorts[0], isFinished: true })),
      importCsv: vi.fn().mockReturnValue(
        of({
          imported_count: 1,
          total_rows: 2,
          failures: [
            {
              row: 3,
              name: 'Unknown Trainee',
              reason: 'No existing trainee has this exact name.',
            },
          ],
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CohortList],
      providers: [
        provideRouter([]),
        { provide: CohortApiService, useValue: api },
        { provide: EnrollmentApiService, useValue: api },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CohortList);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders API-backed cohort details and counts', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(api.listDirectory).toHaveBeenCalledOnce();
    expect(text).toContain('Cohort A');
    expect(text).toContain('2 Trainees');
    expect(text).toContain('3 Classes');
    expect(text).toContain('Ada Trainer');
    expect(text).toContain('Sam Trainee');
  });

  it('confirms finishing a cohort and renders it read-only', async () => {
    api.listDirectory.mockReturnValue(
      of({
        programs: [{ id: 1, name: 'Web Development' }],
        trainers: [{ id: 1, name: 'Ada Trainer' }],
        trainees: [{ id: 1, name: 'Sam Trainee' }],
        cohorts: [{ ...cohorts[0], isFinished: true }],
      }),
    );
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    buttons.find((button) => button.textContent?.includes('Mark as finished'))?.click();
    fixture.detectChanges();

    const confirmButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Confirm finish'));
    confirmButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.finish).toHaveBeenCalledWith(10);
    expect(api.listDirectory).toHaveBeenLastCalledWith(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Finished · this cohort is read-only',
    );
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="Enroll selected trainee"]',
      ),
    ).toBeNull();
  });

  it('links the selected cohort to its enrollment page', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '.enrollment-page-link',
    );

    expect(link?.textContent).toContain('Enrollment page');
    expect(link?.getAttribute('href')).toBe('/enrollments?cohortId=10');
  });

  it('enrolls a trainee and updates the cohort details', async () => {
    const enrollButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Enroll selected trainee"]',
    );
    expect(enrollButton?.textContent).toContain('Enroll trainee');
    expect(enrollButton?.disabled).toBe(true);

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    await selects[1].open();
    const options = await selects[1].getOptions();
    for (const option of options) {
      if ((await option.getText()).includes('Jo Trainee')) {
        await option.click();
        break;
      }
    }

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button[aria-label="Enroll selected trainee"]')
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.enrollTrainee).toHaveBeenCalledWith(10, 3);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Jo Trainee');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('3 Trainees');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Jo Trainee enrolled in Cohort A.',
    );
  });

  it('imports CSV enrollments for the selected cohort and reports failed rows', async () => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#cohort-csv-10',
    );
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }
    const file = new File(['name\nJo Trainee\nUnknown Trainee\n'], 'trainees.csv', {
      type: 'text/csv',
    });
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.csv-import-button')
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.importCsv).toHaveBeenCalledWith(10, file);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Enrolled 1 of 2 CSV rows.');
    expect(text).toContain('Row 3');
    expect(text).toContain('No existing trainee has this exact name.');
  });

  it('creates a cohort through the API', async () => {
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    buttons.find((button) => button.textContent?.includes('New Cohort'))?.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[placeholder="e.g. Cohort C"]',
    ) as HTMLInputElement;
    input.value = 'Cohort B';
    input.dispatchEvent(new Event('input'));
    const dateInputs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="date"]',
      ),
    );
    dateInputs[0].value = '2026-07-01';
    dateInputs[0].dispatchEvent(new Event('input'));
    dateInputs[1].value = '2026-12-31';
    dateInputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Create Cohort'))
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.create).toHaveBeenCalledWith({
      programId: 1,
      name: 'Cohort B',
      startDate: '2026-07-01',
      endDate: '2026-12-31',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cohort B');
  });

  it('shows the API reason when cohort creation fails', async () => {
    api.create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              detail:
                "A cohort named 'Cohort A' already exists in this program. Choose a different name.",
            },
          }),
      ),
    );
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    buttons.find((button) => button.textContent?.includes('New Cohort'))?.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[placeholder="e.g. Cohort C"]',
    ) as HTMLInputElement;
    input.value = 'Cohort A';
    input.dispatchEvent(new Event('input'));
    const dateInputs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type="date"]',
      ),
    );
    dateInputs[0].value = '2026-07-01';
    dateInputs[0].dispatchEvent(new Event('input'));
    dateInputs[1].value = '2026-12-31';
    dateInputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Create Cohort'))
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "A cohort named 'Cohort A' already exists in this program. Choose a different name.",
    );
  });

  it('logs directory errors and shows a concise message', async () => {
    const error = new Error('API failure detail');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.listDirectory.mockReturnValue(throwError(() => error));

    const failedFixture = TestBed.createComponent(CohortList);
    await failedFixture.whenStable();
    failedFixture.detectChanges();

    expect(consoleError).toHaveBeenCalledWith('Failed to load cohorts', error);
    expect((failedFixture.nativeElement as HTMLElement).textContent).toContain(
      "Couldn't load cohorts. Please try again.",
    );
    consoleError.mockRestore();
  });
});
