import { BrowserRouter } from "react-router-dom";
import { QueryProvider, ThemeProvider } from "./providers";
import { AppRoutes } from "./router";
import { TooltipProvider } from "@/components/ui";

/**
 * Root application: theme + tooltip providers, router, and the AppShell
 * (sidebar / header / main / status bar) defined in router.tsx.
 */
export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider delayDuration={400}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
