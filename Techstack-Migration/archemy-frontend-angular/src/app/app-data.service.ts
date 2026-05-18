import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { AuthenticatedUser, UserAclDocument } from './auth.service';
import { adminAclApiUrl } from './auth.config';

export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: string;
  displayName: string;
  email: string;
  status: 'Active' | 'Disabled';
  roleIds: string[];
}

export interface AccessRole {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
}

export interface Permission {
  id: string;
  label: string;
  category: string;
}

export interface Domain {
  id: number;
  name: string;
  description: string;
}

export interface Dimension {
  id: number;
  name: string;
  domainId: number;
}

export interface Area {
  id: number;
  dimensionId: number;
  name: string;
  parentId: number | null;
  orderNo: string;
  depth: number;
}

export interface BusinessProblem {
  id: number;
  businessProblem: string;
  context: string;
  type: string;
  description: string;
}

export interface Kad {
  id: number;
  name: string;
  domainId: number;
  link: string;
  publicLink: string;
  hitCounter: number;
  businessProblemId: number;
}

export interface KadArea {
  kadId: number;
  dimensionId: number;
  areaId: number | null;
  areaParentId: number | null;
}

export interface SearchCriteria {
  id: string;
  dimensionId: number | null;
  areaId: number | null;
  areaChildId: number | null;
  weight: number;
  closeness: number;
}

export interface SearchResult extends Kad {
  domainName: string;
  score: number;
  relativeScore: number;
}

export interface KadRegistration {
  id: number;
  kadId: number;
  userId: string;
  maturityRating: string;
  deploymentStatus: string;
  applicabilityExtent: string;
  benefitRating: string;
  comments: string;
}

export interface Customer {
  userId: string;
  customerName: string;
  industry: string;
}

export interface InviteUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
}

interface Snapshot {
  users: AppUser[];
  accessRoles: AccessRole[];
  permissions: Permission[];
  domains: Domain[];
  dimensions: Dimension[];
  areas: Area[];
  businessProblems: BusinessProblem[];
  kads: Kad[];
  kadAreas: KadArea[];
  registrations: KadRegistration[];
  customers: Customer[];
}

