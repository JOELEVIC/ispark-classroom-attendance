import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TraineeApiService } from './trainee-api.service';
import { TraineeList } from './trainee-list';

describe('TraineeList', () => {
  let fixture: ComponentFixture<TraineeList>;
  let searchTrainees: ReturnType<typeof vi.fn>;
  let createTrainee: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    searchTrainees = vi.fn().mockImplementation((_query, page) =>
      of({
        items:
          page === 1
            ? [
                { id: 1, name: 'Ada Trainee', cohorts: ['API Foundations'] },
                { id: 2, name: 'Ben Trainee', cohorts: [] },
              ]
            : [{ id: 3, name: 'Casey Trainee', cohorts: ['Web Development'] }],
        total: 21,
        page,
        page_size: 10,
        total_pages: 3,
      }),
    );
    createTrainee = vi.fn().mockReturnValue(of({ id: 3, name: 'Casey Trainee' }));

    await TestBed.configureTestingModule({
      imports: [TraineeList],
      providers: [
        {
          provide: TraineeApiService,
          useValue: { search: searchTrainees, create: createTrainee },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TraineeList);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads trainees and cohort names from the paginated API', () => {
    expect(searchTrainees).toHaveBeenCalledWith('', 1, 10);
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Ada Trainee');
    expect(text).toContain('Ben Trainee');
    expect(text).toContain('API Foundations');
    expect(text).toContain('Showing 1–10 of 21 trainees');
  });

  it('creates a trainee and reloads the first page', async () => {
    const addButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Add Trainee'));
    addButton?.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[placeholder="Enter full name"]',
    ) as HTMLInputElement;
    input.value = 'Casey Trainee';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Save Trainee'));
    saveButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(createTrainee).toHaveBeenCalledWith('Casey Trainee');
    expect(searchTrainees).toHaveBeenLastCalledWith('', 1, 10);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ada Trainee');
  });

  it('searches by name and resets pagination to the first page', () => {
    const input = fixture.nativeElement.querySelector(
      'input[aria-label="Search trainees by name across cohorts"]',
    ) as HTMLInputElement;
    input.value = 'ada';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(searchTrainees).toHaveBeenLastCalledWith('ada', 1, 10);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ada Trainee');
  });

  it('loads the next page when pagination is used', () => {
    const nextButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Next'));
    nextButton?.click();
    fixture.detectChanges();

    expect(searchTrainees).toHaveBeenLastCalledWith('', 2, 10);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Casey Trainee');
  });

  it('logs search errors and displays a concise message', async () => {
    const error = new Error('API failure detail');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    searchTrainees.mockReturnValue(throwError(() => error));

    const failedFixture = TestBed.createComponent(TraineeList);
    await failedFixture.whenStable();
    failedFixture.detectChanges();

    expect(consoleError).toHaveBeenCalledWith('Failed to search trainees', error);
    expect((failedFixture.nativeElement as HTMLElement).textContent).toContain(
      "Couldn't load trainees. Please try again.",
    );
    consoleError.mockRestore();
  });
});
