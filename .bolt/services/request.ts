import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

class HttpRequest {
  private baseUrl: string;

  constructor() {
    // Use production API
    this.baseUrl = 'https://api.comandago.com/';
  }

  public async request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', route: string, body?: any): Promise<AxiosResponse<T>> {
    const url = `${this.baseUrl}${route}`;
    const config: AxiosRequestConfig = {
      method,
      url,
      data: body,
      timeout: 10000
    };

    try {
      const response = await axios(config);
      return response as AxiosResponse<T>;
    } catch (error: any) {
      // Provide a clearer error for network failures
      const isNetworkError = !!(error && (error.code === 'ECONNABORTED' || error.message === 'Network Error'));

      if (isNetworkError) {
        console.warn(`Network error when calling ${url}: ${error.message}`);

        // Rethrow with a friendlier message so UI can display appropriate error
        throw new Error(`Network error: unable to reach API at ${this.baseUrl}. ${error.message || ''}`);
      }

      // Re-throw non-network errors (include server errors)
      throw error;
    }
  }
}

export default HttpRequest;
