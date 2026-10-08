import {
  computed,
  DestroyRef,
  inject,
  Service,
  signal,
  effect,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { Database, onValue, push, ref, remove, set } from '@angular/fire/database';
import { AuthService } from './auth-service';
import { ShoppingItem } from '../models/model';

@Service()
export class ShoppingListService {
  private db = inject(Database);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(EnvironmentInjector);
  private unsubItems?: () => void;

  readonly items = signal<Record<string, ShoppingItem>>({});
  readonly loading = signal(true);
  readonly isAdding = signal(false);
  readonly isDeleting = signal(false);

  readonly selectedIds = computed(() =>
    Object.values(this.items())
      .filter((item) => item.checked)
      .map((item) => item.itemId),
  );

  readonly selectedCount = computed(() => this.selectedIds().length);

  readonly singleSelectedItem = computed(() => {
    const ids = this.selectedIds();
    if (ids.length !== 1) return null;
    return this.items()[ids[0]] ?? null;
  });

  readonly isEmpty = computed(() => !this.loading() && Object.keys(this.items()).length === 0);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.unsubItems?.();
      this.unsubItems = undefined;
    });

    effect(() => {
      const ready = this.auth.isAuthReady();
      const loggedIn = this.auth.isLoggedIn();

      if (!ready) return;

      if (!loggedIn) {
        this.items.set({});
        this.loading.set(false);
        this.unsubItems?.();
        this.unsubItems = undefined;
        return;
      }

      this.startItemsListener();
    });
  }

  private startItemsListener() {
    this.unsubItems?.();
    this.unsubItems = undefined;
    this.loading.set(true);

    runInInjectionContext(this.injector, () => {
      const itemsRef = ref(this.db, 'items');

      this.unsubItems = onValue(
        itemsRef,
        (snap) => {
          this.items.set({ ...(snap.val() || {}) });
          this.loading.set(false);
        },
        (err) => {
          console.error(err);
          this.loading.set(false);
        },
      );
    });
  }

  async addItem(store = '', item: string, quantity: string): Promise<void> {
    if (!item.trim() || !quantity.trim()) {
      throw new Error('Item name and quantity cannot be empty.');
    }

    this.isAdding.set(true);
    try {
      const newRef = push(ref(this.db, 'items'));
      await runInInjectionContext(this.injector, () => {
        return set(newRef, {
          itemId: newRef.key,
          item: item.trim(),
          quantity: quantity.trim(),
          store: store.trim(),
          user: this.auth.userName(),
          checked: false,
        });
      });
    } finally {
      this.isAdding.set(false);
    }
  }

  async toggleChecked(itemId: string): Promise<void> {
    const item = this.items()[itemId];
    if (!item) return;

    await runInInjectionContext(this.injector, () => {
      return set(ref(this.db, `items/${itemId}`), {
        ...item,
        checked: !item.checked,
      });
    });
  }

  async updateItem(item: ShoppingItem): Promise<void> {
    if (!item.item?.trim() || !item.quantity?.trim()) {
      throw new Error('Item name and quantity cannot be empty.');
    }

    await runInInjectionContext(this.injector, () => {
      return set(ref(this.db, `items/${item.itemId}`), {
        ...item,
        item: item.item.trim(),
        quantity: item.quantity.trim(),
        checked: false,
      });
    });
  }

  async deleteSelected(): Promise<void> {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    this.isDeleting.set(true);
    try {
      await runInInjectionContext(this.injector, () => {
        return Promise.all(ids.map((id) => remove(ref(this.db, `items/${id}`))));
      });
    } finally {
      this.isDeleting.set(false);
    }
  }
}
