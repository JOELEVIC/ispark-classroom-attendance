import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AttendanceApiService, AttendanceCohort } from './attendance-api.service';
import { TakeAttendance } from './take-attendance';

describe('TakeAttendance', () => {
  let fixture: ComponentFixture<TakeAttendance>;
  let api: {
    getCohorts: ReturnType<typeof vi.fn>;
    getClassAttendance: ReturnType<typeof vi.fn>;
    getAttendanceChangeHistory: ReturnType<typeof vi.fn>;
    saveAttendance: ReturnType<typeof vi.fn>;
  };

  const cohorts: AttendanceCohort[] = [
    {
      id: 10,
      programId: 1,
      programName: 'Web Development',
      name: 'Cohort A',
      trainees: [
        { id: 1, name: 'Ada Trainee' },
        { id: 2, name: 'Ben Trainee' },
      ],
      trainers: [
        { id: 7, name: 'Amina Trainer' },
        { id: 8, name: 'Other Trainer' },
      ],
      classes: [
        {
          id: 30,
          cohortId: 10,
          trainerId: 7,
          date: '2026-02-01',
          topic: 'HTML',
        },
      ],
    },
  ];

  beforeEach(async () => {
    api = {
      getCohorts: vi.fn().mockReturnValue(of(cohorts)),
      getClassAttendance: vi
        .fn()
        .mockReturnValue(of(new Map([[1, 'present' as const]]))),
      getAttendanceChangeHistory: vi.fn().mockReturnValue(
        of([
          {
            id: 5,
            attendance_id: 2,
            old_status: 'present',
            new_status: 'late',
            changed_by: 7,
            changed_by_name: 'Amina Trainer',
            changed_at: '2026-02-02T10:00:00Z',
          },
        ]),
      ),
      saveAttendance: vi.fn().mockReturnValue(of({ records: [] })),
    };
    await TestBed.configureTestingModule({
      imports: [TakeAttendance],
      providers: [
        provideRouter([]),
        { provide: AttendanceApiService, useValue: api },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TakeAttendance);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads the enrolled roster and existing attendance from the API', () => {
    expect(api.getCohorts).toHaveBeenCalledOnce();
    expect(api.getClassAttendance).toHaveBeenCalledWith(30);
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.roster-row'),
    ).toHaveLength(2);
    const presentButton = fixture.nativeElement.querySelector(
      '.roster-row button.present',
    ) as HTMLButtonElement;
    expect(presentButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows only the trainer assigned to the selected class', async () => {
    const trainerSelect = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll('mat-select')[2] as HTMLElement;
    trainerSelect.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const options = document.querySelectorAll('mat-option');
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toContain('Amina Trainer');
    expect(options[0].textContent).not.toContain('Other Trainer');
  });

  it('saves updated attendance for the selected class', async () => {
    const roster = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.roster-row',
    );
    roster[0].querySelector<HTMLButtonElement>('button.absent')?.click();
    roster[1].querySelector<HTMLButtonElement>('button.late')?.click();
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.mobile-save button')
      ?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.saveAttendance).toHaveBeenCalledWith(30, 10, 7, [
      { trainee_id: 1, status: 'absent' },
      { trainee_id: 2, status: 'late' },
    ]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Attendance saved for 2 trainees.',
    );
  });

  it('loads and displays correction history on demand for a trainee', async () => {
    const historyButton = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('.history-toggle');
    historyButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.getAttendanceChangeHistory).toHaveBeenCalledWith(30, 1);
    const historyPanel = (
      fixture.nativeElement as HTMLElement
    ).querySelector('.history-panel');
    expect(historyPanel?.textContent).toContain('Present to Late');
    expect(historyPanel?.textContent).toContain('Amina Trainer');
  });
});
