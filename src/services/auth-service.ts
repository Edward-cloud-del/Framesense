import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface User {
    id: string;
    email: string;
    name: string;
    tier: string; // "free", "premium", "pro", "enterprise"
    token: string;
    usage: {
        daily: number;
        total: number;
        last_reset: string;
    };
    created_at: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    token?: string;
    message?: string;
}

class AuthService {
    private currentUser: User | null = null;
    private authListeners: Array<(user: User | null) => void> = [];
    private deepLinkInitialized = false;

    async initialize() {
        // Load current user from Tauri storage
        await this.loadCurrentUser();
        
        // Initialize deep link listener for payment success
        if (!this.deepLinkInitialized) {
            await this.initializeDeepLinkListener();
            this.deepLinkInitialized = true;
        }
    }

    async login(email: string, password: string): Promise<User> {
        try {
            console.log('🔐 Logging in user:', email);
            
            const user = await invoke<User>('login_user', { email, password });
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
            await invoke('logout_user');
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
            const user = await invoke<User | null>('get_current_user');
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

    getRequiredTier(model: string): string {
        if (['GPT-4o 32k', 'Claude 3 Opus', 'Llama 3.1 405B'].includes(model)) return 'Enterprise';
        if (['GPT-4o', 'Claude 3.5 Sonnet', 'Llama 3.1 70B'].includes(model)) return 'Pro';
        if (['GPT-4o-mini', 'Claude 3 Haiku', 'Gemini Pro'].includes(model)) return 'Premium';
        return 'Free';
    }

    getDailyLimit(tier?: string): number {
        const userTier = tier || this.getUserTier();
        switch (userTier) {
            case 'free': return 50;
            case 'premium': return 1000;
            case 'pro': return 5000;
            case 'enterprise': return -1; // Unlimited
            default: return 10; // Very limited fallback
        }
    }

    getUsagePercentage(): number {
        if (!this.currentUser) return 0;
        
        const limit = this.getDailyLimit();
        if (limit === -1) return 0; // Unlimited
        
        return Math.min(100, (this.currentUser.usage.daily / limit) * 100);
    }

    // Payment and upgrade functionality
    openUpgradePage(plan?: string): void {
        const baseUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3000';
        const upgradeUrl = plan 
            ? `${baseUrl}/payments?plan=${plan}`
            : `${baseUrl}/payments`;
        
        console.log('🔗 Opening upgrade page:', upgradeUrl);
        window.open(upgradeUrl, '_blank');
    }

    // Deep link listener for payment success
    private async initializeDeepLinkListener(): Promise<void> {
        try {
            await listen('payment_success', async (event) => {
                console.log('🎉 Payment success event received:', event.payload);
                
                const { token, plan } = event.payload as { token: string; plan: string };
                
                try {
                    // Handle payment success with automatic login
                    const user = await invoke<User>('handle_payment_success', { token, plan });
                    this.currentUser = user;
                    
                    // Notify listeners
                    this.notifyAuthListeners(user);
                    
                    // Show success notification
                    this.showPaymentSuccessNotification(plan);
                    
                    // Dispatch custom event for UI updates
                    window.dispatchEvent(new CustomEvent('user_upgraded', { 
                        detail: { user, plan } 
                    }));
                    
                    console.log('✅ Payment success handled, user upgraded to:', user.tier);
                    
                } catch (error) {
                    console.error('❌ Failed to handle payment success:', error);
                    // Show error to user
                    this.showPaymentErrorNotification();
                }
            });
            
            console.log('🔗 Deep link listener initialized');
        } catch (error) {
            console.error('❌ Failed to initialize deep link listener:', error);
        }
    }

    private showPaymentSuccessNotification(plan: string): void {
        const planNames: Record<string, string> = {
            premium: 'Premium',
            pro: 'Pro', 
            enterprise: 'Enterprise'
        };
        
        // Try to show native notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('FrameSense - Payment Success! 🎉', {
                body: `You now have ${planNames[plan] || plan} access with all premium AI models!`,
                icon: '/favicon.ico'
            });
        } else {
            // Fallback to console for now - could be a toast in real implementation
            console.log(`🎉 Payment Success! You now have ${planNames[plan] || plan} access!`);
        }
    }

    private showPaymentErrorNotification(): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('FrameSense - Payment Error', {
                body: 'Payment was successful but there was an issue upgrading your account. Please contact support.',
                icon: '/favicon.ico'
            });
        } else {
            console.error('🚨 Payment succeeded but upgrade failed. Please contact support.');
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



    // Manual payment verification - check with backend
    async verifyPayment(): Promise<boolean> {
        try {
            console.log('🔄 Verifying payment status with backend...');
            
            // Reload user data from backend/Tauri
            const user = await this.loadCurrentUser();
            
            if (user && user.tier !== 'free') {
                console.log('✅ Payment verified! User tier:', user.tier);
                this.showPaymentSuccessNotification(user.tier);
                return true;
            } else {
                console.log('ℹ️ No payment upgrade found');
                return false;
            }
        } catch (error) {
            console.error('❌ Payment verification failed:', error);
            throw error;
        }
    }

    // Request notification permission for payment success
    async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }
}

// Export singleton instance
export const authService = new AuthService();

// Initialize when imported
authService.initialize().catch(error => {
    console.error('❌ Failed to initialize auth service:', error);
}); 