export interface DriveInfo {
  id: string;
  name: string;
  letter?: string;
  type?: string;
  filesystem?: string;
  capacity: number;
  free: number;
}

export interface ActivityEvent {
  id: string;
  kind: "scan" | "cleanup" | "organize" | "duplicates";
  title: string;
  detail: string;
  at: string;
}

export interface Recommendation {
  id: string;
  title: string;
  evidence: string;
  route: string;
  potentialBytes?: number;
}

export interface OverviewData {
  drives: DriveInfo[];
  activity: ActivityEvent[];
  recommendations: Recommendation[];
}
