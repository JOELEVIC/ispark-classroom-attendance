import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CohortReport } from './cohort-report';

describe('CohortReport', () => {
  let component: CohortReport;
  let fixture: ComponentFixture<CohortReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CohortReport],
    }).compileComponents();

    fixture = TestBed.createComponent(CohortReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
