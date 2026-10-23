import { Component, inject } from '@angular/core';
import { MockData, MockProgram } from '../../../core/mock-data';
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
  private readonly data = inject(MockData);
  private readonly dialogRef = inject(
    MatDialogRef<NewProgramDialog, MockProgram>,
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
    const program = this.data.createProgram(name, description);
    this.dialogRef.close(program);
  }
}
