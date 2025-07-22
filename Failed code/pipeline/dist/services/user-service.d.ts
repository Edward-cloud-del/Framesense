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
export interface UserWithToken extends User {
    token: string;
}
declare class UserService {
    createUser(email: string, password: string, name: string): Promise<UserWithToken>;
    loginUser(email: string, password: string): Promise<UserWithToken>;
    verifyToken(token: string): Promise<User>;
    updateUserTier(email: string, tier: string, subscriptionStatus?: string): Promise<void>;
    updateUserStripeCustomerId(email: string, stripeCustomerId: string): Promise<void>;
    getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null>;
    getUserById(userId: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    saveSession(userId: string, token: string): Promise<void>;
    logoutUser(token: string): Promise<void>;
    cleanupExpiredSessions(): Promise<void>;
}
declare const _default: UserService;
export default _default;
