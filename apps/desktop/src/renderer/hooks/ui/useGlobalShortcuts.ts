import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export interface GlobalShortcutHandlers {
  /** Ctrl/Cmd + K — global search. */
  onGlobalSearch?: () => void;
  /** Ctrl/Cmd + F — search the current view. */
  onViewSearch?: () => void;
  /** Ctrl/Cmd + R — refresh the current view. */
  onRefresh?: () => void;
  /** Delete — contextual delete (with confirmation). */
  onDelete?: () => void;
}

const NAV_SHORTCUTS: Record<string, string> = {
  "1": "/overview",
  "2": "/disk-analysis",
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Registers the shortcuts from Spec.md §34 at the document level.
 * Shortcuts never override standard editing when an input has focus, except
 * Escape, which still closes transient UI via the dialog/menu primitives.
 */
export function useGlobalShortcuts(handlers: GlobalShortcutHandlers = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        handlers.onGlobalSearch?.();
        return;
      }

      if (mod && event.key === ",") {
        event.preventDefault();
        navigate("/settings");
        return;
      }

      if (isTypingTarget(event.target)) return;

      if (mod && NAV_SHORTCUTS[event.key]) {
        event.preventDefault();
        navigate(NAV_SHORTCUTS[event.key]);
        return;
      }

      if (mod && event.key.toLowerCase() === "f") {
        event.preventDefault();
        handlers.onViewSearch?.();
        return;
      }

      if (mod && event.key.toLowerCase() === "r") {
        event.preventDefault();
        handlers.onRefresh?.();
        return;
      }

      if (event.key === "Delete") {
        handlers.onDelete?.();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navigate, handlers]);
}
