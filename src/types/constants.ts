
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