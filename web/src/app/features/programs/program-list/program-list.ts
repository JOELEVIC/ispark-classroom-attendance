import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { NewProgramDialog } from './new-program-dialog';
import { MockData, MockProgram } from '../../../core/mock-data';

@Component({
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  selector: 'app-program-list',
  styleUrl: './program-list.css',
  templateUrl: './program-list.html',
})
export class ProgramList {
  private readonly dialog = inject(MatDialog);
  protected readonly data = inject(MockData);

  protected searchTerm = '';

  protected get filteredPrograms(): (MockProgram & {
    cohort_count: number;
    trainee_count: number;
  })[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.data.programs
      .map((program) => {
        const cohorts = this.data.cohorts.filter(
          (cohort) => cohort.programId === program.id,
        );
        return {
          ...program,
          cohort_count: cohorts.length,
          trainee_count: cohorts.reduce(
            (sum, cohort) => sum + this.data.traineesFor(cohort.id).length,
            0,
          ),
        };
      })
      .filter((program) =>
        program.name.toLocaleLowerCase().includes(query),
      );
  }

  protected openNewProgramDialog(): void {
    this.dialog
      .open(NewProgramDialog, {
        width: '460px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
      });
  }
}
