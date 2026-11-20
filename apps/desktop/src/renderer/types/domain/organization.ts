export interface OrganizeRule {
  id: string;
  name: string;
  source: string;
  conditions: string[];
  action: string;
  destination: string;
  exclusions: string[];
  schedule: string;
}

export interface ProposedChange {
  id: string;
  original: string;
  proposed: string;
  action: string;
  conflict: "none" | "exists" | "overlap";
}

export interface OrganizationData {
  rules: OrganizeRule[];
  changes: ProposedChange[];
}
