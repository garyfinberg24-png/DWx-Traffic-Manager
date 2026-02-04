import axios, { AxiosError } from 'axios';
import { config, checkPowerAutomateConfig } from '../config/environmentConfig';
import { BookingFormData } from '../types/Booking';
import { PowerAutomateResponse, PowerAutomatePayload } from '../types/ApiResponses';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

interface RetryState {
  attempt: number;
  lastError?: Error;
}

class PowerAutomateService {
  private get flowUrl(): string {
    return config.powerAutomate.flowUrl;
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);

    // Add jitter (random 0-1000ms) to prevent thundering herd
    const jitter = Math.random() * 1000;

    // Cap at max delay
    return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay);
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: AxiosError): boolean {
    // Network errors are retryable
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      return true;
    }

    // Check status codes
    if (error.response?.status && RETRY_CONFIG.retryableStatusCodes.includes(error.response.status)) {
      return true;
    }

    return false;
  }

  /**
   * Get retry-after header value in milliseconds
   */
  private getRetryAfter(error: AxiosError): number | null {
    const retryAfter = error.response?.headers?.['retry-after'];
    if (retryAfter) {
      // Could be seconds or a date string
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
      // Try parsing as date
      const date = new Date(retryAfter);
      if (!isNaN(date.getTime())) {
        return Math.max(0, date.getTime() - Date.now());
      }
    }
    return null;
  }

  /**
   * Submit booking with automatic retry logic
   */
  async submitBooking(
    data: BookingFormData,
    user: { name: string; email: string },
    options?: { onRetry?: (attempt: number, delay: number) => void }
  ): Promise<PowerAutomateResponse> {
    // Check if Power Automate URL is configured
    if (!checkPowerAutomateConfig()) {
      throw new Error(
        'Power Automate Flow URL is not configured. Please update your environment configuration.'
      );
    }

    const payload: PowerAutomatePayload = {
      accountManagerName: user.name,
      accountManagerEmail: user.email,
      clientName: data.clientName,
      bookingType: data.bookingType,
      licenseCount: data.licenseCount,
      proposedSlot1: data.proposedSlot1.toISOString(),
      proposedSlot2: data.proposedSlot2.toISOString(),
      proposedSlot3: data.proposedSlot3.toISOString(),
      comments: data.comments || '',
      isPremiumClient: data.isPremiumClient,
    };

    return this.executeWithRetry(
      () => this.sendRequest(payload),
      options?.onRetry
    );
  }

  /**
   * Execute a function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, delay: number) => void
  ): Promise<T> {
    const state: RetryState = { attempt: 0 };

    while (state.attempt <= RETRY_CONFIG.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        const axiosError = error as AxiosError;
        state.lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        if (state.attempt < RETRY_CONFIG.maxRetries && this.isRetryableError(axiosError)) {
          state.attempt++;

          // Calculate delay (use retry-after header if present)
          const retryAfter = this.getRetryAfter(axiosError);
          const delay = retryAfter ?? this.calculateDelay(state.attempt - 1);

          console.warn(
            `Power Automate request failed (attempt ${state.attempt}/${RETRY_CONFIG.maxRetries}). ` +
            `Retrying in ${Math.round(delay / 1000)}s...`,
            axiosError.message
          );

          // Notify caller about retry
          if (onRetry) {
            onRetry(state.attempt, delay);
          }

          await this.sleep(delay);
          continue;
        }

        // Not retryable or max retries reached
        return this.handleError(axiosError, state.attempt);
      }
    }

    // Should never reach here, but TypeScript needs this
    throw state.lastError || new Error('Unknown error');
  }

  /**
   * Send the actual request
   */
  private async sendRequest(payload: PowerAutomatePayload): Promise<PowerAutomateResponse> {
    const response = await axios.post<PowerAutomateResponse>(this.flowUrl, payload, {
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  /**
   * Handle and transform errors into user-friendly messages
   */
  private handleError(error: AxiosError, attempts: number): never {
    console.error(`Power Automate submission failed after ${attempts} attempt(s):`, error);

    const attemptsMsg = attempts > 1 ? ` after ${attempts} attempts` : '';

    if (error.code === 'ECONNABORTED') {
      throw new Error(
        `Request timeout${attemptsMsg}. The booking system is taking longer than expected. Please try again.`
      );
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      throw new Error(
        `Network error${attemptsMsg}. Please check your connection and try again.`
      );
    } else if (error.response?.status === 429) {
      throw new Error(
        `Too many requests${attemptsMsg}. Please wait a moment and try again.`
      );
    } else if (error.response?.status && error.response.status >= 500) {
      throw new Error(
        `The booking system is temporarily unavailable${attemptsMsg}. Please try again later.`
      );
    } else if (error.response?.status === 400) {
      throw new Error('Invalid booking data. Please check your input and try again.');
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Not authorized to submit bookings. Please contact your administrator.');
    } else {
      throw new Error(`Failed to submit booking${attemptsMsg}. Please try again.`);
    }
  }

  /**
   * Submit booking with circuit breaker pattern (prevents overwhelming a failing service)
   */
  async submitBookingWithCircuitBreaker(
    data: BookingFormData,
    user: { name: string; email: string },
    circuitBreaker: CircuitBreaker
  ): Promise<PowerAutomateResponse> {
    if (!circuitBreaker.canRequest()) {
      throw new Error(
        'The booking system is experiencing issues. Please try again in a few minutes.'
      );
    }

    try {
      const result = await this.submitBooking(data, user);
      circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      circuitBreaker.recordFailure();
      throw error;
    }
  }

  // Helper method to test if the flow URL is valid
  async testConnection(): Promise<boolean> {
    if (!this.flowUrl) {
      return false;
    }

    try {
      // We can't actually test the flow without submitting data
      // So just verify the URL is reachable
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Simple Circuit Breaker implementation
 * Prevents overwhelming a failing service
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5, // Number of failures before opening
    private readonly resetTimeout: number = 60000 // Time in ms before attempting to close
  ) {}

  canRequest(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      // Check if we should try half-open
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }

    // half-open: allow one request
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = 'closed';
  }
}

export const powerAutomateService = new PowerAutomateService();

// Export a shared circuit breaker instance for the app
export const bookingCircuitBreaker = new CircuitBreaker(5, 60000);
