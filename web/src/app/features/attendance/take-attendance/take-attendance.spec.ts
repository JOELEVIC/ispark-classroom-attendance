import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TakeAttendance } from './take-attendance';

describe('TakeAttendance', () => {
  let component: TakeAttendance;
  let fixture: ComponentFixture<TakeAttendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeAttendance],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TakeAttendance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the selected class roster and save attendance changes', () => {
    fixture.detectChanges();
    const roster = fixture.nativeElement.querySelectorAll('.roster-row');
    expect(roster).toHaveLength(5);

    const absentButton = roster[0].querySelector(
      'button.absent',
    ) as HTMLButtonElement;
    absentButton.click();
    fixture.detectChanges();
    const saveButton = fixture.nativeElement.querySelector(
      '.mobile-save button',
    ) as HTMLButtonElement;
    saveButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Attendance saved for 5 trainees.',
    );
  });
});
