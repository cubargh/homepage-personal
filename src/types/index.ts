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

export interface ShortcutConfig {
  name: string;
  url: string;
  icon?: string; // Icon name from selfh.st/icons or full URL
}

export type WidgetType =
  | "service-monitor"
  | "shortcuts"
  | "football"
  | "f1"
  | "weather"
  | "sports"
  | "calendar"
  | "jellyfin"
  | "immich"
  | "ghostfolio"
  | "navidrome"
  | "qbittorrent";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  colSpan: number;
  rowSpan: number;
  x: number; // Added for grid layout
  y: number; // Added for grid layout
  props?: any; // Component props
}

export interface DashboardConfig {
  timezone: string;
  debug?: boolean;
  widgets: WidgetConfig[];
}

// Grid Types
export interface GridSize {
  w: number;
  h: number;
}

export interface BaseWidgetProps {
  gridSize?: GridSize;
}

// Widget Component Props Interfaces
export interface ServiceWidgetProps extends BaseWidgetProps {
  services: ServiceConfig[];
  config: { 
    refreshInterval: number;
    columns: number | "auto"; // Number of columns for the service grid, or "auto"
    rows?: number | "auto"; // Number of rows to display, or "auto"
    compactMode: boolean; // Whether to use compact mode
  };
}

export interface ShortcutsWidgetProps extends BaseWidgetProps {
  shortcuts: ShortcutConfig[];
  config: {
    columns: number | "auto"; // Number of columns for the shortcuts grid, or "auto"
    rows?: number | "auto"; // Number of rows to display, or "auto"
    compactMode: boolean; // Whether to use compact mode
  };
}

export interface FootballWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    leagues: string[];
    refreshInterval: number;
    timezone: string;
  };
}

export interface F1WidgetProps extends BaseWidgetProps {
  config: { enabled: boolean; refreshInterval: number; timezone: string };
}

export interface WeatherWidgetProps extends BaseWidgetProps {
  config: {
    lat: number;
    lon: number;
    units: "metric" | "imperial";
    refreshInterval: number;
    timezone: string;
  };
}

export interface CalendarWidgetProps extends BaseWidgetProps {
  config: { icsUrl: string; refreshInterval: number; timezone: string };
}

export interface JellyfinWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    refreshInterval: number;
  };
}

export interface SportsWidgetProps extends BaseWidgetProps {
  f1Config: { enabled: boolean; refreshInterval: number; timezone: string };
  footballConfig: {
    enabled: boolean;
    leagues: string[];
    refreshInterval: number;
    timezone: string;
  };
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
    countryCode?: string; // Optional if you need it
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

// Jellyfin Types
export interface JellyfinStats {
  MovieCount: number;
  SeriesCount: number;
  EpisodeCount: number;
  SongCount: number;
}

export interface JellyfinItem {
  Id: string;
  Name: string;
  Type: "Movie" | "Series" | "Episode" | "Audio";
  DateCreated: string;
  ImageTags: {
    Primary?: string;
    Backdrop?: string;
  };
  BackdropImageTags?: string[]; // Sometimes it's an array
}

// Immich Types
export interface ImmichWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    refreshInterval: number;
  };
}

export interface ImmichStats {
  photos: number;
  videos: number;
  usage: number; // in bytes
}

// Ghostfolio Types
export interface GhostfolioWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    refreshInterval: number;
    display_metrics?: string[]; // "today", "week", "month", "year", "total"
  };
}

export interface GhostfolioStats {
  performance: {
    "1d": { relativeChange: number };
    "7d": { relativeChange: number };
    "28d": { relativeChange: number };
    "30d": { relativeChange: number };
    ytd: { relativeChange: number };
    max: { relativeChange: number };
  };
}

// Navidrome Types
export interface NavidromeWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    user: string;
    password: string; // The raw password
    refreshInterval: number;
  };
}

export interface NavidromeStats {
  albumCount: number;
  artistCount: number;
  songCount: number;
  nowPlaying?: NavidromeNowPlaying;
}

export interface NavidromeNowPlaying {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverArt: string;
  duration: number;
  minutesAgo: number; // How long ago it was played/started
  player: string; // username
}

// qBittorrent Types
export interface QBittorrentWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    refreshInterval: number;
    display_metrics?: string[];
  };
}

export interface QBittorrentTorrent {
  hash: string;
  name: string;
  state: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  eta: number;
  ratio: number;
  num_seeds: number;
  num_leechs: number;
}

export interface QBittorrentTransferInfo {
  dl_info_speed: number;
  up_info_speed: number;
  dl_info_data: number;
  up_info_data: number;
}

export interface QBittorrentData {
  transfer: QBittorrentTransferInfo;
  seeding: QBittorrentTorrent[];
  leeching: QBittorrentTorrent[];
}
