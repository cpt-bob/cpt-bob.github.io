import { Component, inject, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { ShoppingItem } from '../../models/model';
import { ShoppingListService } from '../../services/shopping-list-service';

@Component({
  selector: 'app-shopping-item',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './shopping-item.html',
  styleUrl: './shopping-item.css',
})
export class ShoppingItemComponent {
  item = input.required<ShoppingItem>();
  private list = inject(ShoppingListService);

  faCheck = faCheck;

  toggle() {
    this.list.toggleChecked(this.item().itemId);
  }
}
