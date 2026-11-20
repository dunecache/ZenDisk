import { create } from "zustand";

export type ToastVariant = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Milliseconds before auto-dismiss. 0 keeps it until dismissed. */
  duration: number;
}

export interface ToastState {
  toasts: ToastItem[];
  toast: (item: Omit<ToastItem, "id" | "duration"> & { duration?: number }) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  toast: ({ duration = 5000, ...item }) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { ...item, id, duration }] }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** Convenience helper callable outside React components. */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().toast({ variant: "success", title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().toast({ variant: "info", title, description }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().toast({ variant: "warning", title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().toast({ variant: "error", title, description }),
};
