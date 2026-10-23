import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ProgramList } from './program-list';

describe('ProgramList', () => {
  let component: ProgramList;
  let fixture: ComponentFixture<ProgramList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramList],
      providers: [{ provide: MatDialog, useValue: { open: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgramList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show program names and cohort/trainee counts', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Web Development');
    expect(text).toContain('2 cohorts');
    expect(text).toContain('10 trainees');
    expect(text).toContain('Data Analytics');
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
