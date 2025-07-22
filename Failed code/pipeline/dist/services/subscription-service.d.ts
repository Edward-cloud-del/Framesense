export class SubscriptionService {
    stripe: Stripe | null;
    initStripe(): Promise<void>;
    createCustomer(email: any, userId: any): Promise<{
        customerId: string;
        email: string | null;
    }>;
    createCheckoutSession(customerId: any, priceId: any, successUrl: any, cancelUrl: any, userId?: null, planName?: null): Promise<{
        sessionId: string;
        url: string | null;
    }>;
    handleWebhook(body: any, signature: any): Promise<{
        processed: boolean;
    } | {
        received: boolean;
    }>;
    handleSubscriptionChange(subscription: any): Promise<{
        processed: boolean;
        tier: any;
        status: any;
    }>;
    handleSubscriptionCancellation(subscription: any): Promise<{
        processed: boolean;
        tier: string;
    }>;
    handlePaymentSuccess(invoice: any): Promise<{
        processed: boolean;
    }>;
    handlePaymentFailure(invoice: any): Promise<{
        processed: boolean;
    }>;
    determineTierFromSubscription(subscription: any): any;
    getCustomerSubscription(customerId: any): Promise<{
        tier: any;
        status: Stripe.Subscription.Status;
        currentPeriodEnd: Date;
        subscriptionId: string;
    } | {
        tier: string;
        status: string;
        currentPeriodEnd?: undefined;
        subscriptionId?: undefined;
    }>;
    cancelSubscription(subscriptionId: any): Promise<{
        success: boolean;
        cancelAt: Date;
    }>;
    createPortalSession(customerId: any, returnUrl: any): Promise<{
        url: string;
    }>;
    isValidSubscription(subscription: any): boolean;
}
import Stripe from 'stripe';
