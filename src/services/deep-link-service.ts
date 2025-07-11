import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { authService, type User } from './auth-service';

export interface PaymentSuccessPayload {
  token: string;
  plan: string;
  session_id?: string;
}

export interface DeepLinkEventPayload {
  url: string;
  type: 'payment_success' | 'login' | 'unknown';
  data: Record<string, string>;
}

class DeepLinkService {
  private initialized = false;
  private listeners: Array<(event: DeepLinkEventPayload) => void> = [];

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔗 Initializing deep link service...');
      
      // Listen for payment success events from Tauri
      await listen('payment_success', async (event) => {
        console.log('🎉 Payment success deep link received:', event.payload);
        await this.handlePaymentSuccess(event.payload as PaymentSuccessPayload);
      });

      // Listen for general deep link events if needed
      await listen('deep_link', async (event) => {
        console.log('🔗 Deep link received:', event.payload);
        await this.handleDeepLink(event.payload as string);
      });

      this.initialized = true;
      console.log('✅ Deep link service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize deep link service:', error);
      throw error;
    }
  }

  private async handlePaymentSuccess(payload: PaymentSuccessPayload): Promise<void> {
    try {
      const { token, plan, session_id } = payload;
      
      console.log('🎉 Processing payment success for plan:', plan);
      
      // Handle payment success with automatic login via auth service
      const user = await invoke<User>('handle_payment_success', { token, plan });
      
      console.log('✅ Payment success processed, user upgraded to:', user.tier);
      
      // Show success notification
      this.showSuccessNotification(plan, user);
      
      // Emit custom event for UI components
      this.emitPaymentSuccessEvent(user, plan, session_id);
      
      // Notify deep link listeners
      this.notifyListeners({
        url: `framesense://success?token=${token}&plan=${plan}`,
        type: 'payment_success',
        data: { token, plan, session_id: session_id || '' }
      });
      
    } catch (error) {
      console.error('❌ Failed to handle payment success:', error);
      this.showErrorNotification();
    }
  }

  private async handleDeepLink(url: string): Promise<void> {
    try {
      console.log('🔗 Processing general deep link:', url);
      
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol.replace(':', '');
      
      if (protocol !== 'framesense') {
        console.warn('⚠️ Unknown protocol:', protocol);
        return;
      }
      
      const host = parsedUrl.hostname;
      const searchParams = new URLSearchParams(parsedUrl.search);
      const data: Record<string, string> = {};
      
      // Convert search params to object
      searchParams.forEach((value, key) => {
        data[key] = value;
      });
      
      let eventType: DeepLinkEventPayload['type'] = 'unknown';
      
      switch (host) {
        case 'success':
          eventType = 'payment_success';
          if (data.token && data.plan) {
            await this.handlePaymentSuccess({
              token: data.token,
              plan: data.plan,
              session_id: data.session_id
            });
          }
          break;
        case 'login':
          eventType = 'login';
          // Handle login deep links if needed in the future
          break;
        default:
          console.warn('⚠️ Unknown deep link host:', host);
      }
      
      // Notify listeners
      this.notifyListeners({
        url,
        type: eventType,
        data
      });
      
    } catch (error) {
      console.error('❌ Failed to handle deep link:', error);
    }
  }

  private showSuccessNotification(plan: string, user: User): void {
    const planNames: Record<string, string> = {
      premium: 'Premium',
      pro: 'Pro',
      enterprise: 'Enterprise'
    };
    
    const planName = planNames[plan] || plan;
    
    // Request notification permission if not granted
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('FrameSense - Welcome to ' + planName + '! 🎉', {
          body: `You now have access to all ${planName} AI models and features!`,
          icon: '/favicon.ico',
          tag: 'payment-success'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('FrameSense - Welcome to ' + planName + '! 🎉', {
              body: `You now have access to all ${planName} AI models and features!`,
              icon: '/favicon.ico',
              tag: 'payment-success'
            });
          }
        });
      }
    }
    
    // Console success message as fallback
    console.log(`🎉 Welcome to FrameSense ${planName}! User: ${user.email} (${user.tier})`);
  }

  private showErrorNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FrameSense - Payment Issue', {
        body: 'Your payment was successful, but there was an issue activating your account. Please contact support.',
        icon: '/favicon.ico',
        tag: 'payment-error'
      });
    } else {
      console.error('🚨 Payment succeeded but account activation failed. Please contact support.');
    }
  }

  private emitPaymentSuccessEvent(user: User, plan: string, sessionId?: string): void {
    // Emit custom DOM event for React components to listen to
    const customEvent = new CustomEvent('framesense_payment_success', {
      detail: {
        user,
        plan,
        sessionId,
        timestamp: new Date().toISOString()
      }
    });
    
    window.dispatchEvent(customEvent);
    console.log('📤 Payment success event emitted for UI components');
  }

  // Public API for components to listen to deep link events
  addListener(callback: (event: DeepLinkEventPayload) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (event: DeepLinkEventPayload) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(event: DeepLinkEventPayload): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ Error in deep link listener:', error);
      }
    });
  }

  // Test deep link handling (for development)
  async testPaymentSuccess(plan: string = 'premium'): Promise<void> {
    console.log('🧪 Testing payment success flow for plan:', plan);
    
    // Simulate payment success
    await this.handlePaymentSuccess({
      token: 'test_token_123',
      plan,
      session_id: 'test_session_123'
    });
  }
}

// Export singleton instance
export const deepLinkService = new DeepLinkService();

// Auto-initialize when imported
deepLinkService.initialize().catch(error => {
  console.error('❌ Failed to initialize deep link service:', error);
}); 