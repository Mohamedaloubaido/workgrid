import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type { Activity, Project, Task, TaskPriority, TaskStatus, User, Workspace } from "./types";

const columns: { id: TaskStatus; label: string; hint: string }[] = [
  { id: "TODO", label: "To do", hint: "Ready to start" },
  { id: "IN_PROGRESS", label: "In progress", hint: "Actively being built" },
  { id: "IN_REVIEW", label: "In review", hint: "Waiting for validation" },
  { id: "DONE", label: "Done", hint: "Completed work" }
];

const priorityRank: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

function formatAction(value: string) {
  return value.replaceAll(".", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@workgrid.dev");
  const [password, setPassword] = useState("DemoPass123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = mode === "login"
        ? await api.login(email, password)
        : await api.register(name, email, password);
      onAuthenticated(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <div className="brand-mark">WG</div>
        <div>
          <p className="eyebrow">PROJECT MANAGEMENT / ENGINEERING DEMO</p>
          <h1>Plan work.<br />Move it forward.</h1>
          <p className="auth-lead">A multi-tenant project workspace backed by real authentication, role-based access, relational data and an auditable task workflow.</p>
        </div>
        <div className="auth-proof">
          <span>Fastify API</span><span>PostgreSQL</span><span>RBAC</span><span>Audit log</span>
        </div>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-card-head">
            <span className="mini-logo">W</span>
            <div>
              <strong>{mode === "login" ? "Welcome back" : "Create your account"}</strong>
              <p>{mode === "login" ? "Enter the workspace." : "Start a new Workgrid workspace."}</p>
            </div>
          </div>

          {mode === "register" && (
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mohammed Al-Obaido" required /></label>
          )}
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>

          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" disabled={loading}>{loading ? "Working…" : mode === "login" ? "Sign in" : "Create account"}</button>

          <button className="text-button" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Need an account? Register" : "Already registered? Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function WorkspaceModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: (workspace: Workspace) => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const workspace = await api.createWorkspace(token, { name, slug });
      onCreated({ ...workspace, members: [{ role: "OWNER" }] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create workspace");
    }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-head"><div><p className="eyebrow">NEW WORKSPACE</p><h2>Create a team boundary</h2></div><button type="button" onClick={onClose}>×</button></div>
      <label>Name<input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} placeholder="Product Team" required /></label>
      <label>Slug<input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="product-team" required /></label>
      {error && <div className="form-error">{error}</div>}
      <button className="primary-button">Create workspace</button>
    </form>
  </div>;
}

function ProjectModal({ token, workspaceId, onClose, onCreated }: { token: string; workspaceId: string; onClose: () => void; onCreated: (project: Project) => void }) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const project = await api.createProject(token, workspaceId, { name, key, description: description || undefined });
      onCreated(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-head"><div><p className="eyebrow">NEW PROJECT</p><h2>Define the workstream</h2></div><button type="button" onClick={onClose}>×</button></div>
      <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Website Redesign" required /></label>
      <label>Project key<input value={key} maxLength={8} onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="WEB" required /></label>
      <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this project needs to achieve." /></label>
      {error && <div className="form-error">{error}</div>}
      <button className="primary-button">Create project</button>
    </form>
  </div>;
}

function TaskModal({ token, projectId, onClose, onCreated }: { token: string; projectId: string; onClose: () => void; onCreated: (task: Task) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const task = await api.createTask(token, projectId, { title, description: description || undefined, priority });
      onCreated(task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task");
    }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-head"><div><p className="eyebrow">NEW TASK</p><h2>Add a deliverable</h2></div><button type="button" onClick={onClose}>×</button></div>
      <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Implement workspace permissions" required /></label>
      <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Acceptance criteria, context or notes." /></label>
      <label>Priority<select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></select></label>
      {error && <div className="form-error">{error}</div>}
      <button className="primary-button">Create task</button>
    </form>
  </div>;
}

function Dashboard({ token, user, onLogout }: { token: string; user: User; onLogout: () => void }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"workspace" | "project" | "task" | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const workspace = workspaces.find((item) => item.id === workspaceId);
  const project = projects.find((item) => item.id === projectId);
  const role = workspace?.members?.[0]?.role ?? "MEMBER";
  const canCreateProject = role === "OWNER" || role === "ADMIN";

  useEffect(() => {
    api.workspaces(token)
      .then((items) => {
        setWorkspaces(items);
        if (items[0]) setWorkspaceId(items[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!workspaceId) { setProjects([]); setProjectId(""); setActivity([]); return; }
    Promise.all([api.projects(token, workspaceId), api.activity(token, workspaceId)])
      .then(([projectItems, activityItems]) => {
        setProjects(projectItems);
        setProjectId((current) => projectItems.some((item) => item.id === current) ? current : projectItems[0]?.id ?? "");
        setActivity(activityItems);
      })
      .catch((err) => setError(err.message));
  }, [token, workspaceId]);

  useEffect(() => {
    if (!projectId) { setTasks([]); return; }
    api.tasks(token, projectId).then(setTasks).catch((err) => setError(err.message));
  }, [token, projectId]);

  const grouped = useMemo(() => {
    return Object.fromEntries(columns.map((column) => [column.id, tasks.filter((task) => task.status === column.id).sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority])])) as Record<TaskStatus, Task[]>;
  }, [tasks]);

  async function moveTask(taskId: string, status: TaskStatus) {
    const previous = tasks;
    setTasks((items) => items.map((task) => task.id === taskId ? { ...task, status } : task));
    try {
      const updated = await api.updateTask(token, taskId, { status });
      setTasks((items) => items.map((task) => task.id === taskId ? updated : task));
      if (workspaceId) setActivity(await api.activity(token, workspaceId));
    } catch (err) {
      setTasks(previous);
      setError(err instanceof Error ? err.message : "Could not move task");
    }
  }

  if (loading) return <main className="loading-screen"><div className="loader-logo">WG</div><span>Loading workspace…</span></main>;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-brand"><span>W</span><strong>Workgrid</strong></div>
      <div className="sidebar-label">WORKSPACES</div>
      <div className="workspace-list">
        {workspaces.map((item) => <button className={item.id === workspaceId ? "active" : ""} key={item.id} onClick={() => setWorkspaceId(item.id)}><span>{item.name.slice(0, 1).toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.members?.[0]?.role?.toLowerCase()}</small></div></button>)}
        <button className="add-workspace" onClick={() => setModal("workspace")}><span>+</span><div><strong>New workspace</strong><small>Create boundary</small></div></button>
      </div>
      <div className="sidebar-bottom">
        <div className="user-chip"><span>{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div>
        <button onClick={onLogout}>Sign out</button>
      </div>
    </aside>

    <section className="workspace-shell">
      <header className="topbar">
        <div><p className="eyebrow">{workspace ? `${workspace.name.toUpperCase()} / PROJECTS` : "WORKSPACE"}</p><h1>{project?.name ?? (workspace ? "Select a project" : "Create your first workspace")}</h1></div>
        <div className="topbar-actions">
          {workspace && <span className="role-pill">{role}</span>}
          {project && <button className="primary-button compact" onClick={() => setModal("task")}>+ New task</button>}
        </div>
      </header>

      {error && <div className="global-error">{error}<button onClick={() => setError("")}>×</button></div>}

      {!workspace ? <section className="empty-state"><span className="empty-index">00</span><h2>No workspace yet.</h2><p>Create a workspace to establish the first tenant boundary, then add projects and tasks inside it.</p><button className="primary-button" onClick={() => setModal("workspace")}>Create workspace</button></section> : <>
        <nav className="project-tabs">
          <div className="project-tab-scroll">
            {projects.map((item) => <button className={item.id === projectId ? "active" : ""} key={item.id} onClick={() => setProjectId(item.id)}><span>{item.key}</span>{item.name}<small>{item._count?.tasks ?? 0}</small></button>)}
          </div>
          {canCreateProject && <button className="new-project" onClick={() => setModal("project")}>+ Project</button>}
        </nav>

        {!project ? <section className="empty-state project-empty"><span className="empty-index">01</span><h2>Workspace ready.</h2><p>Create the first project. Owners and admins can add projects; members work inside the projects they can access.</p>{canCreateProject && <button className="primary-button" onClick={() => setModal("project")}>Create project</button>}</section> : <div className="board-layout">
          <section className="board-area">
            <div className="project-summary">
              <div><span>PROJECT KEY</span><strong>{project.key}</strong></div>
              <div><span>TASKS</span><strong>{tasks.length}</strong></div>
              <div><span>DONE</span><strong>{tasks.filter((task) => task.status === "DONE").length}</strong></div>
              <div><span>COMPLETION</span><strong>{tasks.length ? Math.round(tasks.filter((task) => task.status === "DONE").length / tasks.length * 100) : 0}%</strong></div>
            </div>

            <div className="kanban">
              {columns.map((column) => <section className="kanban-column" key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedTaskId) void moveTask(draggedTaskId, column.id); setDraggedTaskId(null); }}>
                <div className="column-head"><div><span className={`status-dot ${column.id.toLowerCase()}`} /><strong>{column.label}</strong><small>{grouped[column.id].length}</small></div><p>{column.hint}</p></div>
                <div className="task-stack">
                  {grouped[column.id].map((task) => <article className="task-card" key={task.id} draggable onDragStart={() => setDraggedTaskId(task.id)} onDragEnd={() => setDraggedTaskId(null)}>
                    <div className="task-card-top"><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><span className="drag-handle">⠿</span></div>
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-card-foot"><span>{project.key}-{task.id.slice(-4).toUpperCase()}</span>{task.assignee ? <b>{task.assignee.name.slice(0, 1)}</b> : <b className="unassigned">—</b>}</div>
                  </article>)}
                  {grouped[column.id].length === 0 && <div className="drop-zone">Drop a task here</div>}
                </div>
              </section>)}
            </div>
          </section>

          <aside className="activity-panel">
            <div className="activity-head"><div><p className="eyebrow">AUDIT TRAIL</p><h2>Recent activity</h2></div><span>{activity.length}</span></div>
            <div className="activity-list">
              {activity.map((item) => <article key={item.id}><span className="activity-node" /><div><strong>{formatAction(item.action)}</strong><p>{item.actor.name} · {item.entityType}</p><small>{new Date(item.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</small></div></article>)}
              {!activity.length && <p className="muted">No activity yet. Changes made in this workspace will appear here.</p>}
            </div>
          </aside>
        </div>}
      </>}
    </section>

    {modal === "workspace" && <WorkspaceModal token={token} onClose={() => setModal(null)} onCreated={(created) => { setWorkspaces((items) => [created, ...items]); setWorkspaceId(created.id); setModal(null); }} />}
    {modal === "project" && workspace && <ProjectModal token={token} workspaceId={workspace.id} onClose={() => setModal(null)} onCreated={(created) => { setProjects((items) => [{ ...created, _count: { tasks: 0 } }, ...items]); setProjectId(created.id); setModal(null); }} />}
    {modal === "task" && project && <TaskModal token={token} projectId={project.id} onClose={() => setModal(null)} onCreated={(created) => { setTasks((items) => [created, ...items]); setModal(null); }} />}
  </main>;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("workgrid_token") ?? "");
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(Boolean(token));

  useEffect(() => {
    if (!token) { setChecking(false); return; }
    api.me(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("workgrid_token");
        setToken("");
      })
      .finally(() => setChecking(false));
  }, [token]);

  if (checking) return <main className="loading-screen"><div className="loader-logo">WG</div><span>Verifying session…</span></main>;
  if (!token || !user) return <AuthScreen onAuthenticated={(nextToken, nextUser) => { localStorage.setItem("workgrid_token", nextToken); setToken(nextToken); setUser(nextUser); }} />;
  return <Dashboard token={token} user={user} onLogout={() => { localStorage.removeItem("workgrid_token"); setToken(""); setUser(null); }} />;
}
