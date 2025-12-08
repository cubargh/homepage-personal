interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryOn?: number[]; // HTTP status codes to retry on
  baseURL?: string;
  headers?: Record<string, string>;
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  
  constructor(
    private failureThreshold = 5,
    private resetTimeout = 60000 // 60 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    // If in half-open state, immediately go back to open on failure
    if (this.state === "half-open") {
      this.state = "open";
    } else if (this.failures >= this.failureThreshold) {
      this.state = "open";
    }
  }
}

export class HttpClient {
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private defaultOptions: Required<Omit<HttpClientOptions, "baseURL" | "headers">> = {
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
    retryOn: [408, 429, 500, 502, 503, 504],
  };

  constructor(private options: HttpClientOptions = {}) {}

  private getCircuitBreaker(key: string): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker());
    }
    return this.circuitBreakers.get(key)!;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number,
    retryDelay: number,
    retryOn: number[]
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.options.timeout || this.defaultOptions.timeout
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Retry on specific status codes
      if (retries > 0 && retryOn.includes(response.status)) {
        await this.sleep(retryDelay);
        return this.fetchWithRetry(
          url,
          options,
          retries - 1,
          retryDelay * 2, // Exponential backoff
          retryOn
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (retries > 0 && (error instanceof Error && error.name === "AbortError" || error instanceof TypeError)) {
        await this.sleep(retryDelay);
        return this.fetchWithRetry(
          url,
          options,
          retries - 1,
          retryDelay * 2,
          retryOn
        );
      }

      throw error;
    }
  }

  async request(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Only prepend baseURL if URL is not absolute
    const isAbsoluteUrl = url.startsWith("http://") || url.startsWith("https://");
    const fullUrl = this.options.baseURL && !isAbsoluteUrl
      ? `${this.options.baseURL}${url}`
      : url;

    const mergedHeaders = {
      ...this.options.headers,
      ...options.headers,
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: mergedHeaders,
    };

    const retries = this.options.retries ?? this.defaultOptions.retries;
    const retryDelay = this.options.retryDelay || this.defaultOptions.retryDelay;
    const retryOn = this.options.retryOn || this.defaultOptions.retryOn;

    // Use circuit breaker for external requests
    let circuitKey: string;
    try {
      circuitKey = new URL(fullUrl).hostname;
    } catch {
      // If URL is invalid, don't use circuit breaker
      return this.fetchWithRetry(fullUrl, requestOptions, retries, retryDelay, retryOn);
    }
    
    const circuitBreaker = this.getCircuitBreaker(circuitKey);

    return circuitBreaker.execute(() =>
      this.fetchWithRetry(fullUrl, requestOptions, retries, retryDelay, retryOn)
    );
  }

  async get(url: string, options?: RequestInit): Promise<Response> {
    return this.request(url, { ...options, method: "GET" });
  }

  async post(url: string, body?: unknown, options?: RequestInit): Promise<Response> {
    return this.request(url, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  }

  async put(url: string, body?: unknown, options?: RequestInit): Promise<Response> {
    return this.request(url, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  }

  async patch(url: string, body?: unknown, options?: RequestInit): Promise<Response> {
    return this.request(url, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  }

  async delete(url: string, options?: RequestInit): Promise<Response> {
    return this.request(url, { ...options, method: "DELETE" });
  }
}

// Default instance
export const httpClient = new HttpClient();

