import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppDataService } from './app-data.service';
import {
  BusinessProblemsComponent,
  CatalogComponent,
  ChangePasswordComponent,
  CustomerInfoComponent,
  CustomerProfileComponent,
  ManageAreasComponent,
  ManageDimensionsComponent,
  ManageDomainsComponent,
  ManageUsersAclComponent,
  RegisterUsageComponent,
  SearchKadComponent,
  UsageStatisticsComponent,
} from './pages';

const permissionGuard = (permission: string) => () => {
  const data = inject(AppDataService);
  const router = inject(Router);
  return data.hasPermission(permission) || router.parseUrl('/catalog');
};

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalog' },
  { path: 'search-kad', component: SearchKadComponent, canActivate: [permissionGuard('search-kad:view')] },
  { path: 'catalog', component: CatalogComponent, canActivate: [permissionGuard('catalog:view')] },
  { path: 'usage-statistics', component: UsageStatisticsComponent, canActivate: [permissionGuard('usage:view')] },
  { path: 'register-usage', component: RegisterUsageComponent, canActivate: [permissionGuard('register-usage:view')] },
  { path: 'manage-domains', component: ManageDomainsComponent, canActivate: [permissionGuard('manage-domains:manage')] },
  { path: 'manage-dimensions', component: ManageDimensionsComponent, canActivate: [permissionGuard('manage-dimensions:manage')] },
  { path: 'manage-areas', component: ManageAreasComponent, canActivate: [permissionGuard('manage-areas:manage')] },
  { path: 'business-problems', component: BusinessProblemsComponent, canActivate: [permissionGuard('manage-bus-probs:manage')] },
  { path: 'users-acl', component: ManageUsersAclComponent, canActivate: [permissionGuard('users-acl:manage')] },
  { path: 'customer-profile', component: CustomerProfileComponent, canActivate: [permissionGuard('customer-profile:view')] },
  { path: 'customers', component: CustomerInfoComponent, canActivate: [permissionGuard('customer-info:view')] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [permissionGuard('password:change')] },
  { path: '**', redirectTo: 'catalog' },
];
