import { Component, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShoppingItem } from '../../models/model'; // adjust path
import { STORES } from '../../models/stores';

@Component({
  selector: 'app-edit-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './edit-modal.html',
})
export class EditModalComponent {
  /** Item to edit (required when modal is open) */
  item = input.required<ShoppingItem>();
  readonly stores = STORES;

  save = output<ShoppingItem>();
  cancel = output<void>();

  // Local editable copies so we don't mutate the list until Save
  itemName = signal('');
  quantity = signal('');
  saving = signal(false);
  store = signal('');

  constructor() {
    // When the input item changes, copy into local fields
    effect(() => {
      const current = this.item();
      this.itemName.set(current.item ?? '');
      this.quantity.set(current.quantity ?? '');
      this.store.set(current.store ?? '');
    });
  }

  onSave() {
    const name = this.itemName().trim();
    const qty = this.quantity().trim();
    if (!name || !qty) {
      alert('Item name and quantity cannot be empty.');
      return;
    }

    this.saving.set(true);
    this.save.emit({
      ...this.item(),
      item: name,
      quantity: qty,
      store: this.store().trim() || undefined,
      checked: false, // same as original app
    });
    this.saving.set(false);
  }

  onCancel() {
    this.cancel.emit();
  }
}
