import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Program, ProgramApiService } from './program-api.service';

@Component({
  selector: 'app-new-program-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './new-program-dialog.html',
  styleUrl: './new-program-dialog.css',
})
export class NewProgramDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly programApi = inject(ProgramApiService);
  private readonly dialogRef = inject(
    MatDialogRef<NewProgramDialog, Program>,
  );
  protected readonly form = this.formBuilder.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(150),
        (control: AbstractControl<string>) =>
          control.value.trim().length >= 2 ? null : { trimmedMinLength: true },
      ],
    ],
    description: ['', Validators.maxLength(2000)],
  });
  protected submitting = false;
  protected errorMessage = '';

  protected submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, description } = this.form.getRawValue();
    this.submitting = true;
    this.errorMessage = '';
    this.programApi
      .create({
        name: name.trim(),
        description: description.trim() || null,
      })
      .subscribe({
        next: (program) => this.dialogRef.close(program),
        error: (error: unknown) => {
          this.errorMessage = this.getCreateErrorMessage(error);
          this.submitting = false;
        },
      });
  }

  private getCreateErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = error.error?.detail;
      if (typeof detail === 'string') {
        return detail;
      }
      if (error.status === 0) {
        return "Couldn't connect to the API. Check that FastAPI is running and try again.";
      }
      return `Couldn't create the program (HTTP ${error.status}). Please try again.`;
    }

    return "Couldn't create the program because of an unexpected error. Please try again.";
  }
}
