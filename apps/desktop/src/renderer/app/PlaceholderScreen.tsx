import { PageContainer, Section } from "@/components/layout";
import { PageHeader, type Breadcrumb } from "@/components/navigation";

export interface PlaceholderScreenProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
}

/** Temporary screen body until each feature is implemented in Phase 3/4. */
export function PlaceholderScreen({
  title,
  description,
  breadcrumbs,
}: PlaceholderScreenProps) {
  return (
    <>
      <PageHeader
        title={title}
        description={description ?? "This screen is scaffolded and will be implemented in a later phase."}
        breadcrumbs={breadcrumbs}
      />
      <PageContainer>
        <Section title={title} description="Feature implementation pending.">
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-[var(--space-8)] text-[length:var(--text-body)] text-muted">
            Content for this screen lands in an upcoming phase.
          </div>
        </Section>
      </PageContainer>
    </>
  );
}
