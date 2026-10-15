export type User = {
  id: string;
  name: string;
  email: string;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  members: { role: "OWNER" | "ADMIN" | "MEMBER" }[];
  _count?: { projects: number; members: number };
};

export type Project = {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  workspaceId: string;
  _count?: { tasks: number };
};

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignee?: User | null;
};

export type Activity = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  actor: User;
};
