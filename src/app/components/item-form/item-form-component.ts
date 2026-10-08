import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShoppingListService } from '../../services/shopping-list-service';
import { STORES } from '../../models/stores';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './item-form.html',
  styleUrl: './item-form.css',
})
export class ItemFormComponent {
  readonly list = inject(ShoppingListService);
  readonly stores = STORES;

  itemName = '';
  quantity = '';
  store = '';

  async add() {
    if (!this.itemName.trim() || !this.quantity.trim()) return;

    try {
      await this.list.addItem(this.store, this.itemName, this.quantity);
      this.itemName = '';
      this.quantity = '';
      this.store = '';
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    }
  }

  onItemKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      (document.getElementById('quantity-input') as HTMLInputElement)?.focus();
    }
  }

  onQuantityKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.itemName.trim() && this.quantity.trim()) {
      event.preventDefault();
      this.add();
    }
  }
}
