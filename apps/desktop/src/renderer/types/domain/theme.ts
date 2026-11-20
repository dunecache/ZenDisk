/** User's theme preference. `system` follows the OS color scheme. */
export type ThemeMode = "light" | "dark" | "system";

/** The concrete theme applied to the document. */
export type ResolvedTheme = Exclude<ThemeMode, "system">;
