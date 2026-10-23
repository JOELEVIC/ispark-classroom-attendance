import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { of, throwError } from 'rxjs';
import { CohortApiService, CohortRecord } from './cohort-api.service';
import { CohortList } from './cohort-list';

describe('CohortList', () => {
  let fixture: ComponentFixture<CohortList>;
  let api: {
    listDirectory: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    assignTrainer: ReturnType<typeof vi.fn>;
    enrollTrainee: ReturnType<typeof vi.fn>;
  };

  const cohorts: CohortRecord[] = [
    {
      id: 10,
      programId: 1,
      programName: 'Web Development',
      name: 'Cohort A',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
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
    };

    await TestBed.configureTestingModule({
      imports: [CohortList],
      providers: [{ provide: CohortApiService, useValue: api }],
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

  it('enrolls a trainee and updates the cohort details', async () => {
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

    (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>(
      'button[aria-label="Enroll selected trainee"]',
    )?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.enrollTrainee).toHaveBeenCalledWith(10, 3);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Jo Trainee',
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '3 Trainees',
    );
  });

  it('creates a cohort through the API', async () => {
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    );
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

    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    )
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
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Cohort B',
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
