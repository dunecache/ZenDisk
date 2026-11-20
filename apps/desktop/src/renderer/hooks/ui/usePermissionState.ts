import { mockAccess } from "@/lib/native/mock-access";

export interface PermissionState {
  denied: boolean;
}

/** Phase 5 preview of the permission-denied state; Phase 6 replaces the source. */
export function usePermissionState(): PermissionState {
  return { denied: mockAccess() === "denied" };
}
