import type { 
  AuthAdapter, 
  AuthConfig, 
  AuthState, 
  AuthUser, 
  AuthToken,
  LoginCredentials, 
  LoginResult, 
  LogoutResult,
  AuthEventEmitter,
  AuthEvents
} from './types';

import { BasicAuthAdapter } from './adapters/BasicAuthAdapter';
import { OAuthAdapter } from './adapters/OAuthAdapter';
import { DevAuthAdapter } from './adapters/DevAuthAdapter';

/**
 * Simple event emitter for auth events
 */
class SimpleEventEmitter implements AuthEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on<K extends keyof AuthEvents>(event: K, listener: (data: AuthEvents[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off<K extends keyof AuthEvents>(event: K, listener: (data: AuthEvents[K]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit<K extends keyof AuthEvents>(event: K, data: AuthEvents[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in auth event listener for ${event}:`, error);
        }
      });
    }
  }
}

/**
 * Main Authentication Manager
 * Manages multiple authentication adapters and provides a unified interface
 */
export class AuthManager {
  private adapters: Map<string, AuthAdapter> = new Map();
  private currentAdapter: AuthAdapter | null = null;
  private eventEmitter: AuthEventEmitter = new SimpleEventEmitter();
  private initialized: boolean = false;

  /**
   * Register an authentication adapter
   */
  registerAdapter(adapter: AuthAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  /**
   * Create and register adapters from configuration
   */
  async configureAdapters(configs: AuthConfig[]): Promise<void> {
    // Clear existing adapters
    await this.cleanup();

    // Create adapters from configs
    for (const config of configs) {
      if (!config.enabled) continue;

      let adapter: AuthAdapter;

      switch (config.type) {
        case 'basic':
          adapter = new BasicAuthAdapter(config);
          break;
        case 'oauth':
        case 'oidc':
          adapter = new OAuthAdapter(config);
          break;
        case 'dev':
          adapter = new DevAuthAdapter(config);
          break;
        default:
          console.warn(`Unknown auth adapter type: ${(config as any).type}`);
          continue;
      }

      this.registerAdapter(adapter);

      // Set as current adapter if none is set
      if (!this.currentAdapter) {
        this.currentAdapter = adapter;
      }
    }
  }

  /**
   * Set the active authentication adapter
   */
  setActiveAdapter(adapterId: string): boolean {
    const adapter = this.adapters.get(adapterId);
    if (adapter) {
      this.currentAdapter = adapter;
      return true;
    }
    return false;
  }

  /**
   * Get the currently active adapter
   */
  getCurrentAdapter(): AuthAdapter | null {
    return this.currentAdapter;
  }

  /**
   * Get all registered adapters
   */
  getAdapters(): AuthAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Initialize the authentication manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.currentAdapter) {
      await this.currentAdapter.initialize();
    }

    this.initialized = true;
  }

  /**
   * Attempt to login with the current adapter
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    if (!this.currentAdapter) {
      return { success: false, error: 'No authentication adapter configured' };
    }

    try {
      const result = await this.currentAdapter.login(credentials);
      
      if (result.success) {
        const state = await this.currentAdapter.getAuthState();
        if (state.user && state.token) {
          this.eventEmitter.emit('auth:login', {
            user: state.user,
            token: state.token
          });
          this.eventEmitter.emit('auth:state-change', { state });
        }
      } else if (result.error) {
        this.eventEmitter.emit('auth:error', {
          error: result.error,
          adapter: this.currentAdapter.id
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.eventEmitter.emit('auth:error', {
        error: errorMessage,
        adapter: this.currentAdapter.id
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logout with the current adapter
   */
  async logout(): Promise<LogoutResult> {
    if (!this.currentAdapter) {
      return { success: false, error: 'No authentication adapter configured' };
    }

    try {
      const currentState = await this.currentAdapter.getAuthState();
      const result = await this.currentAdapter.logout();
      
      if (result.success) {
        this.eventEmitter.emit('auth:logout', {
          user: currentState.user
        });
        this.eventEmitter.emit('auth:state-change', {
          state: {
            user: null,
            token: null,
            isLoading: false,
            error: null
          }
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get current authentication state
   */
  async getAuthState(): Promise<AuthState> {
    if (!this.currentAdapter) {
      return {
        user: null,
        token: null,
        isLoading: false,
        error: 'No authentication adapter configured'
      };
    }

    return this.currentAdapter.getAuthState();
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const state = await this.getAuthState();
    return !!(state.user && state.token);
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const state = await this.getAuthState();
    return state.user;
  }

  /**
   * Get auth header for API requests
   */
  async getAuthHeader(): Promise<string | null> {
    if (!this.currentAdapter) return null;
    return this.currentAdapter.getAuthHeader();
  }

  /**
   * Handle OAuth callback (if current adapter supports it)
   */
  async handleOAuthCallback(callbackData: Record<string, string>): Promise<LoginResult> {
    if (!this.currentAdapter) {
      return { success: false, error: 'No authentication adapter configured' };
    }

    if (!this.currentAdapter.handleCallback) {
      return { success: false, error: 'Current adapter does not support OAuth callbacks' };
    }

    try {
      const result = await this.currentAdapter.handleCallback(callbackData);
      
      if (result.success) {
        const state = await this.currentAdapter.getAuthState();
        if (state.user && state.token) {
          this.eventEmitter.emit('auth:login', {
            user: state.user,
            token: state.token
          });
          this.eventEmitter.emit('auth:state-change', { state });
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth callback failed';
      this.eventEmitter.emit('auth:error', {
        error: errorMessage,
        adapter: this.currentAdapter.id
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Refresh token if supported
   */
  async refreshToken(): Promise<AuthToken | null> {
    if (!this.currentAdapter || !this.currentAdapter.refreshToken) {
      return null;
    }

    try {
      const newToken = await this.currentAdapter.refreshToken();
      if (newToken) {
        this.eventEmitter.emit('auth:token-refresh', { token: newToken });
        
        const state = await this.currentAdapter.getAuthState();
        this.eventEmitter.emit('auth:state-change', { state });
      }
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Subscribe to authentication events
   */
  on<K extends keyof AuthEvents>(event: K, listener: (data: AuthEvents[K]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from authentication events
   */
  off<K extends keyof AuthEvents>(event: K, listener: (data: AuthEvents[K]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.destroy();
    }
    this.adapters.clear();
    this.currentAdapter = null;
    this.initialized = false;
  }
}

// Singleton instance
let authManagerInstance: AuthManager | null = null;

/**
 * Get the singleton AuthManager instance
 */
export function getAuthManager(): AuthManager {
  if (!authManagerInstance) {
    authManagerInstance = new AuthManager();
  }
  return authManagerInstance;
}

/**
 * Initialize authentication with configuration
 */
export async function initializeAuth(configs: AuthConfig[]): Promise<AuthManager> {
  const manager = getAuthManager();
  await manager.configureAdapters(configs);
  await manager.initialize();
  return manager;
}

/**
 * Quick access functions for common operations
 */
export const auth = {
  login: (credentials: LoginCredentials) => getAuthManager().login(credentials),
  logout: () => getAuthManager().logout(),
  getState: () => getAuthManager().getAuthState(),
  isAuthenticated: () => getAuthManager().isAuthenticated(),
  getCurrentUser: () => getAuthManager().getCurrentUser(),
  getAuthHeader: () => getAuthManager().getAuthHeader(),
  on: <K extends keyof AuthEvents>(event: K, listener: (data: AuthEvents[K]) => void) => 
    getAuthManager().on(event, listener),
  off: <K extends keyof AuthEvents>(event: K, listener: (data: AuthEvents[K]) => void) => 
    getAuthManager().off(event, listener),
};