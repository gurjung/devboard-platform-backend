export interface SocketUser {
  userId: string;
  email: string;
  name: string;
}

export interface ClientToServerEvents {
  "join:project": (data: { projectId: string }) => void;
  "leave:project": (data: { projectId: string }) => void;
  "join:workspace": (data: { workspaceId: string }) => void;
  "leave:workspace": (data: { workspaceId: string }) => void;
}

export interface ServerToClientEvents {
  "task:created": (data: { task: any; actorId: string }) => void;
  "task:updated": (data: { task: any; actorId: string }) => void;
  "task:deleted": (data: { taskId: string; actorId: string }) => void;
  "task:assigned": (data: {
    task: any;
    assignedBy: { userId: string; email: string };
  }) => void;
  "project:presence": (data: {
    projectId: string;
    users: Array<{ userId: string; name: string; email: string }>;
  }) => void;
  "project:created": (data: { project: any; actorId: string }) => void;
  "project:updated": (data: { project: any; actorId: string }) => void;
  "project:deleted": (data: { projectId: string; actorId: string }) => void;
  "member:updated": (data: { member: any; actorId: string }) => void;
  "member:removed": (data: { memberId: string; actorId: string }) => void;
  "workspace:updated": (data: { workspace: any; actorId: string }) => void;
  "workspace:deleted": (data: { workspaceId: string; actorId: string }) => void;
  error: (data: { message: string }) => void;
}

export interface SocketData {
  user: SocketUser;
  activeProjects: Set<string>;
}
