# Personal Dashboard

A self-hosted personal dashboard built with Next.js, featuring widgets for weather, sports (F1 & Football), calendar, and service monitoring, plus integrations for your self-hosted media and finance services.

## Features

- **Service Monitoring**: Check the status of your self-hosted services.
- **Weather**: Current conditions and forecast (OpenWeatherMap).
- **Sports**:
  - **Formula 1**: Next race countdown, standings (F1 API).
  - **Football**: Live scores and fixtures (Football-Data.org).
  - **Padel**: Upcoming matches and tournaments (Padel API).
- **Media & Self-Hosted**:
  - **Jellyfin**: Library stats and latest movies/shows.
  - **Navidrome**: "Now Playing" with cover art and library stats.
  - **Immich**: Server statistics (Photos, Videos, Usage).
  - **qBittorrent**: Active downloads, upload/download speeds, and seeding stats.
- **Finance**:
  - **Ghostfolio**: Portfolio performance metrics (Today, Month, Year, Total).
- **Network**:
  - **Speedtest Tracker**: Latest download, upload, and ping metrics from your Speedtest Tracker instance.
- **Calendar**: Upcoming events from ICS feeds.
- **Customizable**: Configured via a simple YAML file.
- **Authentication**: Simple passphrase-based access.

## Getting Started

### Prerequisites

- Node.js 18+ or Docker
- API Keys for:
  - [OpenWeatherMap](https://openweathermap.org/api)
  - [Football-Data.org](https://www.football-data.org/) (Optional)
  - [Padel API](https://padelapi.org/) (Optional)
  - Your self-hosted services (Jellyfin, Navidrome, Immich, Ghostfolio)
  - [Speedtest Tracker](https://docs.speedtest-tracker.dev/api/responses/results) API token with `results:read` scope (Optional)

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

    Edit `config.yaml` with your settings. Refer to `config.example.yaml` for all available options and structure.

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

Or using Docker Compose:

```yaml
services:
  dashboard:
    image: ghcr.io/cubargh/homepage-personal:latest
    container_name: personal-dashboard
    restart: unless-stopped
    ports:
      - "4444:3000"
    volumes:
      - ./config.yaml:/app/config.yaml
    environment:
      - NODE_ENV=production
      - CONFIG_FILE=/app/config.yaml
```

## Configuration Details

- **Icons**: Service icons are automatically fetched from the [selfh.st](https://github.com/selfhst/icons) repository if a simple name is provided (e.g., "jellyfin", "plex"). You can also provide a full URL for a custom icon.
- **Layout**: The dashboard uses a responsive grid system. You can rearrange widgets by dragging and resizing them directly in the UI. The layout is saved to your browser's local storage.
- **Widget Registry**: The codebase uses a widget registry system, making it easy to add new widgets by defining them in `src/config/widgets.ts` and creating a corresponding React component.
- **Custom Config Path**: You can specify a custom path for the configuration file by setting the `CONFIG_FILE` environment variable (e.g., in `.env`). This is useful for development or testing with different configurations.
