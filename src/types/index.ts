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

export interface WidgetConfig {
  id: string;
  type: "service-monitor" | "football" | "f1" | "weather" | "sports";
  config?: any; 
  colSpan?: number; 
  rowSpan?: number; // Added
}

export interface DashboardConfig {
  timezone: string; // Added
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
  monitoring: {
    refreshInterval: number;
  };
  widgets: WidgetConfig[];
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
