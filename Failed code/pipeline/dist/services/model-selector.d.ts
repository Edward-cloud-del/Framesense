export class ModelSelector {
    static getModelConfig(userTier: any, questionType: any): any;
    static getTokenLimitForTier(tier: any, questionType: any): any;
    static getTemperatureForModel(model: any, questionType: any): any;
    static canAccessFeature(userTier: any, feature: any): any;
    static getPricingTiers(): {
        free: {
            name: string;
            price: number;
            currency: string;
            features: string[];
            limitations: string[];
        };
        premium: {
            name: string;
            price: number;
            currency: string;
            interval: string;
            stripeProductId: string;
            stripePriceId: string;
            features: string[];
        };
        pro: {
            name: string;
            price: number;
            currency: string;
            interval: string;
            stripeProductId: string;
            stripePriceId: string;
            features: string[];
        };
    };
    static checkRateLimit(userTier: any, usage: any): {
        canMakeRequest: boolean;
        remainingHourly: number;
        remainingDaily: number;
        resetTime: {
            hourly: Date;
            daily: Date;
        };
    };
}
