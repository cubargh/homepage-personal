import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";
import type { BeszelMetrics } from "@/types";
import PocketBase from "pocketbase";

async function createPocketBaseClient(
  url: string,
  auth: { type: "token" | "email"; token?: string; email?: string; password?: string }
): Promise<PocketBase> {
  const pb = new PocketBase(url);

  if (auth.type === "token" && auth.token) {
    // Set the auth token directly
    // The SDK will use this token for all requests
    // If invalid, the actual request will fail and we'll handle the error
    pb.authStore.save(auth.token, {
      id: "",
      email: "",
      username: "",
      verified: false,
      created: "",
      updated: "",
      collectionId: "",
      collectionName: "users",
    });
  } else if (auth.type === "email" && auth.email && auth.password) {
    // Authenticate with email and password
    try {
      await pb.collection("users").authWithPassword(auth.email, auth.password);
    } catch (error) {
      throw new ApiError(
        "PocketBase authentication failed",
        401,
        ApiErrorCode.UNAUTHORIZED,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  } else {
    throw new ApiError(
      "Invalid authentication configuration",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  return pb;
}

function parseBeszelMetrics(record: Record<string, unknown>, configServerName?: string, networkInterface?: string): BeszelMetrics {
  // Use config server_name if provided, otherwise extract from record
  let systemName: string | undefined = configServerName;
  
  if (!systemName) {
    // Fall back to extracting from record
    if (record.system && typeof record.system === "object") {
      systemName = (record.system as Record<string, unknown>).name as string;
    } else {
      systemName = (record.system as string) || (record.name as string) || undefined;
    }
  }
  
  const metrics: BeszelMetrics = {
    server_name: systemName,
    last_updated: (record.updated as string) || undefined,
  };

  // Parse uptime from expand.system.info.u (if system relation is expanded)
  if (record.expand && typeof record.expand === "object") {
    const expand = record.expand as Record<string, unknown>;
    if (expand.system && typeof expand.system === "object") {
      const system = expand.system as Record<string, unknown>;
      if (system.info && typeof system.info === "object") {
        const info = system.info as Record<string, unknown>;
        if (typeof info.u === "number") {
          metrics.uptime = info.u; // uptime in seconds
        }
      }
    }
  }

  // system_stats has data in a "stats" field on the record
  let data: Record<string, unknown>;
  
  // Check for stats field first (this is where the actual metrics are)
  if (record.stats && typeof record.stats === "object") {
    data = record.stats as Record<string, unknown>;
  } else if (record.data && typeof record.data === "object") {
    data = record.data as Record<string, unknown>;
  } else if (record.info && typeof record.info === "object") {
    data = record.info as Record<string, unknown>;
  } else {
    // Fall back to record itself
    data = record as Record<string, unknown>;
  }

  if (!data || Object.keys(data).length === 0) {
    return metrics;
  }

  // Parse CPU (cpu = CPU usage percentage)
  if (typeof data.cpu === "number") {
    metrics.cpu = data.cpu;
  }

  // Parse memory
  // m = memory total in GB, mu = memory used in GB, mp = memory percentage
  const memoryTotal = typeof data.m === "number" ? data.m * 1024 * 1024 * 1024 : 0; // Convert GB to bytes
  const memoryUsed = typeof data.mu === "number" ? data.mu * 1024 * 1024 * 1024 : 0; // Convert GB to bytes
  const memoryPercentage = typeof data.mp === "number" ? data.mp : 
                          (memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0);

  if (memoryPercentage > 0 || memoryUsed > 0 || memoryTotal > 0) {
    metrics.memory = {
      used: memoryUsed,
      total: memoryTotal,
      percentage: memoryPercentage,
    };
  }

  // Parse disk from efs object
  // efs structure: { "mount_point": { "d": total_GB, "du": used_GB, ... } }
  if (data.efs && typeof data.efs === "object") {
    const efs = data.efs as Record<string, unknown>;
    metrics.disk = Object.entries(efs).map(([name, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const diskInfo = value as Record<string, unknown>;
        // d = total in GB, du = used in GB
        const totalGB = typeof diskInfo.d === "number" ? diskInfo.d : 0;
        const usedGB = typeof diskInfo.du === "number" ? diskInfo.du : 0;
        const total = totalGB * 1024 * 1024 * 1024; // Convert GB to bytes
        const used = usedGB * 1024 * 1024 * 1024; // Convert GB to bytes
        const percentage = totalGB > 0 ? (usedGB / totalGB) * 100 : 0;
        
        return {
          name: name,
          used: used,
          total: total,
          percentage: percentage,
        };
      }
      return null;
    }).filter((disk): disk is NonNullable<typeof disk> => disk !== null);
  }

  // Parse network
  // b = bandwidth array [sent_bytes_per_sec, received_bytes_per_sec] (bytes per second)
  // ns = network sent, nr = network received (might be rates)
  // ni = network interfaces with detailed stats
  // ni structure: { "interface_name": [rx_packets, tx_packets, rx_bytes, tx_bytes] }
  let bytesSent = 0;
  let bytesRecv = 0;
  let speedSent: number | undefined;
  let speedRecv: number | undefined;

  // Get total bytes from network interfaces (ni)
  // Each interface array: [rx_packets, tx_packets, rx_bytes, tx_bytes]
  if (data.ni && typeof data.ni === "object") {
    const ni = data.ni as Record<string, unknown>;
    
    if (networkInterface && networkInterface in ni) {
      // Use only the specified network interface
      const iface = ni[networkInterface];
      if (Array.isArray(iface) && iface.length >= 4) {
        // Index 2 = rx_bytes, index 3 = tx_bytes
        bytesRecv = typeof iface[2] === "number" ? iface[2] : 0;
        bytesSent = typeof iface[3] === "number" ? iface[3] : 0;
      }
    } else {
      // Sum all interfaces if no specific interface is configured
      Object.values(ni).forEach((iface) => {
        if (Array.isArray(iface) && iface.length >= 4) {
          // Index 2 = rx_bytes, index 3 = tx_bytes
          bytesRecv += (typeof iface[2] === "number" ? iface[2] : 0);
          bytesSent += (typeof iface[3] === "number" ? iface[3] : 0);
        }
      });
    }
  }

  // Get bandwidth speeds from b array [sent_bytes_per_sec, received_bytes_per_sec]
  // The b array values are already in bytes per second (not kilobits)
  // Note: The b array appears to be total across all interfaces
  if (Array.isArray(data.b) && data.b.length >= 2) {
    // Values are already in bytes/sec, no conversion needed
    speedSent = typeof data.b[0] === "number" ? data.b[0] : undefined;
    speedRecv = typeof data.b[1] === "number" ? data.b[1] : undefined;
  }
  
  // Note: The b array represents total bandwidth across all interfaces
  // If a specific network interface is configured, the bytes totals will be filtered
  // but the speeds (b array) will still show total speeds across all interfaces

  if (bytesSent > 0 || bytesRecv > 0 || speedSent !== undefined || speedRecv !== undefined) {
    metrics.network = {
      bytes_sent: bytesSent,
      bytes_recv: bytesRecv,
      speed_sent: speedSent,
      speed_recv: speedRecv,
    };
  }

  // Parse temperature - get average or max from t object
  if (data.t && typeof data.t === "object") {
    const temps = data.t as Record<string, unknown>;
    const tempValues: number[] = [];
    Object.values(temps).forEach((temp) => {
      if (typeof temp === "number") {
        tempValues.push(temp);
      }
    });
    if (tempValues.length > 0) {
      // Use maximum temperature or average
      metrics.temperature = Math.max(...tempValues);
    }
  }

  // Parse load average from la array [1m, 5m, 15m]
  if (Array.isArray(data.la) && data.la.length >= 3) {
    metrics.load = {
      load1: typeof data.la[0] === "number" ? data.la[0] : 0,
      load5: typeof data.la[1] === "number" ? data.la[1] : 0,
      load15: typeof data.la[2] === "number" ? data.la[2] : 0,
    };
  }

  return metrics;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const config = loadConfig();
  const beszelConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.beszel),
    "Beszel configuration missing or disabled"
  );

  // Check for debug query parameter
  const debug = request.nextUrl.searchParams.get("debug") === "true";

  if (!beszelConfig.url) {
    throw new ApiError(
      "Beszel URL required",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  const { url, auth, server_name, network_interface } = beszelConfig;
  // Use system_stats collection which has more detailed information
  const collection = "system_stats";

  // Validate URL format
  let baseUrl: string;
  try {
    const urlObj = new URL(url);
    baseUrl = `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    throw new ApiError("Invalid URL format", 400, ApiErrorCode.VALIDATION_ERROR);
  }

  // Create PocketBase client with authentication
  let pb: PocketBase;
  try {
    pb = await createPocketBaseClient(baseUrl, auth);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Failed to connect to PocketBase",
      500,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  // Fetch records using PocketBase SDK
  try {
    let latestRecord: Record<string, unknown>;
    
    if (server_name) {
      // Use getList with filter and sort to get the latest record for this server
      // Try system.name filter first (if system is a relation)
      try {
        const records = await pb.collection(collection).getList(1, 1, {
          filter: `system.name="${server_name}"`,
          sort: "-created",
          expand: "system",
        });
        
        if (records.items && records.items.length > 0) {
          latestRecord = records.items[0] as unknown as Record<string, unknown>;
        } else {
          throw new Error("No records found");
        }
      } catch {
        // If that fails, try with different filter format or get all and filter
        try {
          const records = await pb.collection(collection).getList(1, 1, {
            filter: `system="${server_name}"`,
            sort: "-created",
            expand: "system",
          });
          
          if (records.items && records.items.length > 0) {
            latestRecord = records.items[0] as unknown as Record<string, unknown>;
          } else {
            throw new Error("No records found");
          }
        } catch {
          // Last resort: get all, sort, and filter manually to get the latest
          const allRecords = await pb.collection(collection).getFullList({
            sort: "-created",
            expand: "system",
          });
          
          // Filter by server name and get the latest (first after sorting)
          const matchingRecords = allRecords.filter((record) => {
            const system = record.system;
            if (typeof system === "object" && system !== null) {
              return (system as Record<string, unknown>).name === server_name;
            }
            return system === server_name || record.name === server_name;
          });
          
          if (matchingRecords.length === 0) {
            throw new ApiError(
              `Server "${server_name}" not found in system_stats`,
              404,
              ApiErrorCode.NOT_FOUND
            );
          }
          
          // Get the latest record (first after sorting by -created)
          latestRecord = matchingRecords[0] as unknown as Record<string, unknown>;
        }
      }
    } else {
      // No server filter - get the latest record using getList
      const records = await pb.collection(collection).getList(1, 1, {
        sort: "-created",
        expand: "system",
      });
      
      if (!records.items || records.items.length === 0) {
        throw new ApiError(
          "No server records found",
          404,
          ApiErrorCode.NOT_FOUND
        );
      }
      
      latestRecord = records.items[0] as unknown as Record<string, unknown>;
    }
    
    
    // If debug mode, return raw record structure
    if (debug) {
      return NextResponse.json({
        raw: latestRecord,
        parsed: parseBeszelMetrics(latestRecord, server_name, network_interface),
        hasCpu: typeof latestRecord.cpu !== "undefined",
        hasMemory: typeof latestRecord.m !== "undefined",
        hasDisk: typeof latestRecord.efs !== "undefined",
      });
    }
    
    const metrics = parseBeszelMetrics(latestRecord, server_name, network_interface);
    
    // Check if we got any data
    if (!metrics.cpu && !metrics.memory && !metrics.disk && !metrics.network) {
      console.warn("Beszel API: No metrics parsed from record", {
        recordKeys: Object.keys(latestRecord),
        hasCpu: typeof latestRecord.cpu !== "undefined",
        hasMemory: typeof latestRecord.m !== "undefined",
        hasDisk: typeof latestRecord.efs !== "undefined",
      });
    }

    return NextResponse.json(metrics);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle PocketBase SDK errors
    // PocketBase SDK throws ClientResponseError which has status property
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      if (status === 401) {
        throw new ApiError(
          "Unauthorized - Check authentication credentials",
          401,
          ApiErrorCode.UNAUTHORIZED
        );
      }
      if (status === 403) {
        throw new ApiError(
          "Forbidden - Check collection permissions",
          403,
          ApiErrorCode.FORBIDDEN
        );
      }
      if (status === 404) {
        throw new ApiError(
          "Collection not found",
          404,
          ApiErrorCode.NOT_FOUND
        );
      }
    }
    
    // Handle generic errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes("401") || message.includes("unauthorized")) {
        throw new ApiError(
          "Unauthorized - Check authentication credentials",
          401,
          ApiErrorCode.UNAUTHORIZED
        );
      }
      if (message.includes("403") || message.includes("forbidden")) {
        throw new ApiError(
          "Forbidden - Check collection permissions",
          403,
          ApiErrorCode.FORBIDDEN
        );
      }
      if (message.includes("404") || message.includes("not found")) {
        throw new ApiError(
          "Collection not found",
          404,
          ApiErrorCode.NOT_FOUND
        );
      }
      throw new ApiError(
        "Failed to fetch server data",
        500,
        ApiErrorCode.UPSTREAM_ERROR,
        error.message
      );
    }
    
    throw new ApiError(
      "Failed to fetch server data",
      500,
      ApiErrorCode.UPSTREAM_ERROR
    );
  }
});
