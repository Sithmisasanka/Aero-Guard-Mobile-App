import { AQIData } from '../types';
import { AQIService } from './aqiService';

export interface RealtimeDataConfig {
  pollInterval?: number; // in milliseconds
  enableWebSocket?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface RealtimeDataCallbacks {
  onDataUpdate?: (data: AQIData) => void;
  onError?: (error: Error) => void;
  onConnectionStateChange?: (connected: boolean) => void;
}

export class RealtimeAQIService {
  private static instance: RealtimeAQIService;
  private pollInterval: number = 300000; // 5 minutes default (was 30 seconds)
  private maxRetries: number = 3;
  private retryDelay: number = 30000; // 30 seconds (was 5 seconds)
  private isPolling: boolean = false;
  private pollTimer?: NodeJS.Timeout;
  private callbacks: RealtimeDataCallbacks = {};
  private currentData: AQIData | null = null;
  private latitude: number;
  private longitude: number;
  private retryCount: number = 0;
  private lastFetchTime: number = 0;
  private minFetchInterval: number = 60000; // Minimum 1 minute between API calls

  private constructor(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  static getInstance(latitude: number, longitude: number): RealtimeAQIService {
    if (!RealtimeAQIService.instance) {
      RealtimeAQIService.instance = new RealtimeAQIService(latitude, longitude);
    }
    return RealtimeAQIService.instance;
  }

  configure(config: RealtimeDataConfig): void {
    if (config.pollInterval) this.pollInterval = config.pollInterval;
    if (config.maxRetries !== undefined) this.maxRetries = config.maxRetries;
    if (config.retryDelay) this.retryDelay = config.retryDelay;
  }

  setCallbacks(callbacks: RealtimeDataCallbacks): void {
    this.callbacks = callbacks;
  }

  updateLocation(latitude: number, longitude: number): void {
    this.latitude = latitude;
    this.longitude = longitude;
    if (this.isPolling) {
      this.stopPolling();
      this.startPolling();
    }
  }

  async startPolling(): Promise<void> {
    if (this.isPolling) return;

    this.isPolling = true;
    console.log('Starting realtime AQI polling...');

    // Initial fetch
    await this.fetchData();

    // Start polling
    this.pollTimer = setInterval(async () => {
      await this.fetchData();
    }, this.pollInterval);
  }

  stopPolling(): void {
    if (!this.isPolling) return;

    this.isPolling = false;
    console.log('Stopping realtime AQI polling...');

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private async fetchData(): Promise<void> {
    try {
      // Rate limiting: check if enough time has passed since last fetch
      const now = Date.now();
      const timeSinceLastFetch = now - this.lastFetchTime;
      
      if (timeSinceLastFetch < this.minFetchInterval) {
        console.log(`Rate limiting: Skipping fetch (${Math.round((this.minFetchInterval - timeSinceLastFetch) / 1000)}s remaining)`);
        return;
      }

      console.log('Fetching realtime AQI data...');
      this.lastFetchTime = now;
      
      const data = await AQIService.getCurrentAQI(this.latitude, this.longitude);

      if (data) {
        // Check if data has actually changed
        const hasChanged = !this.currentData ||
          this.currentData.aqi !== data.aqi ||
          this.currentData.city !== data.city ||
          this.currentData.timestamp !== data.timestamp;

        if (hasChanged) {
          this.currentData = data;
          this.callbacks.onDataUpdate?.(data);
          console.log('AQI data updated:', data.aqi);
        } else {
          console.log('AQI data unchanged, skipping update');
        }

        // Reset retry count on successful fetch
        this.retryCount = 0;
        this.callbacks.onConnectionStateChange?.(true);
      } else {
        throw new Error('No data received from AQI service');
      }
    } catch (error) {
      console.error('Realtime AQI fetch error:', error);
      this.callbacks.onError?.(error as Error);
      this.callbacks.onConnectionStateChange?.(false);

      // Implement retry logic with exponential backoff
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const backoffDelay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
        console.log(`Retrying AQI fetch in ${Math.round(backoffDelay / 1000)}s (attempt ${this.retryCount}/${this.maxRetries})`);

        setTimeout(() => {
          if (this.isPolling) {
            this.fetchData();
          }
        }, backoffDelay);
      } else {
        console.log('Max retries reached, stopping automatic retries');
      }
    }
  }

  // Public method to manually refresh data
  async refreshData(): Promise<void> {
    await this.fetchData();
  }

  getCurrentData(): AQIData | null {
    return this.currentData;
  }

  isConnected(): boolean {
    return this.isPolling && this.retryCount === 0;
  }

  getStatus(): {
    isPolling: boolean;
    lastUpdate: Date | null;
    retryCount: number;
    connectionState: 'connected' | 'connecting' | 'disconnected';
  } {
    return {
      isPolling: this.isPolling,
      lastUpdate: this.currentData ? new Date(this.currentData.timestamp) : null,
      retryCount: this.retryCount,
      connectionState: this.isConnected() ? 'connected' :
                      this.isPolling ? 'connecting' : 'disconnected'
    };
  }

  // Cleanup method
  destroy(): void {
    this.stopPolling();
    this.callbacks = {};
    this.currentData = null;
    if (RealtimeAQIService.instance === this) {
      RealtimeAQIService.instance = null as any;
    }
  }
}

// React Hook for easy integration
import { useState, useEffect, useRef } from 'react';

export const useRealtimeAQI = (
  latitude: number,
  longitude: number,
  config?: RealtimeDataConfig
) => {
  const [data, setData] = useState<AQIData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const serviceRef = useRef<RealtimeAQIService | null>(null);

  useEffect(() => {
    // Get or create service instance
    serviceRef.current = RealtimeAQIService.getInstance(latitude, longitude);

    // Configure service
    if (config) {
      serviceRef.current.configure(config);
    }

    // Set callbacks
    serviceRef.current.setCallbacks({
      onDataUpdate: (newData) => {
        setData(newData);
        setError(null);
      },
      onError: (err) => {
        setError(err);
      },
      onConnectionStateChange: (connected) => {
        setIsConnected(connected);
      }
    });

    // Start polling
    serviceRef.current.startPolling();

    // Cleanup on unmount
    return () => {
      if (serviceRef.current) {
        serviceRef.current.stopPolling();
      }
    };
  }, [latitude, longitude]);

  // Update location if it changes
  useEffect(() => {
    if (serviceRef.current) {
      serviceRef.current.updateLocation(latitude, longitude);
    }
  }, [latitude, longitude]);

  const refresh = () => {
    if (serviceRef.current) {
      serviceRef.current.refreshData();
    }
  };

  const getStatus = () => {
    return serviceRef.current?.getStatus() || {
      isPolling: false,
      lastUpdate: null,
      retryCount: 0,
      connectionState: 'disconnected' as const
    };
  };

  return {
    data,
    error,
    isConnected,
    refresh,
    getStatus
  };
};
