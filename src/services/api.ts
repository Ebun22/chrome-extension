import { RateLimiter } from 'limiter';

// Rate limiter: 30 requests per minute
const limiter = new RateLimiter({
  tokensPerInterval: 30,
  interval: 'minute'
});

interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
}

class ApiService {
  private baseUrl: string;
  private apiKey?: string;
  private static instance: ApiService;

  private constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  public static getInstance(config: ApiConfig): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService(config);
    }
    return ApiService.instance;
  }

  private async checkRateLimit(): Promise<void> {
    const hasToken = await limiter.tryRemoveTokens(1);
    if (!hasToken) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }

  private getHeaders(): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (this.apiKey) {
      headers.append('Authorization', `Bearer ${this.apiKey}`);
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Handle authentication error
      throw new Error('Authentication failed. Please check your API key.');
    }
    if (response.status === 429) {
      // Handle rate limit error
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  public async fetchListings(params: { from: number; size: number }) {
    try {
      await this.checkRateLimit();
      
      const response = await fetch(
        `${this.baseUrl}/search/listings?from=${params.from}&size=${params.size}&listed=true`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  }

  public async refreshToken(): Promise<string> {
    try {
      await this.checkRateLimit();
      
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      this.apiKey = data.token;
      return data.token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }
}

// Create and export the API service instance
export const apiService = ApiService.getInstance({
  baseUrl: 'https://services.baxus.co/api',
  apiKey: process.env.VITE_BAXUS_API_KEY
});

export default apiService; 