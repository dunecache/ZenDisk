import type { DuplicatesData } from "@/types";

const MB = 1024 ** 2;
const hash = "sha256:9f2a…c41b";

export const duplicatesData: DuplicatesData = {
  groups: [
    {
      id: "g1",
      kind: "exact",
      hash,
      files: [
        { id: "g1-1", name: "photo_001.jpg", path: "C:/Users/me/Photos", sizeBytes: 2.4 * MB, modifiedAt: new Date(Date.now() - 86400000 * 12).toISOString(), hash },
        { id: "g1-2", name: "photo_001.jpg", path: "D:/Backup/Photos", sizeBytes: 2.4 * MB, modifiedAt: new Date(Date.now() - 86400000 * 40).toISOString(), hash },
        { id: "g1-3", name: "photo_001 - Copy.jpg", path: "E:/Photos", sizeBytes: 2.4 * MB, modifiedAt: new Date(Date.now() - 86400000 * 3).toISOString(), hash },
      ],
    },
    {
      id: "g2",
      kind: "exact",
      hash: "sha256:77bd…019a",
      files: [
        { id: "g2-1", name: "report_final.pdf", path: "C:/Users/me/Documents", sizeBytes: 840 * 1024, modifiedAt: new Date(Date.now() - 86400000 * 5).toISOString(), hash: "sha256:77bd…019a" },
        { id: "g2-2", name: "report_final.pdf", path: "D:/Archive", sizeBytes: 840 * 1024, modifiedAt: new Date(Date.now() - 86400000 * 30).toISOString(), hash: "sha256:77bd…019a" },
      ],
    },
  ],
};

export function fetchDuplicates(): Promise<DuplicatesData> {
  return new Promise((resolve) => setTimeout(() => resolve(duplicatesData), 300));
}
