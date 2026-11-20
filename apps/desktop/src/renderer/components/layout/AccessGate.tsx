import type { ReactNode } from "react";
import { PageContainer } from "./PageContainer";
import { EmptyState, InlineAlert } from "@/components/data-display";
import { usePermissionState } from "@/hooks/ui";

export interface AccessGateProps {
  /** Name of the capability the screen needs, for the denied-state copy. */
  capability: string;
  children: ReactNode;
}

/**
 * Shared permission-denied state for screens whose native capability is not
 * yet connected. In the browser preview the state is reachable with
 * `?access=denied`; Phase 6 will feed real permission results into the hook.
 */
export function AccessGate({ capability, children }: AccessGateProps) {
  const { denied } = usePermissionState();
  if (!denied) return <>{children}</>;

  return (
    <PageContainer>
      <div className="flex flex-col gap-[var(--space-4)]">
        <InlineAlert variant="danger" title="Permission denied">
          ZenDisk was not granted access to {capability}. Nothing was read or changed.
        </InlineAlert>
        <EmptyState
          heading="Access required"
          description={`Allow ${capability} access in Windows settings, then refresh this screen.`}
        />
      </div>
    </PageContainer>
  );
}
