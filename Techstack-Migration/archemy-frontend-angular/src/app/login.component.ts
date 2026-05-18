import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <main class="login-page">
      <section class="login-panel">
        <div class="brand login-brand">
          <img src="/images/archemy_logo_small.png" alt="Archemy" />
          <div>
            <strong>Archemy</strong>
            <span>Catalog Workbench</span>
          </div>
        </div>

        @if (!auth.requiresNewPassword()) {
          <form class="login-form" (ngSubmit)="signIn()">
            <h1>Sign in</h1>
            <label>Email <input type="email" name="email" autocomplete="username" [(ngModel)]="email" required /></label>
            <label>Password <input type="password" name="password" autocomplete="current-password" [(ngModel)]="password" required /></label>
            <button type="submit" [disabled]="auth.loading()">{{ auth.loading() ? 'Signing in...' : 'Sign in' }}</button>
          </form>
        } @else {
          <form class="login-form" (ngSubmit)="completeNewPassword()">
            <h1>Set password</h1>
            <p class="muted">Your Cognito invite requires a permanent password before opening the workbench.</p>
            <label>New Password <input type="password" name="newPassword" autocomplete="new-password" [(ngModel)]="newPassword" required /></label>
            <button type="submit" [disabled]="auth.loading()">{{ auth.loading() ? 'Updating...' : 'Continue' }}</button>
          </form>
        }

        @if (auth.error()) {
          <div class="auth-error">{{ auth.error() }}</div>
        }
      </section>
    </main>
  `,
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  email = '';
  password = '';
  newPassword = '';

  signIn(): void {
    void this.auth.signIn(this.email, this.password);
  }

  completeNewPassword(): void {
    void this.auth.completeNewPassword(this.newPassword);
  }
}
