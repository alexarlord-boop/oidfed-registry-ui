// Entity Types
export const ENTITY_TYPES = {
  TRUST_ANCHOR: 'trust_anchor',
  INTERMEDIATE_AUTHORITY: 'intermediate_authority',
  TEST_FEDERATION: 'test_federation',
  TRAINING_FEDERATION: 'training_federation',
  OPENID_PROVIDER: 'openid_provider',
  OPENID_RELYING_PARTY: 'openid_relying_party',
  FEDERATION_ENTITY: 'federation_entity',
} as const;

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  [ENTITY_TYPES.TRUST_ANCHOR]: 'Trust Anchor',
  [ENTITY_TYPES.INTERMEDIATE_AUTHORITY]: 'Intermediate Authority',
  [ENTITY_TYPES.TEST_FEDERATION]: 'Test Federation',
  [ENTITY_TYPES.TRAINING_FEDERATION]: 'Training Federation',
  [ENTITY_TYPES.OPENID_PROVIDER]: 'OpenID Provider',
  [ENTITY_TYPES.OPENID_RELYING_PARTY]: 'Relying Party',
  [ENTITY_TYPES.FEDERATION_ENTITY]: 'Federation Entity',
};

// Entity Status
export const ENTITY_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  INACTIVE: 'inactive',
} as const;

export const ENTITY_STATUS_LABELS: Record<string, string> = {
  [ENTITY_STATUS.PENDING]: 'Pending',
  [ENTITY_STATUS.APPROVED]: 'Approved',
  [ENTITY_STATUS.REJECTED]: 'Rejected',
  [ENTITY_STATUS.INACTIVE]: 'Inactive',
};

export const PlatformSections = {
    HOME: {
        name: 'Home',
        home: { name: 'Home', path: '/' },
        dashboard: { name: 'Dashboard', path: '/dashboard' },
        audit: { name: 'Audit', path: '/audit' },
    },
    ADMIN: {
        name: 'Administration',
        users: { name: 'Users', path: '/admin/users' },
        users_new: { name: 'Create New User', path: '/admin/users/new' },
        users_detail: { name: 'User Details', path: '/admin/users/:id' },
        trustAnchors: { name: 'Trust Anchors', path: '/admin/trust-anchors' },
        // entities: { name: 'Entities', path: '/admin/entities' },
        // entities_new: { name: 'Register Entity', path: '/admin/entities/new' },
        // entities_detail: { name: 'Entity Details', path: '/admin/entities/:id' },
        // entity_approvals: { name: 'Entity Approvals', path: '/admin/entity-approvals' },
    },
    MANAGEMENT: {
        name: 'Management',
        entities: { name: 'Entities', path: '/entities' },
        trustChains: { name: 'Trust Chains', path: '/trust-chains' },
    },
    SETTINGS: {
        name: 'Settings',
        language: { name: 'Language', path: '/language'},
        system: { name: 'System', path: '/system' },
    },
    
} as const;