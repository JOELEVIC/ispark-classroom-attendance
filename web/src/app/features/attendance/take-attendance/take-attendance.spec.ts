import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TakeAttendance } from './take-attendance';

describe('TakeAttendance', () => {
  let component: TakeAttendance;
  let fixture: ComponentFixture<TakeAttendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeAttendance],
    }).compileComponents();

    fixture = TestBed.createComponent(TakeAttendance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
