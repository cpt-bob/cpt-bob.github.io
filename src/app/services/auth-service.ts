import {
  Service,
  inject,
  signal,
  computed,
  DestroyRef,
  afterNextRender,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import {
  Auth,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Service()
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private destroyRef = inject(DestroyRef);
  private injector = inject(EnvironmentInjector);

  readonly user = signal<User | null | undefined>(undefined);
  readonly userName = signal<string>('');
  readonly isLoggedIn = computed(() => !!this.user());
  readonly isAuthReady = computed(() => this.user() !== undefined);

  constructor() {
    afterNextRender(() => {
      runInInjectionContext(this.injector, () => {
        const unsub = onAuthStateChanged(this.auth, async (user) => {
          this.user.set(user);

          if (user) {
            await this.loadUserName(user.uid);
          } else {
            this.userName.set('');
          }
        });

        this.destroyRef.onDestroy(() => unsub());
      });
    });
  }

  private async loadUserName(uid: string) {
    try {
      const snap = await runInInjectionContext(this.injector, () =>
        getDoc(doc(this.firestore, 'users', uid)),
      );
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
    await runInInjectionContext(this.injector, () =>
      signInWithEmailAndPassword(this.auth, email, password),
    );
  }

  async logout(): Promise<void> {
    await runInInjectionContext(this.injector, () => signOut(this.auth));
    this.userName.set('');
  }
}
