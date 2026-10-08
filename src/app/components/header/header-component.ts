import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoginComponent } from '../login/login';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FontAwesomeModule, LoginComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  readonly auth = inject(AuthService);

  showLogin = signal(false);

  openLogin() {
    this.showLogin.set(true);
  }

  closeLogin() {
    this.showLogin.set(false);
  }

  async logout() {
    await this.auth.logout();
  }
}
