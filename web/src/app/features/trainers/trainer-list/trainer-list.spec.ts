import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrainerList } from './trainer-list';

describe('TrainerList', () => {
  let component: TrainerList;
  let fixture: ComponentFixture<TrainerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainerList],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainerList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
