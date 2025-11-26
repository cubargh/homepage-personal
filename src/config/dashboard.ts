import { DashboardConfig } from "@/types";

export const getDashboardConfig = (): DashboardConfig => {
  // In Next.js, process.env is available at runtime on the server.
  // When this is called from a Server Component, it will see the runtime env var.
  // Force user to provide NEXT_PUBLIC_ROOT_DOMAIN, no fallback to localhost.
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || "UTC";

  if (!ROOT_DOMAIN) {
      console.warn("NEXT_PUBLIC_ROOT_DOMAIN is not set. Services URLs will be invalid.");
  }

  return {
    timezone: TIMEZONE,
    services: [
      {
        name: "Jellyfin",
        url: `https://tv.${ROOT_DOMAIN}`,
        icon: "jellyfin",
      },
      {
        name: "Navidrome",
        url: `https://navidrome.${ROOT_DOMAIN}`,
        icon: "navidrome",
      },
      {
        name: "Immich",
        url: `https://photos.${ROOT_DOMAIN}`,
        icon: "immich",
      },
      {
        name: "Jellyseerr",
        url: `https://tvsearch.${ROOT_DOMAIN}`,
        icon: "overseerr",
      },
      {
        name: "n8n",
        url: `https://n8n.${ROOT_DOMAIN}`,
        icon: "n8n",
      },
      {
        name: "IT-Tools",
        url: `https://ittools.${ROOT_DOMAIN}`,
        icon: "it-tools",
      },
      {
        name: "VERT.sh",
        url: `https://convert.${ROOT_DOMAIN}`,
        icon: "vert",
      },
      {
        name: "FileBrowser",
        url: `https://storage.${ROOT_DOMAIN}`,
        icon: "filebrowser",
      },
      {
        name: "ntfy",
        url: `https://ntfy.${ROOT_DOMAIN}`,
        icon: "ntfy",
      },
    ],
    football: {
      leagues: ["PL", "PD", "BL1", "SA", "CL"],
      refreshInterval: 60000, 
    },
    f1: {
      refreshInterval: 60000 * 60, 
    },
    weather: {
      lat: -34.576, // Colegiales, Buenos Aires, Argentina
      lon: -58.455,
      units: "metric",
      refreshInterval: 60000 * 30, // 30 minutes
    },
    monitoring: {
      refreshInterval: 60000, 
    },
    widgets: [
      {
        id: "weather",
        type: "weather",
        colSpan: 1,
        rowSpan: 1,
      },
      {
        id: "services",
        type: "service-monitor",
        colSpan: 1,
        rowSpan: 1,
      },
      {
        id: "f1-next-race",
        type: "f1",
        colSpan: 1, 
        rowSpan: 2,
      },
      {
        id: "football-matches",
        type: "football",
        colSpan: 1,
        rowSpan: 2,
      },
    ],
  };
};
