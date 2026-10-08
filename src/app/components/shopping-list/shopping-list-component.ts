import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ShoppingListService } from '../../services/shopping-list-service';
import { AuthService } from '../../services/auth-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { ShoppingItemComponent } from '../shopping-item/shopping-item-component';
import { ShoppingItem } from '../../models/model';
import { ItemFormComponent } from '../item-form/item-form-component';
import { HeaderComponent } from '../header/header-component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog-component';
import { Footer } from '../footer/footer-component';
import { EditModalComponent } from '../edit-modal/edit-modal-component';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    FontAwesomeModule,
    CommonModule,
    ShoppingItemComponent,
    ItemFormComponent,
    HeaderComponent,
    ConfirmDialogComponent,
    Footer,
    EditModalComponent,
  ],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.css',
})
export class ShoppingListComponent {
  readonly list = inject(ShoppingListService);
  readonly auth = inject(AuthService);

  faTrash = faTrash;
  faEdit = faEdit;

  showConfirmDelete = signal(false);
  showEditModal = signal(false);
  editingItem = signal<ShoppingItem | null>(null);
  showLogin = signal(false);

  startEdit() {
    const item = this.list.singleSelectedItem();
    if (!item) return;
    this.editingItem.set({ ...item });
    this.showEditModal.set(true);
  }

  async onEditSave(updated: ShoppingItem) {
    try {
      await this.list.updateItem(updated);
      this.showEditModal.set(false);
      this.editingItem.set(null);
    } catch (err: any) {
      alert(err.message || 'Edit failed');
    }
  }

  cancelEdit() {
    this.showEditModal.set(false);
    this.editingItem.set(null);
  }

  // startEdit() you already have — keep it

  async deleteSelectedItems() {
    await this.list.deleteSelected();
    this.showConfirmDelete.set(false);
  }
}
