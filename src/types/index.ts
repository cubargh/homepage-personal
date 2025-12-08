export interface ServiceStatus {
  url: string;
  status: "UP" | "DOWN";
  statusCode?: number;
  latency: number;
  error?: string;
}

export interface ServiceConfig {
  name: string;
  url: string;
  icon?: string; // Icon name from selfh.st/icons (e.g., "jellyfin", "navidrome")
}

export type WidgetType = "service-monitor" | "football" | "f1" | "weather" | "sports" | "calendar";

export interface BaseWidgetConfig {
  id: string;
  type: WidgetType;
  colSpan?: number; 
  rowSpan?: number;
  x?: number; // Added for grid layout
  y?: number; // Added for grid layout
}

export interface ServiceWidgetConfig extends BaseWidgetConfig {
  type: "service-monitor";
}

export interface FootballWidgetConfig extends BaseWidgetConfig {
  type: "football";
}

export interface F1WidgetConfig extends BaseWidgetConfig {
  type: "f1";
}

export interface WeatherWidgetConfig extends BaseWidgetConfig {
  type: "weather";
}

export interface SportsWidgetConfig extends BaseWidgetConfig {
  type: "sports";
}

export interface CalendarWidgetConfig extends BaseWidgetConfig {
  type: "calendar";
}

export type WidgetConfig = 
  | ServiceWidgetConfig 
  | FootballWidgetConfig 
  | F1WidgetConfig 
  | WeatherWidgetConfig 
  | SportsWidgetConfig 
  | CalendarWidgetConfig;

export interface DashboardConfig {
  timezone: string;
  services: ServiceConfig[];
  football: {
    leagues: string[];
    refreshInterval: number;
  };
  f1: {
    refreshInterval: number;
  };
  weather: {
    lat: number;
    lon: number;
    units: "metric" | "imperial";
    refreshInterval: number;
  };
  calendar: {
    icsUrl: string;
    refreshInterval: number;
  };
  monitoring: {
    refreshInterval: number;
  };
  widgets: WidgetConfig[];
}

// Widget Component Props Interfaces
export interface ServiceWidgetProps {
  services: ServiceConfig[];
  config: { refreshInterval: number };
}

export interface FootballWidgetProps {
  config: { leagues: string[]; refreshInterval: number; timezone: string };
}

export interface F1WidgetProps {
  config: { refreshInterval: number; timezone: string };
}

export interface WeatherWidgetProps {
  config: { lat: number; lon: number; units: "metric" | "imperial"; refreshInterval: number; timezone: string };
}

export interface CalendarWidgetProps {
  config: { icsUrl: string; refreshInterval: number; timezone: string };
}

export interface SportsWidgetProps {
  f1Config: { refreshInterval: number; timezone: string };
  footballConfig: { leagues: string[]; refreshInterval: number; timezone: string };
}

export interface FootballMatch {
  id: number;
  utcDate: string;
  status: string;
  competition: {
    id: number;
    name: string;
    code: string;
    emblem: string;
  };
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
}

export interface FootballResponse {
  matches: FootballMatch[];
}

export interface F1ApiCircuit {
  circuitId: string;
  circuitName: string;
  country: string;
  city: string;
  circuitLength: string;
  url: string;
}

export interface F1ApiRaceSchedule {
  race: { date: string; time: string };
  qualy: { date: string; time: string };
  fp1: { date: string; time: string };
  fp2?: { date: string; time: string };
  fp3?: { date: string; time: string };
  sprintQualy?: { date: string; time: string };
  sprintRace?: { date: string; time: string };
}

export interface F1ApiRace {
  raceId: string;
  raceName: string;
  schedule: F1ApiRaceSchedule;
  circuit: F1ApiCircuit;
  round: number;
}

export interface F1ApiNextResponse {
  season: number;
  round: number;
  race: F1ApiRace[];
}

export interface F1ApiDriverChampionshipItem {
    classificationId: number;
    driverId: string;
    teamId: string;
    points: number;
    position: number;
    wins: number;
    driver: {
        name: string;
        surname: string;
        nationality: string;
        birthday: string;
        number: number;
        shortName: string;
        url: string;
    };
    team: {
        teamId: string;
        teamName: string;
        country: string;
        firstAppareance: number;
        constructorsChampionships: number | null;
        driversChampionships: number | null;
        url: string;
    };
}

export interface F1ApiDriverChampionshipResponse {
    season: number;
    total: number;
    drivers_championship: F1ApiDriverChampionshipItem[];
}

export interface F1ApiConstructorChampionshipItem {
    classificationId: number;
    teamId: string;
    points: number;
    position: number;
    wins: number;
    team: {
        teamName: string;
        country: string;
        firstAppareance: number;
        constructorsChampionships: number | null;
        driversChampionships: number | null;
        url: string;
    };
}

export interface F1ApiConstructorChampionshipResponse {
    season: number;
    total: number;
    constructors_championship: F1ApiConstructorChampionshipItem[];
}

export interface WeatherData {
  location: {
    city: string;
    country: string;
  };
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    description: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    temp_min: number;
    temp_max: number;
    condition: string;
    icon: string;
  }>;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
}

export interface GridSize {
  w: number;
  h: number;
}

export interface BeszelDiskMetric {
  name: string;
  used: number;
  total: number;
  percentage: number;
}

export interface BeszelNetworkMetric {
  bytes_sent: number;
  bytes_recv: number;
  speed_sent?: number;
  speed_recv?: number;
}

export interface BeszelLoadMetric {
  load1: number;
  load5: number;
  load15: number;
}

export interface BeszelMemoryMetric {
  used: number;
  total: number;
  percentage: number;
}

export interface BeszelMetrics {
  uptime?: number; // seconds
  cpu?: number; // percentage
  memory?: BeszelMemoryMetric;
  disk?: BeszelDiskMetric[];
  network?: BeszelNetworkMetric;
  temperature?: number; // celsius
  load?: BeszelLoadMetric;
  server_name?: string;
  last_updated?: string;
}

export interface BaseWidgetProps {
  gridSize?: GridSize;
}

export interface BeszelWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    auth: {
      type: "token" | "email";
      token?: string;
      email?: string;
      password?: string;
    };
    refreshInterval: number;
    display_metrics?: string[];
    server_name?: string;
    compact_view?: boolean;
    disk_names?: Record<string, string>; // Map disk names to display names
    network_interface?: string; // Optional: specific network interface to use for network stats
  };
}
