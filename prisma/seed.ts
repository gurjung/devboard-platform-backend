import { PrismaClient, TaskPriority, TaskStatus, WorkspaceRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting DevBoard database seeding...");

  const defaultPassword = "Password123!";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 1. Seed Demo Users
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@devboard.com" },
    update: { password: hashedPassword, name: "Alex Vance (Owner)" },
    create: {
      name: "Alex Vance (Owner)",
      email: "owner@devboard.com",
      password: hashedPassword,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "sarah.lead@devboard.com" },
    update: { password: hashedPassword, name: "Sarah Connor (Admin)" },
    create: {
      name: "Sarah Connor (Admin)",
      email: "sarah.lead@devboard.com",
      password: hashedPassword,
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: "alex.dev@devboard.com" },
    update: { password: hashedPassword, name: "Marcus Wright (Member)" },
    create: {
      name: "Marcus Wright (Member)",
      email: "alex.dev@devboard.com",
      password: hashedPassword,
    },
  });

  console.log("✅ Seeded demo users: owner, admin, and member.");

  // 2. Seed Workspace
  const workspaceSlug = "devboard-hq";
  let workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "DevBoard HQ",
        slug: workspaceSlug,
      },
    });
  }

  // 3. Seed Workspace Memberships
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: ownerUser.id,
      },
    },
    update: { role: WorkspaceRole.OWNER },
    create: {
      workspaceId: workspace.id,
      userId: ownerUser.id,
      role: WorkspaceRole.OWNER,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: adminUser.id,
      },
    },
    update: { role: WorkspaceRole.ADMIN },
    create: {
      workspaceId: workspace.id,
      userId: adminUser.id,
      role: WorkspaceRole.ADMIN,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: memberUser.id,
      },
    },
    update: { role: WorkspaceRole.MEMBER },
    create: {
      workspaceId: workspace.id,
      userId: memberUser.id,
      role: WorkspaceRole.MEMBER,
    },
  });

  console.log("✅ Seeded workspace 'DevBoard HQ' and assigned roles.");

  // 4. Seed Projects
  const webProject = await prisma.project.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: "web-application-v2",
      },
    },
    update: { name: "Web Application v2" },
    create: {
      name: "Web Application v2",
      slug: "web-application-v2",
      workspaceId: workspace.id,
      createdById: ownerUser.id,
    },
  });

  const mobileProject = await prisma.project.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: "mobile-ios-android",
      },
    },
    update: { name: "Mobile iOS & Android" },
    create: {
      name: "Mobile iOS & Android",
      slug: "mobile-ios-android",
      workspaceId: workspace.id,
      createdById: ownerUser.id,
    },
  });

  console.log("✅ Seeded projects: 'Web Application v2' & 'Mobile iOS & Android'.");

  // 5. Seed Tasks
  // Clear previous demo tasks for these projects to ensure a clean, predictable state
  await prisma.task.deleteMany({
    where: {
      projectId: { in: [webProject.id, mobileProject.id] },
    },
  });

  const now = new Date();
  const pastOverdueDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  const futureDueDate3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // in 3 days
  const futureDueDate7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // in 7 days

  const sampleTasks = [
    // Web Application v2 Tasks
    {
      title: "Design System & CSS Tokens",
      description: "Build reusable UI foundation with CSS variables and responsive tokens.",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: null,
      projectId: webProject.id,
      assigneeId: adminUser.id,
      createdById: ownerUser.id,
    },
    {
      title: "Authentication RTR & Theft Detection",
      description: "Implement single-use refresh token rotation with nuclear replay revocation.",
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      dueDate: null,
      projectId: webProject.id,
      assigneeId: memberUser.id,
      createdById: ownerUser.id,
    },
    {
      title: "Kanban Drag-and-Drop Board",
      description: "Support fluid task column transitions using @dnd-kit and optimistic updates.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: futureDueDate3d,
      projectId: webProject.id,
      assigneeId: memberUser.id,
      createdById: adminUser.id,
    },
    {
      title: "Cursor Pagination on Task Table",
      description: "Implement O(log N) cursor-based infinite scroll querying for tasks.",
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDueDate3d,
      projectId: webProject.id,
      assigneeId: memberUser.id,
      createdById: ownerUser.id,
    },
    {
      title: "Dark Mode Theme Toggle",
      description: "System/dark/light theme support with CSS custom property transitions.",
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: futureDueDate7d,
      projectId: webProject.id,
      assigneeId: adminUser.id,
      createdById: adminUser.id,
    },
    {
      title: "Annual Security Audit & Penetration Test",
      description: "Verify rate limiting, helmet headers, and anti-enumeration protections.",
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      dueDate: pastOverdueDate, // Overdue task!
      projectId: webProject.id,
      assigneeId: ownerUser.id,
      createdById: ownerUser.id,
    },
    {
      title: "Interactive OpenAPI / Swagger Documentation",
      description: "Serve Swagger UI at /api-docs with Bearer token authorization.",
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.MEDIUM,
      dueDate: null,
      projectId: webProject.id,
      assigneeId: null,
      createdById: ownerUser.id,
    },

    // Mobile Project Tasks
    {
      title: "Push Notifications Setup",
      description: "Integrate Apple APNs and Firebase Cloud Messaging for instant task alerts.",
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.HIGH,
      dueDate: null,
      projectId: mobileProject.id,
      assigneeId: null,
      createdById: ownerUser.id,
    },
    {
      title: "Offline Task Sync with SQLite",
      description: "Local-first storage engine synchronizing changes when reconnected.",
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      dueDate: futureDueDate7d,
      projectId: mobileProject.id,
      assigneeId: memberUser.id,
      createdById: ownerUser.id,
    },
    {
      title: "Biometric FaceID / Fingerprint Authentication",
      description: "Secure local keychain storage for quick mobile app unlock.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDueDate3d,
      projectId: mobileProject.id,
      assigneeId: adminUser.id,
      createdById: adminUser.id,
    },
  ];

  for (const taskData of sampleTasks) {
    await prisma.task.create({ data: taskData });
  }

  console.log(`✅ Seeded ${sampleTasks.length} realistic tasks across projects.`);

  console.log("\n========================================================");
  console.log("   🎉 DEVBOARD SEEDING COMPLETE!");
  console.log("========================================================");
  console.log("Demo Credentials (all share password: Password123!):");
  console.log("  • Owner:  owner@devboard.com");
  console.log("  • Admin:  sarah.lead@devboard.com");
  console.log("  • Member: alex.dev@devboard.com");
  console.log("Workspace: DevBoard HQ (slug: devboard-hq)");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
