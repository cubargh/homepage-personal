# Personal Dashboard

A self-hosted personal dashboard built with Next.js, featuring widgets for weather, sports (F1 & Football), calendar, and service monitoring.

## Features

- **Service Monitoring**: Check the status of your self-hosted services.
- **Weather**: Current conditions and forecast (OpenWeatherMap).
- **Sports**:
  - **Formula 1**: Next race countdown, standings (F1 API).
  - **Football**: Live scores and fixtures (Football-Data.org).
- **Calendar**: Upcoming events from ICS feeds.
- **Customizable**: Configured via a simple YAML file.
- **Authentication**: Simple passphrase-based access.

## Getting Started

### Prerequisites

- Node.js 18+ or Docker
- API Keys for:
  - [OpenWeatherMap](https://openweathermap.org/api)
  - [Football-Data.org](https://www.football-data.org/) (Optional)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/yourusername/homepage-personal.git
    cd homepage-personal
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  **Configuration**:
    Copy the example config file to `config.yaml`:

    ```bash
    cp config.example.yaml config.yaml
    ```

    Edit `config.yaml` with your settings:

    ```yaml
    server:
      root_domain: "example.com" # Used for constructing service URLs if needed
      timezone: "America/New_York"
      auth:
        passphrase: "your-secret-passphrase" # Password to access the dashboard
        session_days: 7

    widgets:
      weather:
        enabled: true
        lat: 40.7128
        lon: -74.0060
        api_key: "your-openweather-api-key"
        units: "metric" # or "imperial"

      football:
        enabled: true
        api_key: "your-football-data-api-key"

      calendar:
        enabled: true
        ics_urls:
          - "https://calendar.google.com/calendar/ical/..."

      service_status:
        enabled: true
        services:
          - name: Jellyfin
            url: "https://tv.example.com"
            icon: "jellyfin" # Auto-fetched from selfh.st icons
          - name: Navidrome
            url: "https://music.example.com"
            icon: "https://example.com/custom-icon.png" # Custom URL supported
    ```

### Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Docker

Build and run the container:

```bash
docker build -t personal-dashboard .
docker run -p 3000:3000 -v $(pwd)/config.yaml:/app/config.yaml personal-dashboard
```

## Configuration Details

- **Icons**: Service icons are automatically fetched from the [selfh.st](https://github.com/selfhst/icons) repository if a simple name is provided (e.g., "jellyfin", "plex"). You can also provide a full URL for a custom icon.
- **Layout**: The dashboard uses a responsive grid system. You can rearrange widgets by dragging and resizing them directly in the UI. The layout is saved to your browser's local storage.
