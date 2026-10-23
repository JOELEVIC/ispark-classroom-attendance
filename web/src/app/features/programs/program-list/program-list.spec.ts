import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ProgramList } from './program-list';
import { ProgramApiService } from './program-api.service';
import { ProgramDetailsDialog } from './program-details-dialog';

describe('ProgramList', () => {
  let component: ProgramList;
  let fixture: ComponentFixture<ProgramList>;
  let listPrograms: ReturnType<typeof vi.fn>;
  let openDialog: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    openDialog = vi.fn().mockReturnValue({
      afterClosed: () => of(undefined),
    });
    listPrograms = vi.fn().mockReturnValue(
      of([
        {
          id: 1,
          name: 'Web Development',
          description: 'Build web apps.',
        },
        {
          id: 2,
          name: 'Data Analytics',
          description: 'Analyze data.',
        },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [ProgramList],
      providers: [
        {
          provide: ProgramApiService,
          useValue: { list: listPrograms },
        },
      ],
    });
    TestBed.overrideProvider(MatDialog, {
      useValue: { open: openDialog },
    });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ProgramList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show program names without cohort or trainee counts', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Web Development');
    expect(text).toContain('Data Analytics');
    expect(text).not.toContain('cohort');
    expect(text).not.toContain('trainee');
  });

  it('should open the full program details when a row is selected', () => {
    const row = fixture.nativeElement.querySelector(
      'button[aria-label="View program: Web Development"]',
    ) as HTMLButtonElement;

    row.click();

    expect(openDialog).toHaveBeenCalledWith(
      ProgramDetailsDialog,
      expect.objectContaining({
        data: {
          id: 1,
          name: 'Web Development',
          description: 'Build web apps.',
        },
      }),
    );
  });

  it('should show a create-first-program placeholder when the API list is empty', async () => {
    listPrograms.mockReturnValue(of([]));
    const emptyFixture = TestBed.createComponent(ProgramList);
    await emptyFixture.whenStable();
    emptyFixture.detectChanges();

    const root = emptyFixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('No programs yet');
    expect(root.textContent).toContain(
      'Create your first program to start organizing cohorts and trainees.',
    );
    expect(root.querySelector('.empty-state-action')).not.toBeNull();
  });

  it('should log API errors and show a concise error message', async () => {
    const apiError = new Error('API failure detail');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    listPrograms.mockReturnValue(throwError(() => apiError));

    const errorFixture = TestBed.createComponent(ProgramList);
    await errorFixture.whenStable();
    errorFixture.detectChanges();

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to load programs',
      apiError,
    );
    expect((errorFixture.nativeElement as HTMLElement).textContent).toContain(
      "Couldn't load programs. Please try again.",
    );
    expect((errorFixture.nativeElement as HTMLElement).textContent).not.toContain(
      'API failure detail',
    );

    consoleError.mockRestore();
  });

  it('should filter programs by search term', async () => {
    const input = fixture.nativeElement.querySelector(
      'input[aria-label="Search programs"]',
    ) as HTMLInputElement;

    input.value = 'analytics';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Data Analytics');
    expect(text).not.toContain('Web Development');
  });
});
