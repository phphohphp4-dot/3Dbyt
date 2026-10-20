export type ProjectStatus = "pending" | "processing" | "completed";

export interface Project {
  id: string;
  slug: string;
  client_name: string;
  client_email: string;
  status: ProjectStatus;
  floor_plan_url: string;
  model_glb_url: string | null;
  created_at: string;
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  "pending",
  "processing",
  "completed",
];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  pending: "Čeká na zpracování",
  processing: "Zpracovává se",
  completed: "Hotovo",
};
