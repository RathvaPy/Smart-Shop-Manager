import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboardSummary() {
  return useQuery({
    queryKey: [api.dashboard.summary.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.summary.path);
      if (!res.ok) throw new Error("Failed to fetch dashboard summary");
      return api.dashboard.summary.responses[200].parse(await res.json());
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}
