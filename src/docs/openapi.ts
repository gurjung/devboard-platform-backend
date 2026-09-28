export const openapiSpec = {
  openapi: "3.0.0",
  info: {
    title: "DevBoard REST API",
    version: "1.0.0",
    description:
      "Comprehensive REST API backend for DevBoard — a collaborative workspace, project, and task management platform.",
    contact: {
      name: "DevBoard Engineering",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current Server (Auto-detected)",
    },
    {
      url: "https://devboard-platform-backend.onrender.com",
      description: "Production Server (Render)",
    },
    {
      url: "http://localhost:5001",
      description: "Local Development Server",
    },
  ],
  tags: [
    { name: "System Health", description: "Health check and uptime monitoring" },
    { name: "Authentication", description: "User registration, JWT auth, and token rotation" },
    { name: "Workspaces", description: "Multi-tenant workspace management, stats, and personal tasks" },
    { name: "Workspace Members", description: "Member role assignments and collaboration" },
    { name: "Workspace Invites", description: "Cryptographic invite generation and acceptance" },
    { name: "Projects", description: "Workspace-scoped project management with custom slugs" },
    { name: "Tasks", description: "Core productivity engine: task CRUD and cursor pagination" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Standard JWT Access Token (15-min TTL). Provide as 'Bearer <token>'.",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "refreshToken",
        description: "HTTP-Only Refresh Token cookie (7-day TTL) for single-use token rotation.",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation successful" },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed or access denied" },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "string", example: "cmulgihxo0000gtwejl3erwb2" },
          name: { type: "string", example: "Alex Developer" },
          email: { type: "string", format: "email", example: "alex@example.com" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Workspace: {
        type: "object",
        properties: {
          id: { type: "string", example: "cmulgiknl000cgtwejqrvk2aj" },
          name: { type: "string", example: "Acme Corp" },
          slug: { type: "string", example: "acme-corp" },
          logo: { type: "string", nullable: true, example: "https://example.com/logo.png" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          role: { type: "string", enum: ["OWNER", "ADMIN", "MEMBER"], example: "OWNER" },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", example: "cmulginty000ogtweaotwcbs7" },
          name: { type: "string", example: "Mobile App Redesign" },
          slug: { type: "string", example: "mobile-app-redesign" },
          logo: { type: "string", nullable: true },
          workspaceId: { type: "string" },
          createdById: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string", example: "cmulgip0c000qgtwe7j5kjmn0" },
          title: { type: "string", example: "Implement OAuth2 Flow" },
          description: { type: "string", nullable: true, example: "Connect Google & GitHub OAuth" },
          status: { type: "string", enum: ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"], example: "IN_PROGRESS" },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], example: "HIGH" },
          dueDate: { type: "string", format: "date-time", nullable: true },
          projectId: { type: "string" },
          assigneeId: { type: "string", nullable: true },
          createdById: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          project: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              slug: { type: "string" },
            },
          },
          assignee: { $ref: "#/components/schemas/UserProfile" },
          createdBy: { $ref: "#/components/schemas/UserProfile" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System Health"],
        summary: "System health check",
        description: "Returns server status and uptime metrics.",
        responses: {
          200: {
            description: "Server is online",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                    uptime: { type: "number", example: 124.5 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register new user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Alex Developer" },
                  email: { type: "string", format: "email", example: "alex@example.com" },
                  password: { type: "string", format: "password", minLength: 8, example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Validation error or email already in use" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Authenticate user and issue tokens",
        description: "Returns 15-minute JWT access token and sets 7-day httpOnly refresh token cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "alex@example.com" },
                  password: { type: "string", format: "password", example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    data: {
                      type: "object",
                      properties: {
                        accessToken: { type: "string", example: "eyJhbGciOi..." },
                        user: { $ref: "#/components/schemas/UserProfile" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Single-use refresh token rotation",
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: "New access token and rotated refresh token issued" },
          401: { description: "Missing or invalid refresh token" },
          403: { description: "Reuse detected (all user sessions revoked for security)" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout user and revoke session",
        responses: {
          200: { description: "Session revoked and cookie cleared" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current logged-in user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "User profile returned" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/workspaces": {
      get: {
        tags: ["Workspaces"],
        summary: "List user workspaces",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of workspaces where user is a member" },
        },
      },
      post: {
        tags: ["Workspaces"],
        summary: "Create workspace",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Acme Corp" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Workspace created with creator assigned as OWNER" },
        },
      },
    },
    "/workspaces/{workspaceId}": {
      get: {
        tags: ["Workspaces"],
        summary: "Get workspace details",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Workspace details" },
          404: { description: "Workspace not found or access denied" },
        },
      },
      patch: {
        tags: ["Workspaces"],
        summary: "Update workspace name or logo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  logo: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Workspace updated" },
          403: { description: "Requires ADMIN or OWNER role" },
        },
      },
      delete: {
        tags: ["Workspaces"],
        summary: "Delete workspace",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Workspace deleted" },
          403: { description: "Only workspace OWNER can delete" },
        },
      },
    },
    "/workspaces/{workspaceId}/my-tasks": {
      get: {
        tags: ["Workspaces"],
        summary: "Cross-project tasks assigned to current user",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] } },
          { name: "overdue", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "cursor", in: "query", schema: { type: "string" } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: { description: "Paginated list of tasks across all workspace projects" },
        },
      },
    },
    "/workspaces/{workspaceId}/stats": {
      get: {
        tags: ["Workspaces"],
        summary: "Workspace home dashboard metrics",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Aggregated counts (projects, tasks, overdue, completed), recent tasks, and project breakdowns" },
        },
      },
    },
    "/workspaces/{workspaceId}/members": {
      get: {
        tags: ["Workspace Members"],
        summary: "List workspace members",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of members with roles" },
        },
      },
    },
    "/workspaces/{workspaceId}/members/{memberId}": {
      patch: {
        tags: ["Workspace Members"],
        summary: "Update member role",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "memberId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { type: "string", enum: ["ADMIN", "MEMBER"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Member role updated" },
          403: { description: "Insufficient permissions or owner protected" },
        },
      },
      delete: {
        tags: ["Workspace Members"],
        summary: "Remove member or self-leave",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "memberId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Member removed or left workspace" },
          400: { description: "Workspace owner cannot leave or be removed" },
        },
      },
    },
    "/workspaces/{workspaceId}/invites": {
      post: {
        tags: ["Workspace Invites"],
        summary: "Generate workspace invite link",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "role"],
                properties: {
                  email: { type: "string", format: "email" },
                  role: { type: "string", enum: ["ADMIN", "MEMBER"], default: "MEMBER" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Invite link and token created (7-day validity)" },
        },
      },
      get: {
        tags: ["Workspace Invites"],
        summary: "List pending workspace invites",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of active pending invitations" },
        },
      },
    },
    "/workspaces/{workspaceId}/invites/{inviteId}": {
      delete: {
        tags: ["Workspace Invites"],
        summary: "Revoke pending invite",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "inviteId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Invite successfully revoked" },
        },
      },
    },
    "/invites/{token}": {
      get: {
        tags: ["Workspace Invites"],
        summary: "Public invite preview",
        parameters: [
          { name: "token", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Public metadata for invitation (workspace name, inviter)" },
          404: { description: "Invalid, expired, or revoked token" },
        },
      },
    },
    "/invites/{token}/accept": {
      post: {
        tags: ["Workspace Invites"],
        summary: "Accept workspace invitation",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "token", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Invite accepted and membership atomically created" },
          400: { description: "User email does not match invite recipient email" },
        },
      },
    },
    "/workspaces/{workspaceId}/projects": {
      get: {
        tags: ["Projects"],
        summary: "List workspace projects",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of projects in workspace" },
        },
      },
      post: {
        tags: ["Projects"],
        summary: "Create project in workspace",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 50, example: "Marketing Site" },
                  logo: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Project created with auto-generated scoped slug" },
          403: { description: "Requires ADMIN or OWNER role" },
        },
      },
    },
    "/workspaces/{workspaceId}/projects/{projectId}": {
      get: {
        tags: ["Projects"],
        summary: "Get project details",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Project details" },
          404: { description: "Project not found" },
        },
      },
      patch: {
        tags: ["Projects"],
        summary: "Update project name or logo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  logo: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Project updated (slug remains immutable)" },
        },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete project and its tasks",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Project deleted with cascade task deletion" },
        },
      },
    },
    "/workspaces/{workspaceId}/projects/{projectId}/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "List project tasks with cursor pagination",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] } },
          { name: "assigneeId", in: "query", schema: { type: "string" }, description: "Specific user ID or 'null' for unassigned" },
          { name: "overdue", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "cursor", in: "query", schema: { type: "string" } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "Paginated task list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        tasks: { type: "array", items: { $ref: "#/components/schemas/Task" } },
                        nextCursor: { type: "string", nullable: true },
                        hasMore: { type: "boolean" },
                        totalCount: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Tasks"],
        summary: "Create task within project",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", minLength: 1, maxLength: 255 },
                  description: { type: "string", nullable: true },
                  status: { type: "string", enum: ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"], default: "BACKLOG" },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
                  dueDate: { type: "string", format: "date-time", nullable: true },
                  assigneeId: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Task created" },
          400: { description: "Assignee must be a member of this workspace" },
        },
      },
    },
    "/workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}": {
      get: {
        tags: ["Tasks"],
        summary: "Get task details",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "taskId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Task details with profiles" },
          404: { description: "Task not found" },
        },
      },
      patch: {
        tags: ["Tasks"],
        summary: "Update task",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "taskId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string", nullable: true },
                  status: { type: "string", enum: ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                  dueDate: { type: "string", format: "date-time", nullable: true },
                  assigneeId: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Task updated" },
          403: { description: "Only creator, assignee, or ADMIN/OWNER can update" },
        },
      },
      delete: {
        tags: ["Tasks"],
        summary: "Delete task",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "taskId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Task deleted" },
          403: { description: "Assignees cannot delete; requires creator or ADMIN/OWNER" },
        },
      },
    },
  },
};
