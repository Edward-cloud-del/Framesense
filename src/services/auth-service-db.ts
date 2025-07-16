import { invoke } from '@tauri-apps/api/core';

export interface User {
    id: string;
    email: string;
    name: string;
    tier: string;
    subscription_status: string;
    stripe_customer_id?: string;
    usage_daily: number;
    usage_total: number;
    created_at: string;
    updated_at: string;
}

class AuthService {
    private currentUser: User | null = null;
    private authListeners: Array<(user: User | null) => void> = [];
    private apiUrl = 'https://api.finalyze.pro'; // Railway backend URL
    private sessionKey = 'framesense_user_session';


    async initialize() {
        // Load current user from local storage
        await this.loadCurrentUser();
    }

    async loginWithDatabase(email: string, password: string): Promise<User> {
        try {
            console.log('🔐 Logging in user with backend API:', email);
            
            // Use backend API instead of direct database call
            const response = await fetch(`${this.apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (!data.success || !data.user) {
                throw new Error('Invalid response from server');
            }

            const user = data.user;
            this.currentUser = user;
            
            // Save user session locally using localStorage
            this.saveUserSessionLocal(user);
            
            // Notify listeners
            this.notifyAuthListeners(user);
            
            console.log('✅ User logged in successfully:', user.email, user.tier);
            return user;
        } catch (error) {
            console.error('❌ Login failed:', error);
            throw new Error(`Login failed: ${error}`);
        }
    }

    async logout(): Promise<void> {
        try {
            // Clear Tauri session first
            try {
                // @ts-ignore - invoke is available in Tauri context
                await invoke('clear_user_session');
                console.log('🗑️ Tauri session cleared');
            } catch (error) {
                console.log('ℹ️ Tauri session clear not available');
            }
            
            // Clear user session locally
            this.clearUserSessionLocal();
            this.currentUser = null;
            
            // Notify listeners
            this.notifyAuthListeners(null);
            
            console.log('🚪 User logged out');
        } catch (error) {
            console.error('❌ Logout failed:', error);
            throw new Error(`Logout failed: ${error}`);
        }
    }

    async loadCurrentUser(): Promise<User | null> {
        try {
            // First try to load from Tauri storage (more reliable)
            let user: User | null = null;
            
            try {
                // @ts-ignore - invoke is available in Tauri context
                user = await invoke('load_user_session');
                if (user) {
                    console.log('📖 Loaded user session from Tauri:', user.email, user.tier);
                    // Sync to localStorage as backup
                    this.saveUserSessionLocal(user);
                }
            } catch (tauriError) {
                console.log('ℹ️ Tauri session not available, trying localStorage...');
                // Fallback to localStorage
                user = this.loadUserSessionLocal();
                if (user) {
                    console.log('📖 Loaded user session from localStorage:', user.email, user.tier);
                }
            }
            
            this.currentUser = user;
            
            if (user) {
                // Notify listeners
                this.notifyAuthListeners(user);
            }
            
            return user;
        } catch (error) {
            console.error('❌ Failed to load current user:', error);
            return null;
        }
    }

    async refreshUserStatus(): Promise<User | null> {
        try {
            if (!this.currentUser) {
                return null;
            }

            // Verify user status with backend API
            const response = await fetch(`${this.apiUrl}/api/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.currentUser.id}`, // Use user ID as simple auth
                },
            });

            if (!response.ok) {
                // If verification fails, clear local session
                await this.logout();
                return null;
            }

            const data = await response.json();
            if (data.success && data.user) {
                const freshUser = data.user;
                
                // Update local session if tier changed
                if (freshUser.tier !== this.currentUser.tier) {
                    console.log('🔄 User tier updated:', this.currentUser.tier, '→', freshUser.tier);
                    this.saveUserSessionLocal(freshUser);
                }
                
                this.currentUser = freshUser;
                this.notifyAuthListeners(freshUser);
                return freshUser;
            }
            
            return this.currentUser;
        } catch (error) {
            console.error('❌ Failed to refresh user status:', error);
            return null;
        }
    }

    // Local storage helper methods
    private saveUserSessionLocal(user: User): void {
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(user));
            console.log('💾 User session saved locally via localStorage');
        } catch (error) {
            console.error('❌ Failed to save user session to localStorage:', error);
        }
    }

    private loadUserSessionLocal(): User | null {
        try {
            const userJson = localStorage.getItem(this.sessionKey);
            if (userJson) {
                const user: User = JSON.parse(userJson);
                console.log('📖 User session loaded from localStorage:', user.email);
                return user;
            }
            return null;
        } catch (error) {
            console.error('❌ Failed to load user session from localStorage:', error);
            return null;
        }
    }

    private clearUserSessionLocal(): void {
        try {
            localStorage.removeItem(this.sessionKey);
            console.log('🗑️ User session cleared from localStorage');
        } catch (error) {
            console.error('❌ Failed to clear user session from localStorage:', error);
        }
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    isLoggedIn(): boolean {
        return this.currentUser !== null;
    }

    getUserTier(): string {
        return this.currentUser?.tier || 'free';
    }

    async getAvailableModels(tier?: string): Promise<string[]> {
        try {
            const userTier = tier || this.getUserTier();
            const models = await invoke<string[]>('get_available_models', { userTier });
            return models;
        } catch (error) {
            console.error('❌ Failed to get available models:', error);
            return ['GPT-3.5-turbo']; // Fallback
        }
    }

    async canUseModel(model: string, tier?: string): Promise<boolean> {
        try {
            const userTier = tier || this.getUserTier();
            const canUse = await invoke<boolean>('can_use_model', { userTier, model });
            return canUse;
        } catch (error) {
            console.error('❌ Failed to check model access:', error);
            return false;
        }
    }

    // Auth state listeners for UI updates
    addAuthListener(callback: (user: User | null) => void): void {
        this.authListeners.push(callback);
    }

    removeAuthListener(callback: (user: User | null) => void): void {
        this.authListeners = this.authListeners.filter(listener => listener !== callback);
    }

    private notifyAuthListeners(user: User | null): void {
        this.authListeners.forEach(listener => {
            try {
                listener(user);
            } catch (error) {
                console.error('❌ Error in auth listener:', error);
            }
        });
    }

    // Payment and upgrade functionality
    openUpgradePage(plan?: string): void {
        const baseUrl = import.meta.env.VITE_WEBSITE_URL || 'https://framesense.vercel.app';
        const upgradeUrl = plan 
            ? `${baseUrl}/payments?plan=${plan}`
            : `${baseUrl}/payments`;
        
        console.log('🔗 Opening upgrade page:', upgradeUrl);
        window.open(upgradeUrl, '_blank');
    }
}

// Export singleton instance
export const authService = new AuthService();

// Initialize when imported
authService.initialize().catch(error => {
    console.error('❌ Failed to initialize auth service:', error);
}); 