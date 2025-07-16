/**
 * Google Vision API Configuration
 * This file handles Google Cloud Vision API credentials and settings
 */

const GOOGLE_CLOUD_CONFIG = {
  projectId: 'orbital-anchor-466111-c9',
  
  // Service Account Key (framsensev2)
  credentials: {
    type: "service_account",
    project_id: "orbital-anchor-466111-c9",
    private_key_id: "3abb90d2417213278ba26bc85f76a67729391d35",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9hcNmg92mNx24\nFCcaCwuoYQWExGMucK0fHuNJvGq5N789VoZo3GBnGS6np0V7xd4rgmfHjW17K0sL\nW5K1nLe70RQeQdgSrX1zECqEwj+MaLjqZLkMrqFKx0g9ZWY3WxymherxnJc5/00f\nteZMtxrCZyUKw00lSVychclvUu7F+omiI0fB8I88x2USTop4n05giULMfX9vFQVB\nLrPWzhRiKaM5jbbc0q0lKA1xATCOmjaGOxxsLf4YBBep+sEjzE3gTqxr6mZTc8uH\np3PedjOxnID/BlGnskfxR2H0thKiBRTMirS/XAM4Y/99Y9NNPgvtF4Lx9EzHCFMG\nfsMk48QnAgMBAAECggEAQvdh3PZZOmMdQC72xhADFYL6xTfzZ7Rup6FtZF+MQlf9\nXfoV0jWUZrmSL7E+LwbyguM4Ml25wpzAjonT5BI1Jcsx1aMkay0cN60NqQ1OERnr\nxP7EGEQYP+j8kJ0kqgiqrfiB1M+k69xW7w6CCrdkYC67+vqZZsRuUexACfL+5bsO\ndBiNfrmLNhsNXy3D7JFj0RSOMoPGEb0XRO8ZixV4yXGAgvG2v+GaJDcEERL/ighV\n5R9+iUg/NSLhrdA4eFMXM02QZhuneTbD+jdipBFUikpd1zhj/KC5zLTOfbDQBX5V\nImRF9dFXZkBDkpOHmsHtZ/bkbCJ8mt7jGoX2kj3HMQKBgQDhkWx9RQnDQxh6lyri\nWCMZHKik+DPBjdH6oDGn0/9sELAfsOe1gPgkW5e1fdDurnO5QAXODk+Dohwb6Wcq\nfKr9BZvfkBivayvKRIKYFpaieKhChNPXjSvH7NlI03B/CuZ9vtJZUZcDJQEIRGEG\nqS1j1Xi95/sQmTbIUutAmiFuiQKBgQDXF2nML/KMhg5vylXpWPj+ClUIisirIAIV\nGP9GVcCm+0aeAWkVsYDxz8ZmNbpIbkvsGzjhccriL2WGlX8UEMPoFPuckCiLfCC5\neLOJG041s9pt4rgplw1BZayI0uv9flo5hUDIXQ0TiXftilGyXCsvzeb/pB0zJKMw\nRz9vkcZxLwKBgFy3Y7qR+BNUrukk3bGvvK2DxCYbB1sVqiu0UPTFBQYsTdiY5IUM\nf/Kh21f0YT7aYiLRGBG8fB6FMbyfUZJ7L+VUut9H4X2pNZSsWGmfT0d1BORiqJi/\nJDHHPwDaODFgD6G8H8Yq7UGTojr9sEwGmeuhQUH96orGD2iD/MLPF9LRAoGBAJbN\nzpqfn2IQ93w/k56IiAKtQdM8YtdAGNWr8gbhRrKMiIVtnbzc9/gSYhr1Xoc79bUz\nnNzLyKBu9LK4jCGIY6KLW6H4nMS3IcaILvBZGaujTukuRUq7okqQu7gukdDoTt/3\nYmVYgDuLbW85RHBWGN1qcqQX73UVIelOetaBkW13AoGBAJbml8NmBiYzimAnGjyd\ng+JZcLtMe5WYJr5m3bI4sHshNpk+teZn9pvRskp/vMSzZ0PVAbWE6epZ3bMgQSUc\n/fuRVOtiYdXe3zFaoTfhl/vyFw+khDptAnlrTtvou5HF83h7cO0bBx38jH9HSoXM\nKV48zAZIOVhfMRTv+07uYcpF\n-----END PRIVATE KEY-----\n",
    client_email: "framsensev2@orbital-anchor-466111-c9.iam.gserviceaccount.com",
    client_id: "107831882238029482422",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/framsensev2%40orbital-anchor-466111-c9.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  },

  // API Settings
  apiSettings: {
    // Text Detection
    textDetection: {
      maxResults: 50,
      languages: ['en', 'sv', 'de', 'fr', 'es'], // Multi-language support
      confidence: 0.7
    },
    
    // Object Detection
    objectDetection: {
      maxResults: 20,
      confidence: 0.8
    },
    
    // Web Detection (Celebrity/Entity Detection)
    webDetection: {
      maxResults: 10,
      confidence: 0.75,
      includeGeoResults: false,
      websiteSearch: true
    },
    
    // Face Detection (for celebrity identification)
    faceDetection: {
      maxResults: 10,
      landmarks: true,
      emotions: true,
      confidence: 0.8
    }
  },

  // Rate Limiting
  rateLimits: {
    requestsPerMinute: 100,
    requestsPerDay: 1000,
    concurrentRequests: 10
  },

  // Tier-based access control
  tierAccess: {
    free: {
      services: ['text'],
      dailyLimit: 10,
      features: ['basic-ocr']
    },
    pro: {
      services: ['text', 'object', 'logo'],
      dailyLimit: 100,
      features: ['object-detection', 'logo-recognition']
    },
    premium: {
      services: ['text', 'object', 'logo', 'web', 'face'],
      dailyLimit: 1000,
      features: ['celebrity-identification', 'web-entities', 'advanced-analysis']
    }
  }
};

// Validation function
function validateGoogleVisionConfig() {
  const required = ['project_id', 'private_key', 'client_email'];
  const missing = required.filter(field => !GOOGLE_CLOUD_CONFIG.credentials[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Google Vision credentials: ${missing.join(', ')}`);
  }
  
  return true;
}

// Export configuration
module.exports = {
  GOOGLE_CLOUD_CONFIG,
  validateGoogleVisionConfig
}; 