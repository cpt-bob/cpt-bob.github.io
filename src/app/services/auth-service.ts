import { Service, inject, signal, computed, DestroyRef } from '@angular/core';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  getAuth,
} from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

@Service()
export class AuthService {
  private auth = getAuth();
  private firestore = getFirestore();
  private destroyRef = inject(DestroyRef);

  readonly user = signal<User | null | undefined>(undefined);
  readonly userName = signal<string>('');
  readonly isLoggedIn = computed(() => !!this.user());
  readonly isAuthReady = computed(() => this.user() !== undefined);

  constructor() {
    const unsub = onAuthStateChanged(this.auth, async (user) => {
      this.user.set(user);
      if (user) {
        await this.loadUserName(user.uid);
      } else {
        this.userName.set('');
      }
    });
    this.destroyRef.onDestroy(() => unsub());
  }

  private async loadUserName(uid: string) {
    try {
      const snap = await getDoc(doc(this.firestore, 'users', uid));
      if (snap.exists() && snap.data()['user']) {
        this.userName.set(snap.data()['user']);
        return;
      }
    } catch {
      // fall through
    }
    const u = this.user();
    this.userName.set(u?.displayName || u?.email || 'User');
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.userName.set('');
  }
}
