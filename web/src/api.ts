import type { Activity, Project, Task, TaskPriority, TaskStatus, User, Workspace } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? `Request failed (${response.status})`);
  }

  return response.json();
}

export const api = {
  login(email: string, password: string) {
    return request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  register(name: string, email: string, password: string) {
    return request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
  },
  me(token: string) {
    return request<User>("/auth/me", {}, token);
  },
  workspaces(token: string) {
    return request<Workspace[]>("/workspaces", {}, token);
  },
  createWorkspace(token: string, input: { name: string; slug: string }) {
    return request<Workspace>("/workspaces", { method: "POST", body: JSON.stringify(input) }, token);
  },
  projects(token: string, workspaceId: string) {
    return request<Project[]>(`/workspaces/${workspaceId}/projects`, {}, token);
  },
  createProject(token: string, workspaceId: string, input: { name: string; key: string; description?: string }) {
    return request<Project>(`/workspaces/${workspaceId}/projects`, { method: "POST", body: JSON.stringify(input) }, token);
  },
  tasks(token: string, projectId: string) {
    return request<Task[]>(`/projects/${projectId}/tasks`, {}, token);
  },
  createTask(token: string, projectId: string, input: { title: string; description?: string; priority: TaskPriority }) {
    return request<Task>(`/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(input) }, token);
  },
  updateTask(token: string, taskId: string, input: Partial<{ status: TaskStatus; priority: TaskPriority; title: string }>) {
    return request<Task>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(input) }, token);
  },
  activity(token: string, workspaceId: string) {
    return request<Activity[]>(`/workspaces/${workspaceId}/activity`, {}, token);
  }
};
