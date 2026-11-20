import type { OrganizationData } from "@/types";

export const organizationData: OrganizationData = {
  rules: [
    {
      id: "r1",
      name: "Downloads",
      source: "C:/Users/me/Downloads",
      conditions: ["Extension in: pdf, docx, xlsx"],
      action: "Move to folder",
      destination: "D:/Documents/{extension}",
      exclusions: ["*.part"],
      schedule: "Manual",
    },
    {
      id: "r2",
      name: "Photos by date",
      source: "C:/Users/me/Photos",
      conditions: ["Type is image"],
      action: "Move to folder",
      destination: "D:/Photos/{year}/{month}",
      exclusions: [],
      schedule: "Weekly",
    },
    {
      id: "r3",
      name: "Videos by date",
      source: "C:/Users/me/Videos",
      conditions: ["Type is video"],
      action: "Move to folder",
      destination: "D:/Videos/{year}",
      exclusions: [],
      schedule: "Monthly",
    },
  ],
  changes: [
    { id: "c1", original: "C:/Downloads/report.pdf", proposed: "D:/Documents/pdf/report.pdf", action: "Move", conflict: "none" },
    { id: "c2", original: "C:/Downloads/photo.png", proposed: "D:/Photos/2026/11/photo.png", action: "Move", conflict: "exists" },
    { id: "c3", original: "C:/Photos/vacation.jpg", proposed: "D:/Photos/2026/08/vacation.jpg", action: "Move", conflict: "none" },
    { id: "c4", original: "C:/Videos/clip.mp4", proposed: "D:/Videos/2026/clip.mp4", action: "Move", conflict: "overlap" },
  ],
};

export function fetchOrganization(): Promise<OrganizationData> {
  return new Promise((resolve) => setTimeout(() => resolve(organizationData), 250));
}