const initialState: Snapshot = {
  permissions: [
    { id: 'search-kad:view', label: 'Search Knowledge Artifacts', category: 'Catalog' },
    { id: 'catalog:view', label: 'Search or Add Catalog', category: 'Catalog' },
    { id: 'catalog:add-kad', label: 'Add KAD', category: 'Catalog' },
    { id: 'catalog:delete-kad', label: 'Delete KAD', category: 'Catalog' },
    { id: 'usage:view', label: 'View Usage Statistics', category: 'Usage' },
    { id: 'usage:edit-comments', label: 'Edit Usage Comments', category: 'Usage' },
    { id: 'register-usage:view', label: 'Register KAD Usage', category: 'Usage' },
    { id: 'manage-domains:manage', label: 'Manage Domains', category: 'Admin' },
    { id: 'manage-dimensions:manage', label: 'Manage Dimensions', category: 'Admin' },
    { id: 'manage-areas:manage', label: 'Manage Areas', category: 'Admin' },
    { id: 'manage-bus-probs:manage', label: 'Manage Business Problems', category: 'Admin' },
    { id: 'customer-profile:view', label: 'Customer Profile', category: 'Customer' },
    { id: 'customer-info:view', label: 'View Customer Info', category: 'Customer' },
    { id: 'password:change', label: 'Change Password', category: 'Account' },
    { id: 'users-acl:manage', label: 'Manage Users and ACL', category: 'Security' },
  ],
  accessRoles: [
    {
      id: 'admin',
      name: 'Admin',
      description: 'Catalog administrator with maintenance and ACL permissions.',
      permissionIds: [
        'search-kad:view',
        'catalog:view',
        'catalog:add-kad',
        'catalog:delete-kad',
        'usage:view',
        'usage:edit-comments',
        'manage-domains:manage',
        'manage-dimensions:manage',
        'manage-areas:manage',
        'manage-bus-probs:manage',
        'customer-info:view',
        'password:change',
        'users-acl:manage',
      ],
    },
    {
      id: 'normal',
      name: 'Normal User',
      description: 'Consumer flow for searching, registering usage, and editing profile.',
      permissionIds: [
        'search-kad:view',
        'catalog:view',
        'usage:view',
        'register-usage:view',
        'customer-profile:view',
        'password:change',
      ],
    },
  ],
  users: [
    { id: 'admin.user', displayName: 'Admin User', email: 'admin.user@example.com', status: 'Active', roleIds: ['admin'] },
    { id: 'normal.user', displayName: 'Normal User', email: 'normal.user@example.com', status: 'Active', roleIds: ['normal'] },
    { id: 'jane.user', displayName: 'Jane User', email: 'jane.user@example.com', status: 'Active', roleIds: ['normal'] },
  ],
  domains: [
    { id: 1, name: 'Business Solutions', description: 'Business Solutions' },
    { id: 2, name: 'HealthTech', description: 'Healthcare architecture catalog' },
    { id: 3, name: 'SocialMedia', description: 'Social media solution patterns' },
    { id: 4, name: 'DataIntegration', description: 'Data integration and exchange' },
    { id: 5, name: 'WebsiteGalleryMgt', description: 'Website gallery management' },
  ],
  dimensions: [
    { id: 1, name: 'Business Force', domainId: 1 },
    { id: 2, name: 'Type', domainId: 1 },
    { id: 3, name: 'Coverage Domain', domainId: 1 },
    { id: 4, name: 'Scope', domainId: 1 },
    { id: 5, name: 'Completeness Level', domainId: 1 },
    { id: 6, name: 'Degree of Standardization', domainId: 1 },
    { id: 7, name: 'Maturity', domainId: 1 },
    { id: 8, name: 'Granularity', domainId: 1 },
    { id: 9, name: 'Area of Applicability', domainId: 1 },
    { id: 10, name: 'Degree of Innovation', domainId: 1 },
    { id: 11, name: 'Innovation Extent', domainId: 1 },
    { id: 12, name: 'Innovation Area', domainId: 1 },
  ],
  areas: [
    { id: 1, parentId: null, orderNo: '20', depth: 0, dimensionId: 1, name: 'Business Area' },
    { id: 2, parentId: null, orderNo: '100', depth: 0, dimensionId: 1, name: 'Functional Requirement' },
    { id: 3, parentId: null, orderNo: '180', depth: 0, dimensionId: 1, name: 'Non-Functional Requirements' },
    { id: 101, parentId: 1, orderNo: '40', depth: 1, dimensionId: 1, name: 'Input' },
    { id: 102, parentId: 1, orderNo: '60', depth: 1, dimensionId: 1, name: 'Output' },
    { id: 103, parentId: 1, orderNo: '80', depth: 1, dimensionId: 1, name: 'Process' },
    { id: 4, parentId: null, orderNo: '540', depth: 0, dimensionId: 2, name: 'Hybrid' },
    { id: 5, parentId: null, orderNo: '560', depth: 0, dimensionId: 2, name: 'Structural' },
    { id: 6, parentId: null, orderNo: '620', depth: 0, dimensionId: 2, name: 'Transformational' },
    { id: 501, parentId: 5, orderNo: '580', depth: 1, dimensionId: 2, name: 'Abstract' },
    { id: 502, parentId: 5, orderNo: '600', depth: 1, dimensionId: 2, name: 'Concrete' },
    { id: 7, parentId: null, orderNo: '700', depth: 0, dimensionId: 3, name: 'Business' },
    { id: 8, parentId: null, orderNo: '720', depth: 0, dimensionId: 3, name: 'Application' },
    { id: 9, parentId: null, orderNo: '740', depth: 0, dimensionId: 3, name: 'Information' },
    { id: 10, parentId: null, orderNo: '760', depth: 0, dimensionId: 3, name: 'Infrastructure' },
    { id: 13, parentId: null, orderNo: '820', depth: 0, dimensionId: 4, name: 'Division' },
    { id: 14, parentId: null, orderNo: '840', depth: 0, dimensionId: 4, name: 'Enterprise' },
    { id: 15, parentId: null, orderNo: '860', depth: 0, dimensionId: 4, name: 'Partial' },
    { id: 17, parentId: null, orderNo: '900', depth: 0, dimensionId: 5, name: 'Partial' },
    { id: 18, parentId: null, orderNo: '920', depth: 0, dimensionId: 5, name: 'Complete' },
    { id: 19, parentId: null, orderNo: '940', depth: 0, dimensionId: 6, name: 'Candidate' },
    { id: 20, parentId: null, orderNo: '960', depth: 0, dimensionId: 6, name: 'Best Practice' },
    { id: 21, parentId: null, orderNo: '980', depth: 0, dimensionId: 7, name: 'Ideation' },
    { id: 22, parentId: null, orderNo: '1040', depth: 0, dimensionId: 7, name: 'Inception' },
    { id: 23, parentId: null, orderNo: '1100', depth: 0, dimensionId: 7, name: 'Elaboration' },
    { id: 25, parentId: null, orderNo: '1220', depth: 0, dimensionId: 7, name: 'Implementation Prototype' },
    { id: 26, parentId: null, orderNo: '1240', depth: 0, dimensionId: 7, name: 'Implementation' },
    { id: 2201, parentId: 22, orderNo: '1060', depth: 1, dimensionId: 7, name: 'Requirements Engineering Level' },
    { id: 29, parentId: null, orderNo: '1300', depth: 0, dimensionId: 8, name: 'Framework' },
    { id: 30, parentId: null, orderNo: '1320', depth: 0, dimensionId: 8, name: 'Solution' },
    { id: 32, parentId: null, orderNo: '1360', depth: 0, dimensionId: 8, name: 'Capability' },
    { id: 3201, parentId: 32, orderNo: '1380', depth: 1, dimensionId: 8, name: 'Business Capability' },
    { id: 32101, parentId: 32, orderNo: '1640', depth: 1, dimensionId: 8, name: 'Technology Capability' },
    { id: 32104, parentId: 32101, orderNo: '1720', depth: 2, dimensionId: 8, name: 'Cloud' },
    { id: 37, parentId: null, orderNo: '2100', depth: 0, dimensionId: 9, name: 'System of' },
    { id: 38, parentId: null, orderNo: '2200', depth: 0, dimensionId: 9, name: 'Industry' },
    { id: 39, parentId: null, orderNo: '2560', depth: 0, dimensionId: 9, name: 'Technology Service' },
    { id: 3808, parentId: 38, orderNo: '2360', depth: 1, dimensionId: 9, name: 'Healthcare' },
    { id: 3903, parentId: 39, orderNo: '2620', depth: 1, dimensionId: 9, name: 'Integration' },
    { id: 44, parentId: null, orderNo: '3360', depth: 0, dimensionId: 10, name: 'Emerging' },
    { id: 45, parentId: null, orderNo: '3380', depth: 0, dimensionId: 10, name: 'Adolescent' },
    { id: 46, parentId: null, orderNo: '3400', depth: 0, dimensionId: 10, name: 'Early Mainstream' },
    { id: 48, parentId: null, orderNo: '3440', depth: 0, dimensionId: 11, name: 'Sustaining' },
    { id: 49, parentId: null, orderNo: '3460', depth: 0, dimensionId: 11, name: 'Enhancing' },
    { id: 51, parentId: null, orderNo: '3500', depth: 0, dimensionId: 11, name: 'Research/Invention' },
    { id: 52, parentId: null, orderNo: '3520', depth: 0, dimensionId: 12, name: 'Input' },
    { id: 53, parentId: null, orderNo: '3540', depth: 0, dimensionId: 12, name: 'Process' },
    { id: 54, parentId: null, orderNo: '3560', depth: 0, dimensionId: 12, name: 'Output' },
  ],
  businessProblems: [
    { id: 1, businessProblem: 'Taxonomy Management', context: 'Generic', type: 'Recurring', description: 'Taxonomy Management' },
    { id: 2, businessProblem: 'Healthcare Taxonomy Management', context: 'Industry', type: 'Recurring', description: 'Healthcare Taxonomy' },
    { id: 3, businessProblem: 'Social Sentiment Analysis', context: 'Generic', type: 'Recurring', description: 'Sentiment Analysis' },
    { id: 4, businessProblem: 'Heterogeneous Data Integration', context: 'Generic', type: 'Recurring', description: 'Data Management' },
    { id: 5, businessProblem: 'Multidimensional Search', context: 'Generic', type: 'Recurring', description: 'Dynamic Taxonomy-driven Search' },
    { id: 6, businessProblem: 'Expert Service Resource Management', context: 'Generic', type: 'Recurring', description: 'AI/Cloud-based Expert Service Delivery' },
  ],
  kads: [
    { id: 1, name: 'Dynamic Multimedia Site Generator', domainId: 1, link: 'https://archemy.com/static/docs/showcase/NCDBSolutionSummary.pdf', publicLink: 'https://archemy.com/static/docs/showcase/NCDBSolutionSummary.pdf', hitCounter: 0, businessProblemId: 1 },
    { id: 2, name: 'Hetergeneous Data Management Platform', domainId: 1, link: 'https://archemy.com/static/docs/showcase/HDMP.pdf', publicLink: 'https://archemy.com/static/docs/showcase/HDMP.pdf', hitCounter: 0, businessProblemId: 4 },
    { id: 3, name: 'Biobanking Semantics Management Platform', domainId: 1, link: 'https://archemy.com/static/docs/showcase/BiobankKADSummary.pdf', publicLink: 'https://archemy.com/static/docs/showcase/BiobankKADSummary.pdf', hitCounter: 0, businessProblemId: 2 },
    { id: 4, name: 'EAM as a Cloud-Based Service', domainId: 1, link: 'https://archemy.com/static/docs/showcase/EAMaaS.pdf', publicLink: 'https://archemy.com/static/docs/showcase/EAMaaS.pdf', hitCounter: 0, businessProblemId: 6 },
    { id: 5, name: 'Real-Time Social Sentiment Analysis', domainId: 1, link: 'https://archemy.com/static/docs/showcase/ESRTSA.pdf', publicLink: 'https://archemy.com/static/docs/showcase/ESRTSA.pdf', hitCounter: 0, businessProblemId: 3 },
    { id: 6, name: 'Health Metering Platform', domainId: 1, link: 'https://archemy.com/static/docs/showcase/ArchNav.pdf', publicLink: 'https://archemy.com/static/docs/showcase/ArchNav.pdf', hitCounter: 0, businessProblemId: 5 },
  ],
  kadAreas: [
    { kadId: 2, dimensionId: 1, areaId: 5, areaParentId: 0 },
    { kadId: 2, dimensionId: 4, areaId: 5, areaParentId: 0 },
    { kadId: 3, dimensionId: 1, areaId: 9, areaParentId: 0 },
    { kadId: 3, dimensionId: 1, areaId: 11, areaParentId: 0 },
    { kadId: 3, dimensionId: 10, areaId: null, areaParentId: 9 },
    { kadId: 4, dimensionId: 1, areaId: 13, areaParentId: 0 },
    { kadId: 4, dimensionId: 7, areaId: 25, areaParentId: 0 },
    { kadId: 5, dimensionId: 1, areaId: 18, areaParentId: 0 },
    { kadId: 5, dimensionId: 10, areaId: 46, areaParentId: 0 },
    { kadId: 6, dimensionId: 1, areaId: 19, areaParentId: 0 },
    { kadId: 6, dimensionId: 7, areaId: 19, areaParentId: 0 },
    { kadId: 6, dimensionId: 12, areaId: 54, areaParentId: 0 },
    { kadId: 4, dimensionId: 8, areaId: 29, areaParentId: 0 },
    { kadId: 6, dimensionId: 9, areaId: 3808, areaParentId: 38 },
  ],
  registrations: [
    { id: 1, kadId: 3, userId: 'jane.user', maturityRating: 'High', deploymentStatus: 'Pilot', applicabilityExtent: 'Team', benefitRating: 'High', comments: 'Useful healthcare taxonomy pattern.' },
    { id: 2, kadId: 6, userId: 'normal.user', maturityRating: 'Medium', deploymentStatus: 'Production', applicabilityExtent: 'Enterprise', benefitRating: 'Medium', comments: 'Used in a metering prototype.' },
  ],
  customers: [
    { userId: 'normal.user', customerName: 'Normal User', industry: 'Healthcare' },
    { userId: 'jane.user', customerName: 'Jane User', industry: 'Financial Services' },
  ],
};

