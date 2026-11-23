import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { QueryProvider, ThemeProvider } from "./providers";
import { AppRoutes } from "./router";
import { TooltipProvider } from "@/components/ui";
import { nativeApi } from "@/lib/native/client";
import { startPreferencePersistence } from "@/stores";

/**
 * Root application: theme + tooltip providers, router, and the AppShell
 * (sidebar / header / main / status bar) defined in router.tsx.
 */
export function App() {
  useEffect(() => {
    if (!nativeApi.app.isTauri()) return;
    return startPreferencePersistence();
  }, []);

  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider delayDuration={400}>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
