import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, PageContainer, Section } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import { Button } from "@/components/ui";
import { EmptyState, SearchInput } from "@/components/data-display";

interface HelpTopic {
  id: string;
  question: string;
  answer: string;
  to?: string;
}

const topics: HelpTopic[] = [
  {
    id: "h1",
    question: "How do I free space safely?",
    answer: "Run a cleanup preview, review the exact files, then confirm. Removed files stay recoverable.",
    to: "/cleanup",
  },
  {
    id: "h2",
    question: "How do I find duplicate files?",
    answer: "Duplicate scans group files by size and content. Nothing is deleted automatically; removal goes through quarantine.",
    to: "/duplicates",
  },
  {
    id: "h3",
    question: "Can I stop scheduled actions?",
    answer: "Yes. Every task can be disabled in Automation at any time, and scheduled actions only quarantine or report.",
    to: "/automation",
  },
  {
    id: "h4",
    question: "Why does a metric say Not available?",
    answer: "The system does not expose that measurement. ZenDisk never substitutes a placeholder number for a real reading.",
    to: "/maintenance",
  },
  {
    id: "h5",
    question: "Where can I change the theme?",
    answer: "Open Settings → Appearance. Warm light and deep botanical dark are both fully supported.",
    to: "/settings",
  },
];

const shortcuts = [
  { keys: "Ctrl + K", action: "Global search" },
  { keys: "Ctrl + 1", action: "Overview" },
  { keys: "Ctrl + 2", action: "Disk analysis" },
  { keys: "Ctrl + F", action: "Search current view" },
  { keys: "Ctrl + ,", action: "Settings" },
  { keys: "Ctrl + R", action: "Refresh current view" },
  { keys: "Escape", action: "Close active dialog or menu" },
  { keys: "Delete", action: "Contextual delete, with confirmation" },
];

export function HelpScreen() {
  const [query, setQuery] = useState("");
  const filtered = topics.filter((topic) => {
    const text = query.trim().toLowerCase();
    return text === "" || `${topic.question} ${topic.answer}`.toLowerCase().includes(text);
  });

  return (
    <>
      <PageHeader
        title="Help"
        description="Answers to common questions and keyboard shortcuts."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "Help" }]}
      />
      <PageContainer>
        <div className="flex flex-col gap-[var(--space-6)]">
          <Section title="Common questions" description="Search the topics below.">
            <SearchInput value={query} onChange={setQuery} placeholder="Search help" />
            {filtered.length === 0 ? (
              <EmptyState
                heading="No matching help"
                description="Try a different word or browse all topics."
              />
            ) : (
              <div className="grid gap-[var(--space-3)] lg:grid-cols-2">
                {filtered.map((topic) => (
                  <Card key={topic.id} className="flex flex-col gap-[var(--space-2)]">
                    <h3 className="text-[length:var(--text-h3)] font-semibold">{topic.question}</h3>
                    <p className="text-[length:var(--text-body)] text-muted">{topic.answer}</p>
                    {topic.to && (
                      <Button asChild variant="outline" size="sm" className="self-start">
                        <Link to={topic.to}>Open</Link>
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Section>

          <Section title="Keyboard shortcuts" description="Shortcuts never override text editing when an input has focus.">
            <Card className="p-0">
              <dl>
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between gap-[var(--space-4)] border-b border-border px-[var(--space-5)] py-[var(--space-3)] last:border-0"
                  >
                    <dt className="text-[length:var(--text-body)]">{shortcut.action}</dt>
                    <dd className="text-mono text-[length:var(--text-small)] text-muted">
                      {shortcut.keys}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Section>
        </div>
      </PageContainer>
    </>
  );
}
