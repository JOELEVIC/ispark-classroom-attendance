import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EnrollmentApiService, EnrollmentCohort } from './enrollment-api.service';
import { EnrollmentList } from './enrollment-list';

describe('EnrollmentList', () => {
  let fixture: ComponentFixture<EnrollmentList>;
  let api: {
    getDirectory: ReturnType<typeof vi.fn>;
    enroll: ReturnType<typeof vi.fn>;
    importCsv: ReturnType<typeof vi.fn>;
  };

  const cohort: EnrollmentCohort = {
    id: 10,
    programId: 1,
    programName: 'Web Development',
    name: 'Cohort A',
    trainees: [{ id: 8, name: 'Ada Trainee' }],
  };

  beforeEach(async () => {
    api = {
      getDirectory: vi.fn().mockReturnValue(
        of({
          cohorts: [cohort],
          trainees: [
            { id: 8, name: 'Ada Trainee' },
            { id: 9, name: 'Bea Trainee' },
          ],
        }),
      ),
      enroll: vi.fn().mockReturnValue(of({})),
      importCsv: vi.fn().mockReturnValue(
        of({
          imported_count: 1,
          total_rows: 2,
          failures: [
            {
              row: 3,
              name: 'Missing Trainee',
              reason: 'No existing trainee has this exact name.',
            },
          ],
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [EnrollmentList],
      providers: [provideRouter([]), { provide: EnrollmentApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(EnrollmentList);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows the selected cohort roster and eligible trainees', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(api.getDirectory).toHaveBeenCalledOnce();
    expect(text).toContain('Ada Trainee');
    expect(text).toContain('1 enrolled');
    expect(text).not.toContain('All trainees are already enrolled.');
  });

  it('shows a back link to the selected cohort page', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '.back-button',
    );

    expect(link?.textContent).toContain('Back to Cohorts');
    expect(link?.getAttribute('href')).toBe('/cohorts?cohortId=10');
  });

  it('enrolls a trainee and updates the roster count', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    await selects[1].open();
    const options = await selects[1].getOptions();
    for (const option of options) {
      if ((await option.getText()).includes('Bea Trainee')) {
        await option.click();
        break;
      }
    }
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button.primary-action')
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.enroll).toHaveBeenCalledWith(10, 9);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('2 enrolled');
  });

  it('shows row-level failures returned by CSV import', async () => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#enrollment-csv',
    );
    expect(input).not.toBeNull();
    if (!input) {
      return;
    }
    const file = new File(['name\nBea Trainee\nMissing Trainee\n'], 'list.csv', {
      type: 'text/csv',
    });
    Object.defineProperty(input, 'files', { value: [file] });
    input?.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.import-action')
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.importCsv).toHaveBeenCalledWith(10, file);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Enrolled 1 of 2 CSV rows.');
    expect(text).toContain('Row 3');
    expect(text).toContain('No existing trainee has this exact name.');
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.import-failure-icon[aria-label="Import issue"]',
      ),
    ).toHaveLength(1);
  });
});
