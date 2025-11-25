export interface AQICNCurrentResponse {
  status: string;
  data: {
    aqi: number;
    idx: number;
    attributions: Array<{
      url: string;
      name: string;
      logo?: string;
    }>;
    city: {
      geo: [number, number];
      name: string;
      url: string;
    };
    dominentpol: string;
    iaqi: {
      co?: { v: number };
      h?: { v: number };
      no2?: { v: number };
      o3?: { v: number };
      p?: { v: number };
      pm10?: { v: number };
      pm25?: { v: number };
      so2?: { v: number };
      t?: { v: number };
      w?: { v: number };
      wg?: { v: number };
    };
    time: {
      s: string;
      tz: string;
      v: number;
    };
    forecast?: {
      daily: {
        o3: Array<{ avg: number; day: string; max: number; min: number }>;
        pm10: Array<{ avg: number; day: string; max: number; min: number }>;
        pm25: Array<{ avg: number; day: string; max: number; min: number }>;
      };
    };
  };
}

export interface AQICNHistoricalResponse {
  status: string;
  data: Array<{
    date: {
      s: string;
      tz: string;
      v: number;
    };
    value: {
      aqi: number;
      iaqi: {
        co?: { v: number };
        h?: { v: number };
        no2?: { v: number };
        o3?: { v: number };
        p?: { v: number };
        pm10?: { v: number };
        pm25?: { v: number };
        so2?: { v: number };
        t?: { v: number };
        w?: { v: number };
      };
    };
  }>;
}

export interface AQICNSearchResponse {
  status: string;
  data: Array<{
    uid: number;
    aqi: string;
    time: {
      tz: string;
      stime: string;
      vtime: number;
    };
    station: {
      name: string;
      geo: [number, number];
      url: string;
      country: string;
    };
  }>;
}

export interface ProcessedHistoricalData {
  date: string;
  aqi: number;
  pm25?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  so2?: number;
  co?: number;
  dominentpol?: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
}

export interface AQIInsights {
  weeklyAverage: number;
  trend: 'improving' | 'worsening' | 'stable';
  trendPercentage: number;
  bestDay: {
    date: string;
    aqi: number;
  };
  worstDay: {
    date: string;
    aqi: number;
  };
  dominantPollutant: string;
  healthyDaysCount: number;
  moderateDaysCount: number;
  unhealthyDaysCount: number;
  pollutantBreakdown: {
    pm25: number[];
    pm10: number[];
    o3: number[];
    no2: number[];
  };
}

export interface WeeklyAQIReport {
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  dailyData: ProcessedHistoricalData[];
  insights: AQIInsights;
  lastUpdated: string;
  dataSource: string;
}