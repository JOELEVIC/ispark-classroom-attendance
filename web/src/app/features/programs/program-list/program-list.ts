import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { NewProgramDialog } from './new-program-dialog';
import { Program, ProgramApiService } from './program-api.service';
import { ProgramDetailsDialog } from './program-details-dialog';

@Component({
  imports: [
    FormsModule,
    MatButtonModule,
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
  private readonly programApi = inject(ProgramApiService);
  protected readonly programs = signal<Program[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected searchTerm = '';

  constructor() {
    this.loadPrograms();
  }

  protected get filteredPrograms(): Program[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.programs().filter((program) =>
      program.name.toLocaleLowerCase().includes(query),
    );
  }

  protected loadPrograms(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.programApi.list().subscribe({
      next: (programs) => {
        this.programs.set(programs);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Failed to load programs', error);
        this.errorMessage.set("Couldn't load programs. Please try again.");
        this.loading.set(false);
      },
    });
  }

  protected openNewProgramDialog(): void {
    this.dialog
      .open(NewProgramDialog, {
        width: '460px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .subscribe((program: Program | undefined) => {
        if (program) {
          this.programs.update((programs) => [...programs, program]);
        }
      });
  }

  protected openProgramDetails(program: Program): void {
    this.dialog.open(ProgramDetailsDialog, {
      width: '460px',
      maxWidth: '95vw',
      data: program,
    });
  }
}
