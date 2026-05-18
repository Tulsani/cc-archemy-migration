import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccessRole, AppDataService, InviteUserInput, Permission, SearchCriteria, SearchResult } from './app-data.service';

@Component({
  standalone: true,
  selector: 'crud-toolbar',
  template: `
    <div class="toolbar">
      <button type="button" (click)="add.emit()">+ Add</button>
      <button type="button" class="ghost" (click)="save.emit()">Commit</button>
      <button type="button" class="ghost" (click)="rollback.emit()">Rollback</button>
    </div>
  `,
})
export class CrudToolbarComponent {
  @Output() add = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() rollback = new EventEmitter<void>();
}

const imports = [CommonModule, FormsModule, CrudToolbarComponent];

@Component({
  standalone: true,
  selector: 'app-search-kad',
  imports,
  template: `
    <section class="panel">
      <div class="panel-header">
        <h2>Knowledge Artifacts</h2>
        <input type="search" [(ngModel)]="filter" placeholder="Filter by name or domain" />
      </div>
      <table>
        <thead>
          <tr><th>KAD ID</th><th>KAD Name</th><th>Domain</th><th>Hit Count</th></tr>
        </thead>
        <tbody>
          @for (kad of filteredKads(); track kad.id) {
            <tr>
              <td>{{ kad.id }}</td>
              <td><a [href]="kad.publicLink" target="_blank" (click)="data.incrementHit(kad.id)">{{ kad.name }}</a></td>
              <td>{{ data.domainName(kad.domainId) }}</td>
              <td>{{ kad.hitCounter }}</td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class SearchKadComponent {
  filter = '';
  constructor(readonly data: AppDataService) {}

  filteredKads() {
    const term = this.filter.toLowerCase();
    return this.data.kads.filter((kad) => `${kad.name} ${this.data.domainName(kad.domainId)}`.toLowerCase().includes(term));
  }
}

@Component({
  standalone: true,
  selector: 'app-catalog',
  imports,
  template: `
    <section class="panel stack">
      <div class="grid two">
        <label>Domain
          <select [(ngModel)]="domainId" (change)="resetCriteriaDimensions()">
            @for (domain of data.domains; track domain.id) {
              <option [ngValue]="domain.id">{{ domain.name }}</option>
            }
          </select>
        </label>
        <label>Business Problem
          <select [(ngModel)]="businessProblemId">
            <option [ngValue]="null">All</option>
            @for (problem of data.businessProblems; track problem.id) {
              <option [ngValue]="problem.id">{{ problem.businessProblem }}</option>
            }
          </select>
        </label>
      </div>

      <div class="toolbar">
        <button type="button" (click)="addCriteria()">+ Add Criteria</button>
        <button type="button" class="ghost" (click)="removeCriteria()" [disabled]="criteria.length === 0">- Remove Criteria</button>
        <span class="meter">Remaining Weight {{ remainingWeight() }}</span>
      </div>

      <table>
        <thead>
          <tr><th>Dimension</th><th>Parent Area</th><th>Child Area</th><th>Weight</th><th>Closeness</th></tr>
        </thead>
        <tbody>
          @for (row of criteria; track row.id) {
            <tr>
              <td>
                <select [(ngModel)]="row.dimensionId" (change)="row.areaId = null; row.areaChildId = null">
                  <option [ngValue]="null"></option>
                  @for (dimension of data.dimensionsForDomain(domainId); track dimension.id) {
                    <option [ngValue]="dimension.id">{{ dimension.name }}</option>
                  }
                </select>
              </td>
              <td>
                <select [(ngModel)]="row.areaId" (change)="row.areaChildId = null">
                  <option [ngValue]="null"></option>
                  @for (area of data.parentAreas(row.dimensionId); track area.id) {
                    <option [ngValue]="area.id">{{ area.name }}</option>
                  }
                </select>
              </td>
              <td>
                <select [(ngModel)]="row.areaChildId">
                  <option [ngValue]="null"></option>
                  @for (area of data.childAreas(row.dimensionId, row.areaId); track area.id) {
                    <option [ngValue]="area.id">{{ area.name }}</option>
                  }
                </select>
              </td>
              <td><input type="number" min="0" max="100" [(ngModel)]="row.weight" /></td>
              <td><input type="number" min="0" max="100" [(ngModel)]="row.closeness" /></td>
            </tr>
          }
        </tbody>
      </table>

      <div class="toolbar">
        <button type="button" (click)="search()">Search KAD</button>
        @if (data.hasPermission('catalog:add-kad')) {
          <button type="button" (click)="showAdd = true">+ Add KAD</button>
        }
        @if (data.hasPermission('catalog:delete-kad')) {
          <button type="button" class="danger" (click)="deleteSelected()" [disabled]="!selectedResult">Delete KAD</button>
        }
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Search Results</h2>
        <span>{{ results.length }} rows</span>
      </div>
      <table>
        <thead>
          <tr><th></th><th>KAD ID</th><th>Link</th><th>Public Link</th><th>Name</th><th>Domain</th><th>Hit Count</th><th>Usage</th><th>Score</th><th>Absolute Score</th></tr>
        </thead>
        <tbody>
          @for (row of results; track row.id) {
            <tr [class.selected]="selectedResult?.id === row.id">
              <td><input type="radio" name="selectedKad" (change)="selectedResult = row" /></td>
              <td>{{ row.id }}</td>
              <td><a [href]="row.link" target="_blank" (click)="data.incrementHit(row.id); row.hitCounter = row.hitCounter + 1">Open</a></td>
              <td><a [href]="row.publicLink" target="_blank" (click)="data.incrementHit(row.id); row.hitCounter = row.hitCounter + 1">Public</a></td>
              <td>{{ row.name }}</td>
              <td>{{ row.domainName }}</td>
              <td>{{ row.hitCounter }}</td>
              <td><button type="button" class="link-button" (click)="usageKadId = row.id">View Usage Statistics</button></td>
              <td>{{ row.relativeScore }}%</td>
              <td>{{ row.score }}</td>
            </tr>
          }
        </tbody>
      </table>
    </section>

    @if (showAdd) {
      <div class="modal-backdrop">
        <form class="modal" (ngSubmit)="addKad()">
          <h2>Add KAD</h2>
          <label>KAD Name <input required name="name" [(ngModel)]="newKad.name" /></label>
          <label>KAD Link <textarea required name="link" [(ngModel)]="newKad.link"></textarea></label>
          <label>Public Link <textarea required name="publicLink" [(ngModel)]="newKad.publicLink"></textarea></label>
          <label>Business Problem
            <select required name="businessProblemId" [(ngModel)]="newKad.businessProblemId">
              @for (problem of data.businessProblems; track problem.id) {
                <option [ngValue]="problem.id">{{ problem.businessProblem }}</option>
              }
            </select>
          </label>
          <div class="toolbar end">
            <button type="submit">Save</button>
            <button type="button" class="ghost" (click)="showAdd = false">Cancel</button>
          </div>
        </form>
      </div>
    }

    @if (usageKadId) {
      <div class="modal-backdrop">
        <div class="modal wide">
          <h2>Usage Summary</h2>
          <table>
            <thead><tr><th>KAD ID</th><th>Deployment</th><th>Applicability</th><th>Benefit</th><th>Maturity</th></tr></thead>
            <tbody>
              @for (row of data.summaryForKad(usageKadId); track row.kadId) {
                <tr><td>{{ row.kadId }}</td><td>{{ row.deploymentStatus }}</td><td>{{ row.applicabilityExtent }}</td><td>{{ row.avgBenefitRating }}</td><td>{{ row.avgMaturityRating }}</td></tr>
              } @empty {
                <tr><td colspan="5">No usage registrations found.</td></tr>
              }
            </tbody>
          </table>
          <div class="toolbar end"><button type="button" (click)="usageKadId = null">OK</button></div>
        </div>
      </div>
    }
  `,
})
export class CatalogComponent {
  domainId = 1;
  businessProblemId: number | null = null;
  criteria: SearchCriteria[] = [];
  results: SearchResult[] = [];
  selectedResult: SearchResult | null = null;
  showAdd = false;
  usageKadId: number | null = null;
  newKad = { name: '', link: '', publicLink: '', businessProblemId: 1 };

  constructor(readonly data: AppDataService) {
    this.criteria = [this.data.addCriteria()];
  }

  addCriteria(): void {
    this.criteria = [...this.criteria, this.data.addCriteria()];
  }

  removeCriteria(): void {
    this.criteria = this.criteria.slice(0, -1);
  }

  remainingWeight(): number {
    return 100 - this.criteria.reduce((total, row) => total + Number(row.weight || 0), 0);
  }

  resetCriteriaDimensions(): void {
    this.criteria.forEach((item) => {
      item.dimensionId = null;
      item.areaId = null;
      item.areaChildId = null;
    });
  }

  search(): void {
    if (!this.criteria.length || this.criteria.every((item) => !item.dimensionId)) {
      this.data.toast('Kindly add a criteria');
      return;
    }
    if (this.remainingWeight() !== 0) {
      this.data.toast('Total weight across all values must be 100');
      return;
    }
    this.results = this.data.searchKads(this.criteria, this.businessProblemId);
    this.selectedResult = null;
  }

  addKad(): void {
    this.data.addKad({ ...this.newKad, domainId: this.domainId }, this.criteria);
    this.showAdd = false;
    this.newKad = { name: '', link: '', publicLink: '', businessProblemId: 1 };
    this.search();
  }

  deleteSelected(): void {
    if (!this.selectedResult) return;
    this.data.deleteKad(this.selectedResult.id);
    this.search();
  }
}

@Component({
  standalone: true,
  selector: 'app-manage-domains',
  imports,
  template: `
    <section class="panel">
      <crud-toolbar (add)="data.addDomain()" (save)="data.toast('Domains committed')" (rollback)="data.reset()" />
      <table>
        <thead><tr><th>Domain Name</th><th>Description</th><th></th></tr></thead>
        <tbody>
          @for (row of data.domains; track row.id) {
            <tr>
              <td><input [(ngModel)]="row.name" /></td>
              <td><input [(ngModel)]="row.description" /></td>
              <td><button class="danger" type="button" (click)="data.deleteDomain(row.id)">Delete</button></td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class ManageDomainsComponent {
  constructor(readonly data: AppDataService) {}
}

@Component({
  standalone: true,
  selector: 'app-manage-dimensions',
  imports,
  template: `
    <section class="panel">
      <crud-toolbar (add)="data.addDimension()" (save)="data.toast('Dimensions committed')" (rollback)="data.reset()" />
      <table>
        <thead><tr><th>Domain</th><th>Dimension Name</th><th></th></tr></thead>
        <tbody>
          @for (row of data.dimensions; track row.id) {
            <tr>
              <td>
                <select [(ngModel)]="row.domainId">
                  @for (domain of data.domains; track domain.id) {
                    <option [ngValue]="domain.id">{{ domain.name }}</option>
                  }
                </select>
              </td>
              <td><input [(ngModel)]="row.name" /></td>
              <td><button class="danger" type="button" (click)="data.deleteDimension(row.id)">Delete</button></td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class ManageDimensionsComponent {
  constructor(readonly data: AppDataService) {}
}

@Component({
  standalone: true,
  selector: 'app-manage-areas',
  imports,
  template: `
    <section class="panel">
      <crud-toolbar (add)="data.addArea()" (save)="data.toast('Areas committed')" (rollback)="data.reset()" />
      <table>
        <thead><tr><th>Dimension</th><th>Area Name</th><th>Order</th><th>Parent</th><th>Depth</th><th></th></tr></thead>
        <tbody>
          @for (row of data.areas; track row.id) {
            <tr>
              <td>
                <select [(ngModel)]="row.dimensionId" (change)="row.parentId = null; data.syncAreaDepth(row)">
                  @for (dimension of data.dimensions; track dimension.id) {
                    <option [ngValue]="dimension.id">{{ dimension.name }}</option>
                  }
                </select>
              </td>
              <td><input [(ngModel)]="row.name" /></td>
              <td><input [(ngModel)]="row.orderNo" /></td>
              <td>
                <select [(ngModel)]="row.parentId" (change)="data.syncAreaDepth(row)">
                  <option [ngValue]="null"></option>
                  @for (area of possibleParents(row.id, row.dimensionId); track area.id) {
                    <option [ngValue]="area.id">{{ area.name }}</option>
                  }
                </select>
              </td>
              <td><input type="number" [(ngModel)]="row.depth" /></td>
              <td><button class="danger" type="button" (click)="data.deleteArea(row.id)">Delete</button></td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class ManageAreasComponent {
  constructor(readonly data: AppDataService) {}

  possibleParents(id: number, dimensionId: number) {
    return this.data.areas.filter((area) => area.id !== id && area.dimensionId === dimensionId);
  }
}

@Component({
  standalone: true,
  selector: 'app-business-problems',
  imports,
  template: `
    <section class="panel">
      <crud-toolbar (add)="data.addBusinessProblem()" (save)="data.toast('Business problems committed')" (rollback)="data.reset()" />
      <table>
        <thead><tr><th>Business Problem</th><th>Context</th><th>Description</th><th>Type</th><th></th></tr></thead>
        <tbody>
          @for (row of data.businessProblems; track row.id) {
            <tr>
              <td><input [(ngModel)]="row.businessProblem" /></td>
              <td><select [(ngModel)]="row.context">@for (context of data.contexts; track context) { <option>{{ context }}</option> }</select></td>
              <td><input [(ngModel)]="row.description" /></td>
              <td><select [(ngModel)]="row.type">@for (type of data.problemTypes; track type) { <option>{{ type }}</option> }</select></td>
              <td><button class="danger" type="button" (click)="data.deleteBusinessProblem(row.id)">Delete</button></td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class BusinessProblemsComponent {
  constructor(readonly data: AppDataService) {}
}

@Component({
  standalone: true,
  selector: 'app-manage-users-acl',
  imports,
  template: `
    <div class="grid acl-grid">
      <section class="panel stack">
        <div class="panel-header">
          <h2>Users</h2>
          <button type="button" (click)="inviteUser()">Invite User</button>
        </div>
        <div class="inline-form">
          <input type="email" [(ngModel)]="invite.email" placeholder="email@example.com" />
          <input [(ngModel)]="invite.firstName" placeholder="First name" />
          <input [(ngModel)]="invite.lastName" placeholder="Last name" />
          <select [(ngModel)]="invite.role">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <table>
          <thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Status</th><th>Roles</th><th></th></tr></thead>
          <tbody>
            @for (user of data.users; track user.id) {
              <tr>
                <td><input [(ngModel)]="user.id" /></td>
                <td><input [(ngModel)]="user.displayName" /></td>
                <td><input type="email" [(ngModel)]="user.email" /></td>
                <td>
                  <select [(ngModel)]="user.status">
                    <option>Active</option>
                    <option>Disabled</option>
                  </select>
                </td>
                <td>
                  <div class="check-list">
                    @for (role of data.accessRoles; track role.id) {
                      <label class="check-row">
                        <input type="checkbox" [checked]="user.roleIds.includes(role.id)" (change)="data.toggleUserRole(user, role.id)" />
                        <span>{{ role.name }}</span>
                      </label>
                    }
                  </div>
                </td>
                <td><button type="button" class="danger" (click)="data.deleteUser(user.id)">Delete</button></td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section class="panel stack">
        <div class="panel-header">
          <h2>Roles</h2>
          <button type="button" (click)="data.addAccessRole()">+ Add Role</button>
        </div>
        <table>
          <thead><tr><th>Role</th><th>Description</th><th></th></tr></thead>
          <tbody>
            @for (role of data.accessRoles; track role.id) {
              <tr [class.selected]="selectedRole?.id === role.id">
                <td><input [(ngModel)]="role.name" (focus)="selectedRole = role" /></td>
                <td><input [(ngModel)]="role.description" (focus)="selectedRole = role" /></td>
                <td>
                  <button type="button" class="ghost" (click)="selectedRole = role">Edit ACL</button>
                  <button type="button" class="danger" (click)="deleteRole(role.id)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </div>

    <section class="panel stack">
      <div class="panel-header">
        <h2>Role ACL</h2>
        <label class="inline-select">Role
          <select [ngModel]="selectedRole?.id" (ngModelChange)="selectRole($event)">
            @for (role of data.accessRoles; track role.id) {
              <option [ngValue]="role.id">{{ role.name }}</option>
            }
          </select>
        </label>
      </div>

      @if (selectedRole) {
        <div class="permission-matrix">
          @for (category of permissionCategories(); track category) {
            <div class="permission-group">
              <h3>{{ category }}</h3>
              @for (permission of permissionsForCategory(category); track permission.id) {
                <label class="check-row">
                  <input type="checkbox"
                         [checked]="selectedRole.permissionIds.includes(permission.id)"
                         (change)="data.toggleRolePermission(selectedRole, permission.id)" />
                  <span>{{ permission.label }}</span>
                  <code>{{ permission.id }}</code>
                </label>
              }
            </div>
          }
        </div>
      }

      <div class="acl-note">
        This mirrors the future DynamoDB ACL document: users receive roles, roles receive permission keys, and Angular uses those keys to show routes and actions.
      </div>
    </section>
  `,
})
export class ManageUsersAclComponent {
  selectedRole: AccessRole | undefined;
  invite: InviteUserInput = {
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
  };

  constructor(readonly data: AppDataService) {
    this.selectedRole = this.data.accessRoles[0];
  }

  selectRole(roleId: string): void {
    this.selectedRole = this.data.accessRoles.find((role) => role.id === roleId);
  }

  deleteRole(roleId: string): void {
    this.data.deleteAccessRole(roleId);
    this.selectedRole = this.data.accessRoles[0];
  }

  inviteUser(): void {
    this.data.inviteUser(this.invite);
    this.invite = { email: '', firstName: '', lastName: '', role: 'user' };
  }

  permissionCategories(): string[] {
    return Array.from(new Set(this.data.permissions.map((permission) => permission.category)));
  }

  permissionsForCategory(category: string): Permission[] {
    return this.data.permissions.filter((permission) => permission.category === category);
  }
}

@Component({
  standalone: true,
  selector: 'app-register-usage',
  imports,
  template: `
    <section class="panel">
      <crud-toolbar (add)="data.addRegistration()" (save)="data.toast('Usage registration saved')" (rollback)="data.reset()" />
      <table>
        <thead><tr><th>KAD</th><th>Maturity</th><th>Deployment</th><th>Applicability</th><th>Benefit</th><th>Comments</th></tr></thead>
        <tbody>
          @for (row of data.registrations; track row.id) {
            <tr>
              <td><select [(ngModel)]="row.kadId">@for (kad of data.kads; track kad.id) { <option [ngValue]="kad.id">{{ kad.name }}</option> }</select></td>
              <td><select [(ngModel)]="row.maturityRating">@for (rating of data.ratings; track rating) { <option>{{ rating }}</option> }</select></td>
              <td><select [(ngModel)]="row.deploymentStatus">@for (status of data.deploymentStatuses; track status) { <option>{{ status }}</option> }</select></td>
              <td><select [(ngModel)]="row.applicabilityExtent">@for (extent of data.applicabilityExtents; track extent) { <option>{{ extent }}</option> }</select></td>
              <td><select [(ngModel)]="row.benefitRating">@for (rating of data.ratings; track rating) { <option>{{ rating }}</option> }</select></td>
              <td><input [(ngModel)]="row.comments" /></td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class RegisterUsageComponent {
  constructor(readonly data: AppDataService) {}
}

@Component({
  standalone: true,
  selector: 'app-usage-statistics',
  imports,
  template: `
    <section class="panel">
      <table>
        <thead><tr><th>KAD</th><th>Customer</th><th>Maturity</th><th>Deployment</th><th>Applicability</th><th>Benefit</th><th>Comments</th></tr></thead>
        <tbody>
          @for (row of data.registrations; track row.id) {
            <tr>
              <td>{{ kadName(row.kadId) }}</td>
              <td>{{ customerName(row.userId) }}</td>
              <td>{{ row.maturityRating }}</td>
              <td>{{ row.deploymentStatus }}</td>
              <td>{{ row.applicabilityExtent }}</td>
              <td>{{ row.benefitRating }}</td>
              <td><input [(ngModel)]="row.comments" /></td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class UsageStatisticsComponent {
  constructor(readonly data: AppDataService) {}

  kadName(kadId: number): string {
    return this.data.kads.find((kad) => kad.id === kadId)?.name ?? '';
  }

  customerName(userId: string): string {
    return this.data.customers.find((customer) => customer.userId === userId)?.customerName ?? userId;
  }
}

@Component({
  standalone: true,
  selector: 'app-customer-profile',
  imports,
  template: `
    <section class="panel narrow">
      <label>Customer Name <input [(ngModel)]="customer.customerName" /></label>
      <label>Industry <input [(ngModel)]="customer.industry" /></label>
      <div class="toolbar end"><button type="button" (click)="data.toast('Customer profile saved')">Save</button></div>
    </section>
  `,
})
export class CustomerProfileComponent {
  customer;

  constructor(readonly data: AppDataService) {
    this.customer = this.data.customers[0];
  }
}

@Component({
  standalone: true,
  selector: 'app-customer-info',
  imports,
  template: `
    <section class="panel">
      <table>
        <thead><tr><th>User ID</th><th>Customer Name</th><th>Industry</th></tr></thead>
        <tbody>
          @for (row of data.customers; track row.userId) {
            <tr><td>{{ row.userId }}</td><td>{{ row.customerName }}</td><td>{{ row.industry }}</td></tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class CustomerInfoComponent {
  constructor(readonly data: AppDataService) {}
}

@Component({
  standalone: true,
  selector: 'app-change-password',
  imports,
  template: `
    <section class="panel narrow">
      <label>Old Password <input type="password" [(ngModel)]="oldPassword" /></label>
      <label>New Password <input type="password" [(ngModel)]="newPassword" /></label>
      <label>Confirm New Password <input type="password" [(ngModel)]="confirmPassword" /></label>
      <div class="policy">
        <div><span>User Change Password</span><strong>true</strong></div>
        <div><span>Expire Warning Days</span><strong>7</strong></div>
        <div><span>Min Length</span><strong>8</strong></div>
        <div><span>Max Failure</span><strong>5</strong></div>
      </div>
      <div class="toolbar end"><button type="button" (click)="changePassword()">Change Password</button></div>
    </section>
  `,
})
export class ChangePasswordComponent {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  constructor(readonly data: AppDataService) {}

  changePassword(): void {
    this.data.toast(this.newPassword === this.confirmPassword ? 'Password has been changed' : 'Passwords do not match');
  }
}
