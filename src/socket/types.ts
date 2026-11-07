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
  "project:presence": (data: {
    projectId: string;
    users: Array<{ userId: string; name: string; email: string }>;
  }) => void;
  error: (data: { message: string }) => void;
}

export interface SocketData {
  user: SocketUser;
  activeProjects: Set<string>;
}
