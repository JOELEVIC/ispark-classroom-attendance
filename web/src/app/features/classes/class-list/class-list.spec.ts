import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ClassApiService, ClassCohort } from './class-api.service';
import { ClassList } from './class-list';

describe('ClassList', () => {
  let fixture: ComponentFixture<ClassList>;
  let api: {
    getDirectory: ReturnType<typeof vi.fn>;
    assignTrainer: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };

  const cohort: ClassCohort = {
    id: 10,
    programId: 1,
    programName: 'Web Development',
    name: 'Cohort A',
    startDate: '2020-11-11',
    endDate: '2023-02-22',
    trainers: [],
    traineeCount: 2,
    classes: [],
  };

  beforeEach(async () => {
    api = {
      getDirectory: vi.fn().mockReturnValue(
        of({
          cohorts: [cohort],
          trainers: [{ id: 7, name: 'Ada Trainer' }],
        }),
      ),
      assignTrainer: vi.fn().mockReturnValue(of({ cohort_id: 10, trainer_id: 7 })),
      create: vi.fn().mockReturnValue(
        of({
          id: 30,
          cohortId: 10,
          cohortName: 'Cohort A',
          programName: 'Web Development',
          cohortStartDate: '2020-11-11',
          cohortEndDate: '2023-02-22',
          trainerId: 7,
          trainerName: 'Ada Trainer',
          date: '2022-02-01',
          topic: 'HTML',
          attendance: [],
          traineeCount: 0,
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ClassList],
      providers: [
        provideRouter([]),
        { provide: ClassApiService, useValue: api },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClassList);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads cohort information from the API', () => {
    expect(api.getDirectory).toHaveBeenCalledOnce();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Web Development · Cohort A',
    );
  });

  it('defaults an expired cohort to its latest valid class date', async () => {
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.page-heading button')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.componentInstance as unknown as { classDate: string }).classDate,
    ).toBe('2023-02-22');
    const dateInput = fixture.nativeElement.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    expect(dateInput.value).toBe('2023-02-22');
  });

  it('explains the cohort date range when a class date is invalid', async () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    nativeElement
      .querySelector<HTMLButtonElement>('.page-heading button')
      ?.click();
    fixture.detectChanges();

    const topic = nativeElement.querySelector(
      'input[placeholder="e.g. Intro to SQL"]',
    ) as HTMLInputElement;
    topic.value = 'HTML';
    topic.dispatchEvent(new Event('input'));
    const dateInput = nativeElement.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    dateInput.value = '2020-02-22';
    dateInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    await selects[1].open();
    for (const option of await selects[1].getOptions()) {
      if ((await option.getText()).includes('Ada Trainer')) {
        await option.click();
        break;
      }
    }
    nativeElement
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((button) => {
        if (button.textContent?.includes('Save Class')) button.click();
      });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(nativeElement.textContent).toContain('between');
    expect(nativeElement.textContent).toContain('2020');
    expect(nativeElement.textContent).toContain('2023');
    expect(api.create).not.toHaveBeenCalled();
  });

  it('schedules a class through the API', async () => {
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.page-heading button')
      ?.click();
    fixture.detectChanges();
    const topic = fixture.nativeElement.querySelector(
      'input[placeholder="e.g. Intro to SQL"]',
    ) as HTMLInputElement;
    topic.value = 'HTML';
    topic.dispatchEvent(new Event('input'));
    const dateInput = fixture.nativeElement.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    dateInput.value = '2022-02-01';
    dateInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    await selects[1].open();
    for (const option of await selects[1].getOptions()) {
      if ((await option.getText()).includes('Ada Trainer')) {
        await option.click();
        break;
      }
    }

    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    )
      .find((button) => button.textContent?.includes('Save Class'))
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.create).toHaveBeenCalledWith({
      cohortId: 10,
      trainerId: 7,
      date: '2022-02-01',
      topic: 'HTML',
    });
    expect(api.assignTrainer).toHaveBeenCalledWith(10, 7);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('HTML');
  });

  it('does not assign a trainer again if already linked to the cohort', async () => {
    api.getDirectory.mockReturnValue(
      of({
        cohorts: [{ ...cohort, trainers: [{ id: 7, name: 'Ada Trainer' }] }],
        trainers: [{ id: 7, name: 'Ada Trainer' }],
      }),
    );
    fixture = TestBed.createComponent(ClassList);
    await fixture.whenStable();
    fixture.detectChanges();
    const nativeElement = fixture.nativeElement as HTMLElement;
    nativeElement
      .querySelector<HTMLButtonElement>('.page-heading button')
      ?.click();
    fixture.detectChanges();

    const topic = nativeElement.querySelector(
      'input[placeholder="e.g. Intro to SQL"]',
    ) as HTMLInputElement;
    topic.value = 'HTML';
    topic.dispatchEvent(new Event('input'));
    const dateInput = nativeElement.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    dateInput.value = '2022-02-01';
    dateInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    await selects[1].open();
    for (const option of await selects[1].getOptions()) {
      if ((await option.getText()).includes('Ada Trainer')) {
        await option.click();
        break;
      }
    }
    Array.from(nativeElement.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Save Class'))
      ?.click();
    await fixture.whenStable();

    expect(api.assignTrainer).not.toHaveBeenCalled();
    expect(api.create).toHaveBeenCalledOnce();
  });
});
