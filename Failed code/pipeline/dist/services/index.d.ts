import Classification = require("./classification");
import EnhancedServices = require("./enhanced-services");
import Routing = require("./routing");
import Caching = require("./caching");
import Pipeline = require("./pipeline");
declare namespace LegacyServices {
    let SubscriptionService: typeof import("./subscription-service");
    let UserService: typeof import("./user-service");
    let CurrentAIProcessor: typeof import("./ai-processor");
    let CurrentModelSelector: typeof import("./model-selector");
    let PromptOptimizer: typeof import("./prompt-optimizer");
    let CurrentOCRService: typeof import("./ocr-service");
    let ImageOptimizer: typeof import("./image-optimizer");
}
export declare let QuestionClassifier: typeof import("./classification").QuestionClassifier;
export declare let ModelSelector: typeof import("./classification").ModelSelector;
export declare let SmartRouter: typeof import("./routing").SmartRouter;
export declare let EnhancedAIProcessor: any;
export declare let CacheManager: any;
export { Classification, EnhancedServices, Routing, Caching, Pipeline, LegacyServices as Legacy };
