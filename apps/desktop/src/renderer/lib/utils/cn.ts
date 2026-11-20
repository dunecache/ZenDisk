import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, letting caller classes win over defaults. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
