import { create } from "zustand";
import type { OperationRecord } from "@/types";

export interface OperationHistoryState {
  records: OperationRecord[];
  add: (record: OperationRecord) => void;
}

export const useOperationHistory = create<OperationHistoryState>((set) => ({
  records: [],
  add: (record) =>
    set((state) => ({ records: [record, ...state.records].slice(0, 200) })),
}));
