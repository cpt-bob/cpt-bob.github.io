import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialogComponent {
  title = input<string>('Confirm');
  message = input<string>('Are you sure?');
  confirmText = input<string>('Yes, Delete');
  cancelText = input<string>('Cancel');
  loading = input<boolean>(false);

  confirm = output<void>();
  cancel = output<void>();

  onConfirm() {
    if (this.loading()) return;
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