@Injectable({ providedIn: 'root' })
export class AppDataService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://54.237.235.235:3000/api';

  readonly currentUserId = signal('admin.user');
  readonly message = signal('');

  users = structuredClone(initialState.users);
  accessRoles = structuredClone(initialState.accessRoles);
  permissions = structuredClone(initialState.permissions);
  domains = structuredClone(initialState.domains);
  dimensions = structuredClone(initialState.dimensions);
  areas = structuredClone(initialState.areas);
  businessProblems = structuredClone(initialState.businessProblems);
  kads = structuredClone(initialState.kads);
  kadAreas = structuredClone(initialState.kadAreas);
  registrations = structuredClone(initialState.registrations);
  customers = structuredClone(initialState.customers);

  readonly deploymentStatuses = ['Candidate', 'Pilot', 'Production', 'Retired'];
  readonly applicabilityExtents = ['Team', 'Project', 'Division', 'Enterprise'];
  readonly ratings = ['Low', 'Medium', 'High'];
  readonly contexts = ['Generic', 'Industry'];
  readonly problemTypes = ['Recurring', 'Emerging'];

  constructor() {
    this.loadFromBackend();
  }

  loadFromBackend(): void {
    this.http.get<Partial<Snapshot>>(`${this.apiBase}/bootstrap`, { headers: this.mockHeaders() }).subscribe({
      next: (snapshot) => this.applySnapshot(snapshot),
      error: () => {
        // The Angular mock remains usable when the Node service is not running.
      },
    });
  }

  persistMockState(message = 'Changes pushed to Node mock API'): void {
    this.http.post(`${this.apiBase}/snapshot`, this.snapshot(), { headers: this.mockHeaders() }).subscribe({
      next: () => this.toast(message),
      error: () => this.toast(message),
    });
  }

  role(): UserRole {
    return this.hasPermission('users-acl:manage') ? 'admin' : 'user';
  }

  setRole(role: UserRole): void {
    this.currentUserId.set(role === 'admin' ? 'admin.user' : 'normal.user');
    this.toast(`Viewing ${role === 'admin' ? 'Admin' : 'Normal User'} flows`);
  }

  setCurrentUser(userId: string): void {
    this.currentUserId.set(userId);
    this.toast(`Viewing as ${this.currentUser()?.displayName ?? userId}`);
  }

  currentUser(): AppUser | undefined {
    return this.users.find((user) => user.id === this.currentUserId());
  }

  userPermissions(user: AppUser | undefined = this.currentUser()): string[] {
    if (!user) return [];
    const permissionIds = new Set<string>();
    for (const roleId of user.roleIds) {
      const role = this.accessRoles.find((item) => item.id === roleId);
      role?.permissionIds.forEach((permissionId) => permissionIds.add(permissionId));
    }
    return Array.from(permissionIds);
  }

  hasPermission(permissionId: string): boolean {
    return this.userPermissions().includes(permissionId);
  }

  applyAuthenticatedUser(authUser: AuthenticatedUser): void {
    const roleId = this.normalizeRole(authUser.role);
    const displayName = [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || authUser.email || authUser.userId;

    this.upsertLocalUser({
      id: authUser.userId,
      displayName,
      email: authUser.email,
      status: 'Active',
      roleIds: [roleId],
    });

    this.applyUserAclRole(roleId, authUser.userACL);
    this.currentUserId.set(authUser.userId);
    if (roleId === 'admin') this.loadAclUsers();
  }

  applyUserAcl(userACL: UserAclDocument | undefined): void {
    const user = this.currentUser();
    if (!user || !userACL) return;
    const roleId = this.normalizeRole(userACL.role || user.roleIds[0] || 'user');
    user.roleIds = [roleId];
    this.applyUserAclRole(roleId, userACL);
  }

  reset(): void {
    this.users = structuredClone(initialState.users);
    this.accessRoles = structuredClone(initialState.accessRoles);
    this.permissions = structuredClone(initialState.permissions);
    this.domains = structuredClone(initialState.domains);
    this.dimensions = structuredClone(initialState.dimensions);
    this.areas = structuredClone(initialState.areas);
    this.businessProblems = structuredClone(initialState.businessProblems);
    this.kads = structuredClone(initialState.kads);
    this.kadAreas = structuredClone(initialState.kadAreas);
    this.registrations = structuredClone(initialState.registrations);
    this.customers = structuredClone(initialState.customers);
    this.http.post<Partial<Snapshot>>(`${this.apiBase}/reset`, {}, { headers: this.mockHeaders() }).subscribe({
      next: (snapshot) => this.applySnapshot(snapshot),
      error: () => {},
    });
    this.toast('Mock data rolled back');
  }

  toast(message: string): void {
    this.message.set(message);
    window.setTimeout(() => {
      if (this.message() === message) this.message.set('');
    }, 2600);
  }

  domainName(domainId: number): string {
    return this.domains.find((domain) => domain.id === domainId)?.name ?? 'Unknown';
  }

  dimensionName(dimensionId: number | null): string {
    return this.dimensions.find((dimension) => dimension.id === dimensionId)?.name ?? '';
  }

  areaName(areaId: number | null): string {
    return this.areas.find((area) => area.id === areaId)?.name ?? '';
  }

  dimensionsForDomain(domainId: number): Dimension[] {
    return this.dimensions.filter((dimension) => dimension.domainId === domainId);
  }

  parentAreas(dimensionId: number | null): Area[] {
    return this.areas.filter((area) => area.dimensionId === dimensionId && area.depth === 0);
  }

  childAreas(dimensionId: number | null, parentId: number | null): Area[] {
    return this.areas.filter((area) => area.dimensionId === dimensionId && area.parentId === parentId);
  }

  addCriteria(): SearchCriteria {
    return {
      id: createClientId(),
      dimensionId: null,
      areaId: null,
      areaChildId: null,
      weight: 0,
      closeness: 0,
    };
  }

  searchKads(criteria: SearchCriteria[], businessProblemId: number | null): SearchResult[] {
    const scores = new Map<number, number>();
    const activeCriteria = criteria.filter((item) => item.dimensionId && item.weight > 0);

    for (const link of this.kadAreas) {
      const kad = this.kads.find((item) => item.id === link.kadId);
      if (!kad || (businessProblemId && kad.businessProblemId !== businessProblemId)) continue;

      for (const item of activeCriteria) {
        if (item.dimensionId !== link.dimensionId) continue;
        if (item.areaId && link.areaParentId !== item.areaId && link.areaId !== item.areaId) continue;
        if (item.areaChildId && link.areaId !== item.areaChildId) continue;
        scores.set(kad.id, (scores.get(kad.id) ?? 0) + item.weight);
      }
    }

    const maxScore = Math.max(...Array.from(scores.values()), 1);
    return Array.from(scores.entries())
      .map(([kadId, score]) => {
        const kad = this.kads.find((item) => item.id === kadId)!;
        return { ...kad, domainName: this.domainName(kad.domainId), score, relativeScore: Math.round((score / maxScore) * 100) };
      })
      .sort((a, b) => b.score - a.score);
  }

  addKad(input: Pick<Kad, 'name' | 'domainId' | 'link' | 'publicLink' | 'businessProblemId'>, criteria: SearchCriteria[]): Kad {
    const id = Math.max(...this.kads.map((kad) => kad.id), 0) + 1;
    const kad: Kad = { id, hitCounter: 0, ...input };
    this.kads = [...this.kads, kad];
    this.kadAreas = [
      ...this.kadAreas,
      ...criteria
        .filter((item) => item.dimensionId)
        .map((item) => ({
          kadId: id,
          dimensionId: item.dimensionId!,
          areaId: item.areaChildId ?? item.areaId,
          areaParentId: item.areaChildId ? item.areaId : 0,
        })),
    ];
    this.http.post<Kad>(`${this.apiBase}/kads`, { kad: input, criteria }, { headers: this.mockHeaders() }).subscribe({
      next: (created) => {
        if (!this.kads.some((item) => item.id === created.id)) this.kads = [...this.kads, created];
      },
      error: () => {},
    });
    this.toast('KAD was created successfully');
    return kad;
  }

  deleteKad(kadId: number): void {
    this.kads = this.kads.filter((kad) => kad.id !== kadId);
    this.kadAreas = this.kadAreas.filter((item) => item.kadId !== kadId);
    this.registrations = this.registrations.filter((item) => item.kadId !== kadId);
    this.http.delete(`${this.apiBase}/kads/${kadId}`, { headers: this.mockHeaders() }).subscribe({ error: () => {} });
    this.toast('KAD deleted');
  }

  incrementHit(kadId: number): void {
    this.kads = this.kads.map((kad) => (kad.id === kadId ? { ...kad, hitCounter: kad.hitCounter + 1 } : kad));
    this.http.post<{ hitCounter: number }>(`${this.apiBase}/kads/${kadId}/hit`, {}, { headers: this.mockHeaders() }).subscribe({
      next: ({ hitCounter }) => {
        this.kads = this.kads.map((kad) => (kad.id === kadId ? { ...kad, hitCounter } : kad));
      },
      error: () => {},
    });
  }

  addDomain(): void {
    const id = Math.max(...this.domains.map((domain) => domain.id), 0) + 1;
    this.domains = [...this.domains, { id, name: 'New Domain', description: '' }];
  }

  deleteDomain(id: number): void {
    this.domains = this.domains.filter((domain) => domain.id !== id);
  }

  addDimension(): void {
    const id = Math.max(...this.dimensions.map((dimension) => dimension.id), 0) + 1;
    this.dimensions = [...this.dimensions, { id, name: 'New Dimension', domainId: this.domains[0]?.id ?? 1 }];
  }

  deleteDimension(id: number): void {
    this.dimensions = this.dimensions.filter((dimension) => dimension.id !== id);
  }

  addArea(): void {
    const id = Math.max(...this.areas.map((area) => area.id), 0) + 1;
    const dimensionId = this.dimensions[0]?.id ?? 1;
    this.areas = [...this.areas, { id, dimensionId, name: 'New Area', parentId: null, orderNo: String(id), depth: 0 }];
  }

  deleteArea(id: number): void {
    this.areas = this.areas.filter((area) => area.id !== id);
  }

  syncAreaDepth(area: Area): void {
    const parent = this.areas.find((item) => item.id === area.parentId);
    area.depth = parent ? parent.depth + 1 : 0;
  }

  addBusinessProblem(): void {
    const id = Math.max(...this.businessProblems.map((problem) => problem.id), 0) + 1;
    this.businessProblems = [...this.businessProblems, { id, businessProblem: 'New Business Problem', context: 'Generic', type: 'Recurring', description: '' }];
  }

  deleteBusinessProblem(id: number): void {
    this.businessProblems = this.businessProblems.filter((problem) => problem.id !== id);
  }

  addUser(): void {
    const id = `new.user.${this.users.length + 1}`;
    this.users = [
      ...this.users,
      {
        id,
        displayName: 'New User',
        email: `${id}@example.com`,
        status: 'Active',
        roleIds: ['normal'],
      },
    ];
  }

  inviteUser(input: InviteUserInput): void {
    const userACL = this.userAclForRole(input.role);
    this.http
      .post<{ success: boolean; message?: string; user?: Record<string, unknown> }>(adminAclApiUrl, {
        flow_selected: 'invite-user',
        ...input,
        userACL,
      })
      .subscribe({
        next: (response) => {
          if (!response.success || !response.user) {
            this.toast(response.message || 'Invite failed');
            return;
          }
          this.upsertLocalUser(this.appUserFromAclRecord(response.user));
          this.toast('User invited through Cognito');
        },
        error: () => this.toast('Invite failed'),
      });
  }

  deleteUser(userId: string): void {
    if (userId === this.currentUserId()) {
      this.toast('Cannot delete the active mock user');
      return;
    }
    this.http.post<{ success: boolean; message?: string }>(adminAclApiUrl, { flow_selected: 'delete-user', userId }).subscribe({
      next: () => this.toast('User deleted'),
      error: () => this.toast('User removed locally'),
    });
    this.removeLocalUser(userId);
  }

  addAccessRole(): void {
    const id = `role-${this.accessRoles.length + 1}`;
    this.accessRoles = [...this.accessRoles, { id, name: 'New Role', description: '', permissionIds: [] }];
  }

  deleteAccessRole(roleId: string): void {
    this.accessRoles = this.accessRoles.filter((role) => role.id !== roleId);
    this.users.forEach((user) => {
      user.roleIds = user.roleIds.filter((id) => id !== roleId);
    });
  }

  toggleUserRole(user: AppUser, roleId: string): void {
    user.roleIds = user.roleIds.includes(roleId)
      ? user.roleIds.filter((id) => id !== roleId)
      : [...user.roleIds, roleId];
    const normalizedRole = user.roleIds.includes('admin') ? 'admin' : 'user';
    this.http
      .post(adminAclApiUrl, {
        flow_selected: 'set-user-role',
        userId: user.id,
        role: normalizedRole,
        userACL: this.userAclForRole(normalizedRole),
      })
      .subscribe({ error: () => {} });
  }

  toggleRolePermission(role: AccessRole, permissionId: string): void {
    role.permissionIds = role.permissionIds.includes(permissionId)
      ? role.permissionIds.filter((id) => id !== permissionId)
      : [...role.permissionIds, permissionId];
  }

  addRegistration(): void {
    const id = Math.max(...this.registrations.map((registration) => registration.id), 0) + 1;
    this.registrations = [
      ...this.registrations,
      {
        id,
        kadId: this.kads[0]?.id ?? 1,
        userId: 'normal.user',
        maturityRating: 'Medium',
        deploymentStatus: 'Candidate',
        applicabilityExtent: 'Project',
        benefitRating: 'Medium',
        comments: '',
      },
    ];
  }

  usageRows() {
    return this.registrations.map((registration) => ({
      ...registration,
      kadName: this.kads.find((kad) => kad.id === registration.kadId)?.name ?? '',
      customerName: this.customers.find((customer) => customer.userId === registration.userId)?.customerName ?? registration.userId,
    }));
  }

  summaryForKad(kadId: number) {
    const rows = this.registrations.filter((registration) => registration.kadId === kadId);
    if (!rows.length) return [];
    return [
      {
        kadId,
        deploymentStatus: this.mode(rows.map((row) => row.deploymentStatus)),
        applicabilityExtent: this.mode(rows.map((row) => row.applicabilityExtent)),
        avgBenefitRating: this.mode(rows.map((row) => row.benefitRating)),
        avgMaturityRating: this.mode(rows.map((row) => row.maturityRating)),
      },
    ];
  }

  private mode(values: string[]): string {
    return values.sort((a, b) => values.filter((value) => value === b).length - values.filter((value) => value === a).length)[0] ?? '';
  }

  private applySnapshot(snapshot: Partial<Snapshot>): void {
    if (snapshot.users) this.users = structuredClone(snapshot.users);
    if (snapshot.accessRoles) this.accessRoles = structuredClone(snapshot.accessRoles);
    if (snapshot.permissions) this.permissions = structuredClone(snapshot.permissions);
    if (snapshot.domains) this.domains = structuredClone(snapshot.domains);
    if (snapshot.dimensions) this.dimensions = structuredClone(snapshot.dimensions);
    if (snapshot.areas) this.areas = structuredClone(snapshot.areas);
    if (snapshot.businessProblems) this.businessProblems = structuredClone(snapshot.businessProblems);
    if (snapshot.kads) this.kads = structuredClone(snapshot.kads);
    if (snapshot.kadAreas) this.kadAreas = structuredClone(snapshot.kadAreas);
    if (snapshot.registrations) this.registrations = structuredClone(snapshot.registrations);
    if (snapshot.customers) this.customers = structuredClone(snapshot.customers);
  }

  private snapshot(): Snapshot {
    return {
      users: this.users,
      accessRoles: this.accessRoles,
      permissions: this.permissions,
      domains: this.domains,
      dimensions: this.dimensions,
      areas: this.areas,
      businessProblems: this.businessProblems,
      kads: this.kads,
      kadAreas: this.kadAreas,
      registrations: this.registrations,
      customers: this.customers,
    };
  }

  private mockHeaders() {
    return {};
  }

  private loadAclUsers(): void {
    this.http.get<{ success: boolean; users?: Record<string, unknown>[] }>(`${adminAclApiUrl}?queryType=get-all-users`).subscribe({
      next: (response) => {
        for (const user of response.users || []) this.upsertLocalUser(this.appUserFromAclRecord(user));
      },
      error: () => {},
    });
  }

  private normalizeRole(role: string): string {
    return role === 'admin' ? 'admin' : 'normal';
  }

  private upsertLocalUser(user: AppUser): void {
    const index = this.users.findIndex((item) => item.id === user.id);
    if (index >= 0) this.users[index] = { ...this.users[index], ...user };
    else this.users = [...this.users, user];
  }

  private removeLocalUser(userId: string): void {
    this.users = this.users.filter((user) => user.id !== userId);
    this.registrations = this.registrations.filter((registration) => registration.userId !== userId);
    this.customers = this.customers.filter((customer) => customer.userId !== userId);
  }

  private applyUserAclRole(roleId: string, userACL: UserAclDocument | undefined): void {
    if (!userACL?.permissionIds?.length) return;
    const role = this.accessRoles.find((item) => item.id === roleId);
    if (role) role.permissionIds = userACL.permissionIds;
    else {
      this.accessRoles = [
        ...this.accessRoles,
        {
          id: roleId,
          name: roleId === 'admin' ? 'Admin' : 'Normal User',
          description: 'Loaded from Cognito/DynamoDB ACL.',
          permissionIds: userACL.permissionIds,
        },
      ];
    }
  }

  private userAclForRole(role: 'admin' | 'user'): UserAclDocument {
    const roleId = this.normalizeRole(role);
    const accessRole = this.accessRoles.find((item) => item.id === roleId);
    return {
      role,
      permissionIds: accessRole?.permissionIds ?? [],
      domainIds: ['*'],
      customerIds: role === 'admin' ? ['*'] : [],
      capabilities: {
        canManageCatalog: role === 'admin',
        canManageAcl: role === 'admin',
        canViewCustomers: role === 'admin',
      },
    };
  }

  private appUserFromAclRecord(record: Record<string, unknown>): AppUser {
    const userACL = record['userACL'] as UserAclDocument | undefined;
    const role = String(record['role'] || userACL?.role || 'user');
    return {
      id: String(record['userId'] || ''),
      displayName:
        String(record['displayName'] || '').trim() ||
        [record['firstName'], record['lastName']].filter(Boolean).join(' ') ||
        String(record['email'] || ''),
      email: String(record['email'] || ''),
      status: record['status'] === 'DISABLED' ? 'Disabled' : 'Active',
      roleIds: [this.normalizeRole(role)],
    };
  }
}

function createClientId(): string {
  if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `criteria-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
