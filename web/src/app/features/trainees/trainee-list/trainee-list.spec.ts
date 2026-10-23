import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TraineeList } from './trainee-list';

describe('TraineeList', () => {
  let component: TraineeList;
  let fixture: ComponentFixture<TraineeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraineeList],
    }).compileComponents();

    fixture = TestBed.createComponent(TraineeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
