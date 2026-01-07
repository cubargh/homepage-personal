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

export type WidgetType =
  | "service-monitor"
  | "weather"
  | "sports"
  | "calendar"
  | "shortcuts"
  | "clock"
  | "jellyfin"
  | "immich"
  | "ghostfolio"
  | "navidrome"
  | "qbittorrent"
  | "ip-camera"
  | "rss"
  | "speedtest-tracker"
  | "tasks"
  | "beszel";

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
  | WeatherWidgetConfig
  | SportsWidgetConfig
  | CalendarWidgetConfig
  | {
      id: string;
      type: string;
      x?: number;
      y?: number;
      colSpan?: number;
      rowSpan?: number;
      props?: Record<string, unknown>;
    };

export interface DashboardConfig {
  timezone: string;
  services?: ServiceConfig[];
  weather?: {
    lat: number;
    lon: number;
    units: "metric" | "imperial";
    refreshInterval: number;
  };
  calendar?: {
    icsUrl: string;
    refreshInterval: number;
  };
  monitoring?: {
    refreshInterval: number;
  };
  widgets: WidgetConfig[];
  debug?: boolean;
}

// Widget Component Props Interfaces
export interface ServiceWidgetProps extends BaseWidgetProps {
  services: ServiceConfig[];
  config: {
    refreshInterval: number;
    compactMode?: boolean;
    columns?: number | "auto";
    rows?: number | "auto";
    click_behavior?: "new_tab" | "same_tab";
  };
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

export interface SportsWidgetProps {
  f1Config: { refreshInterval: number; timezone: string };
  footballConfig: {
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

// Clock Widget
export interface ClockWidgetProps extends BaseWidgetProps {
  config: {
    format?: "12h" | "24h";
    showSeconds?: boolean;
    showDate?: boolean;
    showDay?: boolean;
    timezone?: string;
  };
}

// Shortcuts Widget
export interface ShortcutConfig {
  name: string;
  url: string;
  icon?: string;
}

export interface ShortcutsWidgetProps extends BaseWidgetProps {
  shortcuts: ShortcutConfig[];
  config: {
    shortcuts: ShortcutConfig[];
    compactMode?: boolean;
    columns?: number | "auto";
    rows?: number | "auto";
    click_behavior?: "new_tab" | "same_tab";
  };
}

// Jellyfin Widget
export interface JellyfinItem {
  id: string;
  Id?: string; // Some APIs use capitalized Id
  name: string;
  Name?: string; // Some APIs use capitalized Name
  type: string;
  overview?: string;
  year?: number;
  imageUrl?: string;
  dateAdded?: string;
  DateCreated?: string; // Some APIs use capitalized DateCreated
}

export interface JellyfinStats {
  totalMovies: number;
  totalShows: number;
  totalEpisodes: number;
  MovieCount?: number;
  SeriesCount?: number;
  EpisodeCount?: number;
}

export interface JellyfinWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    apiKey: string;
    refreshInterval: number;
  };
}

// Immich Widget
export interface ImmichStats {
  totalPhotos: number;
  totalVideos: number;
  totalAlbums: number;
  usage?: number;
  photos?: number;
  videos?: number;
}

export interface ImmichWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    apiKey: string;
    refreshInterval: number;
  };
}

// Ghostfolio Widget
export interface GhostfolioStats {
  totalValue: number;
  currency: string;
  performance?: {
    "1d"?: { relativeChange?: number };
    "7d"?: { relativeChange?: number };
    "30d"?: { relativeChange?: number };
    "28d"?: { relativeChange?: number };
    ytd?: { relativeChange?: number };
    max?: { relativeChange?: number };
    [key: string]: { relativeChange?: number } | undefined;
  };
}

export interface GhostfolioWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    accessToken: string;
    refreshInterval: number;
    display_metrics?: string[];
  };
}

// Navidrome Widget
export interface NavidromeStats {
  totalArtists: number;
  totalAlbums: number;
  totalSongs: number;
}

export interface NavidromeWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    username: string;
    password: string;
    refreshInterval: number;
  };
}

// QBittorrent Widget
export interface QBittorrentTorrent {
  hash: string;
  name: string;
  size: number;
  progress: number;
  state: string;
  dlspeed: number;
  upspeed: number;
  eta: number;
  ratio: number;
}

export interface QBittorrentData {
  totalDownloadSpeed: number;
  totalUploadSpeed: number;
  activeTorrents: number;
  totalTorrents: number;
  torrents: QBittorrentTorrent[];
  leeching?: number | QBittorrentTorrent[];
  seeding?: number | QBittorrentTorrent[];
  transfer?: {
    dlSpeed?: number;
    upSpeed?: number;
    dl_info_speed?: number;
    up_info_speed?: number;
  };
}

export interface QBittorrentWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    username: string;
    password: string;
    refreshInterval: number;
  };
}

// IP Camera Widget
export interface IPCameraWidgetProps extends BaseWidgetProps {
  cameras: Array<{
    name: string;
    url: string;
  }>;
  config: {
    enabled: boolean;
    url: string;
    refreshInterval: number;
  };
}

// RSS Widget
export interface RSSWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    feeds: Array<{
      name: string;
      url: string;
    }>;
    refreshInterval: number;
    maxItems?: number;
    view?: "list" | "grid" | "full" | "minimal" | "concise";
    wrap?: boolean;
    timezone?: string;
  };
}

// Speedtest Tracker Widget
export interface SpeedtestTrackerData {
  latest?: {
    download?: number;
    upload?: number;
    ping?: number;
    timestamp?: string;
    createdAt?: string;
  };
  download?: number;
  upload?: number;
  ping?: number;
  createdAt?: string;
}

export interface SpeedtestTrackerWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    url: string;
    apiKey: string;
    refreshInterval: number;
  };
}

// Tasks Widget
export interface TasksWidgetProps extends BaseWidgetProps {
  config: {
    enabled: boolean;
    provider: "google" | "local";
    google?: {
      clientId: string;
      clientSecret: string;
      refreshToken: string;
    };
    refreshInterval: number;
    timezone?: string;
  };
}

// Padel Widget
export interface PadelPair {
  id: string;
  name: string;
  country?: string;
}

export interface PadelTournament {
  id: string;
  name: string;
  level: string;
  startDate: string;
  endDate: string;
  start_date?: string; // Alternative field name
  end_date?: string; // Alternative field name
  location?: string;
  url?: string;
  status?: string;
  country?: string;
}

export interface PadelMatch {
  id: string;
  tournament: PadelTournament;
  pair1: PadelPair;
  pair2: PadelPair;
  players?: {
    team_1?: PadelPair[];
    team_2?: PadelPair[];
  };
  score?: string;
  scheduledTime?: string;
  schedule_label?: string;
  played_at?: string;
  status: string;
  round?: string;
  category?: "men" | "women";
  court?: string;
}

export interface PadelMatchesResponse {
  matches?: PadelMatch[];
  data?: PadelMatch[];
}

export interface PadelTournamentsResponse {
  tournaments?: PadelTournament[];
  data?: PadelTournament[];
}
