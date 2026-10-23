import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CohortList } from './cohort-list';

describe('CohortList', () => {
  let component: CohortList;
  let fixture: ComponentFixture<CohortList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CohortList],
    }).compileComponents();

    fixture = TestBed.createComponent(CohortList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
