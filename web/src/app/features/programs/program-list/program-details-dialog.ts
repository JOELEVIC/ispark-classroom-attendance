import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Program } from './program-api.service';

@Component({
  selector: 'app-program-details-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './program-details-dialog.html',
  styleUrl: './program-details-dialog.css',
})
export class ProgramDetailsDialog {
  protected readonly program = inject<Program>(MAT_DIALOG_DATA);
}
