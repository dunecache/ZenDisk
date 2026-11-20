import { useQuery } from "@tanstack/react-query";
import { fetchOrganization } from "@/lib/native/mock-organization";

export const organizationKeys = { all: ["organization"] as const };

/** Swap `fetchOrganization` for organizer.preview() when native lands. */
export function useOrganization() {
  return useQuery({
    queryKey: organizationKeys.all,
    queryFn: fetchOrganization,
    staleTime: 30_000,
  });
}
