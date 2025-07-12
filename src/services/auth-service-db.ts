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

    async initialize() {
        // Load current user from Tauri storage
        await this.loadCurrentUser();
    }

    async loginWithDatabase(email: string, password: string): Promise<User> {
        try {
            console.log('🔐 Logging in user with database:', email);
            
            const user = await invoke<User>('login_user_db', { email, password });
            this.currentUser = user;
            
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
            await invoke('logout_user_db');
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
            const user = await invoke<User | null>('get_current_user_db');
            this.currentUser = user;
            
            if (user) {
                console.log('📖 Loaded user session:', user.email, user.tier);
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
            const user = await invoke<User | null>('refresh_user_status_db');
            if (user) {
                this.currentUser = user;
                this.notifyAuthListeners(user);
            }
            return user;
        } catch (error) {
            console.error('❌ Failed to refresh user status:', error);
            return null;
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
        const baseUrl = 'http://localhost:3001';
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