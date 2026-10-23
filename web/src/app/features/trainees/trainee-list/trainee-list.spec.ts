import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TraineeApiService } from './trainee-api.service';
import { TraineeList } from './trainee-list';

describe('TraineeList', () => {
  let fixture: ComponentFixture<TraineeList>;
  let listTrainees: ReturnType<typeof vi.fn>;
  let createTrainee: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    listTrainees = vi.fn().mockReturnValue(
      of([
        { id: 1, name: 'Ada Trainee' },
        { id: 2, name: 'Ben Trainee' },
      ]),
    );
    createTrainee = vi
      .fn()
      .mockReturnValue(of({ id: 3, name: 'Casey Trainee' }));

    await TestBed.configureTestingModule({
      imports: [TraineeList],
      providers: [
        {
          provide: TraineeApiService,
          useValue: { list: listTrainees, create: createTrainee },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TraineeList);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads trainees from the API', () => {
    expect(listTrainees).toHaveBeenCalledOnce();
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Ada Trainee');
    expect(text).toContain('Ben Trainee');
  });

  it('creates a trainee through the API and adds it to the list', async () => {
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
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Casey Trainee',
    );
  });

  it('logs list errors and displays a concise message', async () => {
    const error = new Error('API failure detail');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    listTrainees.mockReturnValue(throwError(() => error));

    const failedFixture = TestBed.createComponent(TraineeList);
    await failedFixture.whenStable();
    failedFixture.detectChanges();

    expect(consoleError).toHaveBeenCalledWith('Failed to load trainees', error);
    expect((failedFixture.nativeElement as HTMLElement).textContent).toContain(
      "Couldn't load trainees. Please try again.",
    );
    consoleError.mockRestore();
  });
});
