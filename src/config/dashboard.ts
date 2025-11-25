import { DashboardConfig } from "@/types";

export const dashboardConfig: DashboardConfig = {
  services: [
    {
      name: "Jellyfin",
      url: "https://tv.falopa.org",
      icon: "jellyfin",
    },
    {
      name: "Navidrome",
      url: "https://navidrome.falopa.org",
      icon: "navidrome",
    },
    {
      name: "Immich",
      url: "https://photos.falopa.org",
      icon: "immich", // Assuming Immich based on typical self-hosted photo apps, or fallback to generic
    },
    {
      name: "Jellyseerr",
      url: "https://tvsearch.falopa.org",
      icon: "overseerr", // Assumption: TV Search often refers to Overseerr/Jellyseerr
    },
    {
      name: "n8n",
      url: "https://n8n.falopa.org",
      icon: "n8n",
    },
    {
      name: "IT-Tools",
      url: "https://ittools.falopa.org",
      icon: "it-tools",
    },
    {
      name: "VERT.sh",
      url: "https://convert.falopa.org",
      icon: "vert", // Assuming 'vert' icon exists in selfh.st collection, otherwise fallback/generic will apply
    },
    {
      name: "FileBrowser",
      url: "https://storage.falopa.org",
      icon: "filebrowser", // Common storage browser
    },
    {
      name: "ntfy",
      url: "https://ntfy.falopa.org",
      icon: "ntfy",
    },
  ],
  football: {
    leagues: ["PL", "PD", "BL1", "SA", "CL", "EL"],
    refreshInterval: 60000, 
  },
  f1: {
    refreshInterval: 60000 * 60, 
  },
  monitoring: {
    refreshInterval: 60000, 
  },
  widgets: [
    {
      id: "services",
      type: "service-monitor",
      colSpan: 2, 
    },
    {
      id: "f1-next-race",
      type: "f1",
      colSpan: 1,
    },
    {
      id: "football-matches",
      type: "football",
      colSpan: 1,
    },
  ],
};
