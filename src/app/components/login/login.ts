import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service'; // adjust path if needed

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private auth = inject(AuthService);

  closed = output<void>();

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  async login() {
    if (!this.email.trim() || !this.password) return;

    this.loading.set(true);
    this.error.set('');

    try {
      await this.auth.login(this.email.trim(), this.password);
      this.closed.emit(); // close on success
    } catch (err: any) {
      this.error.set(err?.message || 'Login failed');
      // or use alert(err.message) if you prefer the original style
    } finally {
      this.loading.set(false);
    }
  }

  cancel() {
    this.closed.emit();
  }

  onEmailKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      (document.getElementById('password-input') as HTMLInputElement)?.focus();
    }
  }

  onPasswordKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.email && this.password && !this.loading()) {
      event.preventDefault();
      this.login();
    }
  }
}
