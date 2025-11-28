import { getDashboardConfig } from "@/config/dashboard";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";

// Force dynamic rendering to ensure environment variables are read at runtime in Docker
export const dynamic = 'force-dynamic';

// This is a Server Component by default
export default function Home() {
  // Fetch config at request time on the server
  const dashboardConfig = getDashboardConfig();

  return (
    <main className="min-h-screen bg-background flex flex-col w-full max-w-full overflow-x-hidden">
      <DashboardGrid dashboardConfig={dashboardConfig} />
    </main>
  );
}
