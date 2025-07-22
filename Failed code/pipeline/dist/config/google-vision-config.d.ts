export namespace GOOGLE_CLOUD_CONFIG {
    let projectId: string;
    namespace credentials {
        let type: string;
        let project_id: string;
        let private_key_id: string;
        let private_key: string;
        let client_email: string;
        let client_id: string;
        let auth_uri: string;
        let token_uri: string;
        let auth_provider_x509_cert_url: string;
        let client_x509_cert_url: string;
        let universe_domain: string;
    }
    namespace apiSettings {
        namespace textDetection {
            let maxResults: number;
            let languages: string[];
            let confidence: number;
        }
        namespace objectDetection {
            let maxResults_1: number;
            export { maxResults_1 as maxResults };
            let confidence_1: number;
            export { confidence_1 as confidence };
        }
        namespace webDetection {
            let maxResults_2: number;
            export { maxResults_2 as maxResults };
            let confidence_2: number;
            export { confidence_2 as confidence };
            export let includeGeoResults: boolean;
            export let websiteSearch: boolean;
        }
        namespace faceDetection {
            let maxResults_3: number;
            export { maxResults_3 as maxResults };
            export let landmarks: boolean;
            export let emotions: boolean;
            let confidence_3: number;
            export { confidence_3 as confidence };
        }
    }
    namespace rateLimits {
        let requestsPerMinute: number;
        let requestsPerDay: number;
        let concurrentRequests: number;
    }
    namespace tierAccess {
        namespace free {
            let services: string[];
            let dailyLimit: number;
            let features: string[];
        }
        namespace pro {
            let services_1: string[];
            export { services_1 as services };
            let dailyLimit_1: number;
            export { dailyLimit_1 as dailyLimit };
            let features_1: string[];
            export { features_1 as features };
        }
        namespace premium {
            let services_2: string[];
            export { services_2 as services };
            let dailyLimit_2: number;
            export { dailyLimit_2 as dailyLimit };
            let features_2: string[];
            export { features_2 as features };
        }
    }
}
export function validateGoogleVisionConfig(): boolean;
