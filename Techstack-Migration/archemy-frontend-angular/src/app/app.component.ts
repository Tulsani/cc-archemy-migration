import { Component, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppDataService, UserRole } from './app-data.service';
import { AuthService } from './auth.service';
import { LoginComponent } from './login.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoginComponent],
  template: `
    @if (!auth.isAuthenticated()) {
      <app-login />
    } @else {
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <img src="/images/archemy_logo_small.png" alt="Archemy" />
          <div>
            <strong>Archemy</strong>
            <span>Catalog Workbench</span>
          </div>
        </div>

        <div class="session-card">
          <span>Signed in as</span>
          <strong>{{ auth.user()?.email }}</strong>
          <small>{{ auth.user()?.role || 'user' }}</small>
          <button type="button" class="ghost" (click)="signOut()">Sign out</button>
        </div>

        <nav>
          @for (item of visibleNav(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active">
              <span class="nav-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div>
            <span class="eyebrow">ADF migration preview</span>
            <h1>{{ pageTitle() }}</h1>
          </div>
          <button type="button" class="ghost" (click)="data.reset()">Rollback Mock Data</button>
        </header>

        @if (data.message()) {
          <div class="toast">{{ data.message() }}</div>
        }

        <router-outlet />
      </main>
    </div>
    }
  `,
})
export class AppComponent {
  readonly navItems = [
    { path: '/search-kad', label: 'Search Knowledge Artifacts', icon: 'S', permission: 'search-kad:view' },
    { path: '/catalog', label: 'Search or Add Catalog', icon: '+', permission: 'catalog:view' },
    { path: '/usage-statistics', label: 'View Usage Statistics', icon: 'U', permission: 'usage:view' },
    { path: '/register-usage', label: 'Register KAD Usage', icon: 'R', permission: 'register-usage:view' },
    { path: '/manage-domains', label: 'Manage Domains', icon: 'D', permission: 'manage-domains:manage' },
    { path: '/manage-dimensions', label: 'Manage Dimensions', icon: 'M', permission: 'manage-dimensions:manage' },
    { path: '/manage-areas', label: 'Manage Areas', icon: 'A', permission: 'manage-areas:manage' },
    { path: '/business-problems', label: 'Manage Business Problems', icon: 'B', permission: 'manage-bus-probs:manage' },
    { path: '/users-acl', label: 'Manage Users & ACL', icon: 'L', permission: 'users-acl:manage' },
    { path: '/customer-profile', label: 'Customer Profile', icon: 'P', permission: 'customer-profile:view' },
    { path: '/customers', label: 'View Customer Info', icon: 'C', permission: 'customer-info:view' },
    { path: '/change-password', label: 'Change Password', icon: '*', permission: 'password:change' },
  ];

  constructor(readonly data: AppDataService, readonly auth: AuthService, private readonly router: Router) {
    effect(() => {
      const user = this.auth.user();
      if (user) this.data.applyAuthenticatedUser(user);
    });
  }

  setRole(role: UserRole): void {
    this.data.setRole(role);
    this.leaveBlockedRoute();
  }

  setCurrentUser(userId: string): void {
    this.data.setCurrentUser(userId);
    this.leaveBlockedRoute();
  }

  signOut(): void {
    this.auth.signOut();
    this.router.navigateByUrl('/catalog');
  }

  visibleNav() {
    return this.navItems.filter((item) => this.data.hasPermission(item.permission));
  }

  pageTitle(): string {
    const active = this.navItems.find((item) => location.pathname === item.path);
    return active?.label ?? 'Search or Add Catalog';
  }

  private leaveBlockedRoute(): void {
    const active = this.navItems.find((item) => location.pathname === item.path);
    if (!active || this.data.hasPermission(active.permission)) return;

    const fallback = this.visibleNav()[0]?.path ?? '/catalog';
    this.router.navigateByUrl(fallback);
  }
}
