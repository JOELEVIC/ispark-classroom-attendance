import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TrainerApiService } from './trainer-api.service';
import { TrainerList } from './trainer-list';

describe('TrainerList', () => {
  let fixture: ComponentFixture<TrainerList>;
  let api: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = {
      list: vi.fn().mockReturnValue(
        of([
          { id: 1, name: 'Ada Trainer' },
          { id: 2, name: 'Ben Trainer' },
        ]),
      ),
      create: vi.fn().mockReturnValue(
        of({ id: 3, name: 'Casey Trainer' }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [TrainerList],
      providers: [{ provide: TrainerApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainerList);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads trainers without requesting cohorts', () => {
    expect(api.list).toHaveBeenCalledOnce();
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Ada Trainer');
    expect(text).toContain('Ben Trainer');
    expect(text).not.toContain('Assign Cohort');
  });

  it('creates a trainer through the API and adds it to the list', async () => {
    const addButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Add Trainer'));
    addButton?.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[placeholder="Enter full name"]',
    ) as HTMLInputElement;
    input.value = 'Casey Trainer';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Save Trainer'));
    saveButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.create).toHaveBeenCalledWith('Casey Trainer');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Casey Trainer',
    );
  });

  it('logs API errors and shows a concise loading error', async () => {
    const requestError = new Error('API failure detail');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.list.mockReturnValue(throwError(() => requestError));

    const failedFixture = TestBed.createComponent(TrainerList);
    await failedFixture.whenStable();
    failedFixture.detectChanges();

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to load trainers',
      requestError,
    );
    expect((failedFixture.nativeElement as HTMLElement).textContent).toContain(
      "Couldn't load trainers. Please try again.",
    );
    consoleError.mockRestore();
  });
});
