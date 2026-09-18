import type { WorkspaceData } from "../types";

const now = new Date();
const isoDay = (offset: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const isoTime = (offset: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - offset);
  date.setHours(10, 30, 0, 0);
  return date.toISOString();
};

export const DEMO_ORGANIZATION_ID = "org_creative_crew_demo";
export const DEMO_PASSWORD = "demo123";

export const seedData: WorkspaceData = {
  users: [
    {
      id: "u_director",
      organizationId: DEMO_ORGANIZATION_ID,
      name: "Neeraj Kumar",
      email: "director@creative-crew.local",
      role: "director",
      title: "Creative Director",
      initials: "NK",
      active: true,
      status: "active",
      projectIds: ["p_launch", "p_lms", "p_brand", "p_growth"],
      permissions: ["workspace:read", "people:read", "people:write", "clients:read", "clients:write", "projects:read", "projects:write", "tasks:read", "tasks:write", "finance:read", "finance:write", "reports:read", "attendance:read", "attendance:write", "approvals:read", "approvals:write", "files:read", "files:write", "settings:read", "settings:write", "audit:read"],
    },
    {
      id: "u_manager",
      organizationId: DEMO_ORGANIZATION_ID,
      name: "Aarav Mehta",
      email: "manager@creative-crew.local",
      role: "manager",
      title: "Delivery Manager",
      initials: "AM",
      active: true,
      status: "active",
      departmentId: "dep_studio",
      projectIds: ["p_launch", "p_lms", "p_brand"],
      permissions: ["workspace:read", "people:read", "clients:read", "clients:write", "projects:read", "projects:write", "tasks:read", "tasks:write", "reports:read", "attendance:read", "approvals:read", "approvals:write", "files:read", "files:write"],
    },
    {
      id: "u_lead",
      organizationId: DEMO_ORGANIZATION_ID,
      name: "Ishita Sharma",
      email: "lead@creative-crew.local",
      role: "team_leader",
      title: "Design Team Lead",
      initials: "IS",
      active: true,
      status: "active",
      departmentId: "dep_studio",
      teamId: "team_design",
      managerId: "u_manager",
      projectIds: ["p_launch", "p_lms"],
      permissions: ["workspace:read", "people:read", "clients:read", "projects:read", "projects:write", "tasks:read", "tasks:write", "reports:read", "attendance:read", "attendance:write", "approvals:read", "approvals:write", "files:read", "files:write"],
    },
    {
      id: "u_employee",
      organizationId: DEMO_ORGANIZATION_ID,
      name: "Rohan Verma",
      email: "employee@creative-crew.local",
      role: "employee",
      title: "Product Designer",
      initials: "RV",
      active: true,
      status: "active",
      departmentId: "dep_studio",
      teamId: "team_design",
      managerId: "u_manager",
      teamLeadId: "u_lead",
      projectIds: ["p_launch", "p_lms"],
      permissions: ["workspace:read", "projects:read", "tasks:read", "tasks:write", "attendance:read", "attendance:write", "files:read", "files:write"],
    },
    {
      id: "u_employee2",
      organizationId: DEMO_ORGANIZATION_ID,
      name: "Maya Patel",
      email: "maya@creative-crew.local",
      role: "employee",
      title: "Frontend Engineer",
      initials: "MP",
      active: true,
      status: "active",
      departmentId: "dep_studio",
      teamId: "team_dev",
      managerId: "u_manager",
      projectIds: ["p_lms", "p_growth"],
      permissions: ["workspace:read", "projects:read", "tasks:read", "tasks:write", "attendance:read", "attendance:write", "files:read", "files:write"],
    },
    {
      id: "u_client",
      organizationId: DEMO_ORGANIZATION_ID,
      name: "Sana Kapoor",
      email: "client@creative-crew.local",
      role: "client",
      title: "Client Partner",
      initials: "SK",
      active: true,
      status: "active",
      clientId: "c_aster",
      projectIds: ["p_launch"],
      permissions: ["workspace:read", "projects:read", "tasks:read", "files:read", "approvals:read", "approvals:write"],
    },
  ],
  departments: [
    { id: "dep_studio", organizationId: DEMO_ORGANIZATION_ID, name: "Creative Studio", leadId: "u_manager", memberCount: 4, projectIds: ["p_launch", "p_lms", "p_brand"], color: "blue", archived: false },
    { id: "dep_growth", organizationId: DEMO_ORGANIZATION_ID, name: "Growth & Strategy", leadId: "u_manager", memberCount: 2, projectIds: ["p_growth"], color: "violet", archived: false },
    { id: "dep_ops", organizationId: DEMO_ORGANIZATION_ID, name: "Operations", leadId: "u_director", memberCount: 1, projectIds: [], color: "amber", archived: false },
  ],
  teams: [
    { id: "team_design", organizationId: DEMO_ORGANIZATION_ID, name: "Design Systems", departmentId: "dep_studio", leadId: "u_lead", memberIds: ["u_lead", "u_employee"], projectIds: ["p_launch", "p_lms"], color: "cyan", archived: false },
    { id: "team_dev", organizationId: DEMO_ORGANIZATION_ID, name: "Build & QA", departmentId: "dep_studio", leadId: "u_manager", memberIds: ["u_employee2"], projectIds: ["p_lms"], color: "green", archived: false },
    { id: "team_growth", organizationId: DEMO_ORGANIZATION_ID, name: "Growth Lab", departmentId: "dep_growth", leadId: "u_manager", memberIds: ["u_manager"], projectIds: ["p_growth"], color: "violet", archived: false },
  ],
  clients: [
    { id: "c_aster", organizationId: DEMO_ORGANIZATION_ID, name: "Sana Kapoor", company: "Aster Labs", email: "sana@asterlabs.example", phone: "+91 98765 10203", industry: "SaaS", city: "Bengaluru", country: "India", status: "Active", paymentStatus: "Paid", managerId: "u_manager", teamLeadId: "u_lead", projectIds: ["p_launch"], budget: 185000, lastActivity: isoTime(1), attentionRequired: false, portalAccess: true, notes: "Quarterly launch partner", initials: "AK", archived: false, createdAt: isoTime(18), updatedAt: isoTime(1) },
    { id: "c_northstar", organizationId: DEMO_ORGANIZATION_ID, name: "Vikram Rao", company: "Northstar Studio", email: "vikram@northstar.example", phone: "+91 98989 12441", industry: "Media", city: "Mumbai", country: "India", status: "Onboarding", paymentStatus: "Due soon", managerId: "u_manager", teamLeadId: "u_lead", projectIds: ["p_brand"], budget: 96000, lastActivity: isoTime(3), attentionRequired: true, portalAccess: true, notes: "Needs brand kickoff confirmation", initials: "NS", archived: false, createdAt: isoTime(9), updatedAt: isoTime(3) },
    { id: "c_verdant", organizationId: DEMO_ORGANIZATION_ID, name: "Meera Shah", company: "Verdant Foods", email: "meera@verdant.example", phone: "+91 98211 88331", industry: "Consumer", city: "Pune", country: "India", status: "At risk", paymentStatus: "Overdue", managerId: "u_manager", projectIds: ["p_lms"], budget: 240000, lastActivity: isoTime(7), attentionRequired: true, portalAccess: false, notes: "Invoice and scope review needed", initials: "VF", archived: false, createdAt: isoTime(24), updatedAt: isoTime(7) },
    { id: "c_orbit", organizationId: DEMO_ORGANIZATION_ID, name: "Arjun Malhotra", company: "Orbit Learning", email: "arjun@orbit.example", phone: "+91 97654 39812", industry: "Education", city: "Hyderabad", country: "India", status: "Active", paymentStatus: "Paid", managerId: "u_manager", projectIds: ["p_growth"], budget: 132000, lastActivity: isoTime(5), attentionRequired: false, portalAccess: true, notes: "Expansion opportunity in Q4", initials: "OL", archived: false, createdAt: isoTime(42), updatedAt: isoTime(5) },
  ],
  projects: [
    { id: "p_launch", organizationId: DEMO_ORGANIZATION_ID, name: "Aster product launch", clientId: "c_aster", ownerId: "u_manager", managerId: "u_manager", teamLeadId: "u_lead", departmentId: "dep_studio", teamId: "team_design", memberIds: ["u_lead", "u_employee"], status: "Active", priority: "High", health: "On track", startDate: isoDay(-18), dueDate: isoDay(12), budget: 185000, spend: 108000, progress: 68, description: "Launch system, campaign creative and conversion pages for the new product release.", milestoneCount: 6, archived: false, createdAt: isoTime(18), updatedAt: isoTime(1) },
    { id: "p_lms", organizationId: DEMO_ORGANIZATION_ID, name: "Learning platform refresh", clientId: "c_verdant", ownerId: "u_manager", managerId: "u_manager", teamLeadId: "u_lead", departmentId: "dep_studio", teamId: "team_dev", memberIds: ["u_lead", "u_employee", "u_employee2"], status: "Active", priority: "Urgent", health: "At risk", startDate: isoDay(-28), dueDate: isoDay(5), budget: 240000, spend: 208000, progress: 82, description: "Responsive LMS experience with clearer discovery, onboarding and learning flows.", milestoneCount: 8, archived: false, createdAt: isoTime(28), updatedAt: isoTime(2) },
    { id: "p_brand", organizationId: DEMO_ORGANIZATION_ID, name: "Northstar brand system", clientId: "c_northstar", ownerId: "u_manager", managerId: "u_manager", teamLeadId: "u_lead", departmentId: "dep_studio", teamId: "team_design", memberIds: ["u_lead", "u_employee"], status: "Planning", priority: "Medium", health: "On track", startDate: isoDay(-2), dueDate: isoDay(22), budget: 96000, spend: 12000, progress: 18, description: "A flexible identity toolkit for a growing media studio.", milestoneCount: 4, archived: false, createdAt: isoTime(9), updatedAt: isoTime(3) },
    { id: "p_growth", organizationId: DEMO_ORGANIZATION_ID, name: "Orbit growth sprint", clientId: "c_orbit", ownerId: "u_manager", managerId: "u_manager", departmentId: "dep_growth", teamId: "team_growth", memberIds: ["u_manager", "u_employee2"], status: "Completed", priority: "Low", health: "Completed", startDate: isoDay(-45), dueDate: isoDay(-6), budget: 132000, spend: 125000, progress: 100, description: "A focused acquisition and content sprint across priority channels.", milestoneCount: 5, archived: false, createdAt: isoTime(42), updatedAt: isoTime(5) },
    { id: "p_internal", organizationId: DEMO_ORGANIZATION_ID, name: "creative-crew operating system", ownerId: "u_director", managerId: "u_manager", departmentId: "dep_ops", memberIds: ["u_director", "u_manager"], status: "Active", priority: "Medium", health: "On track", startDate: isoDay(-12), dueDate: isoDay(30), budget: 0, spend: 0, progress: 42, description: "Internal systems, rituals and workspace improvements.", milestoneCount: 3, archived: false, createdAt: isoTime(12), updatedAt: isoTime(2) },
  ],
  tasks: [
    { id: "t_hero", organizationId: DEMO_ORGANIZATION_ID, title: "Approve product launch hero direction", description: "Review the final hero options and select the direction for production.", status: "In Review", priority: "Urgent", projectId: "p_launch", clientId: "c_aster", assigneeId: "u_lead", watcherIds: ["u_manager"], tags: ["review", "launch"], dueDate: isoDay(1), estimateHours: 3, trackedHours: 2, checklistTotal: 3, checklistDone: 2, visibility: "client-safe", createdBy: "u_manager", updatedBy: "u_lead", archived: false, createdAt: isoTime(2), updatedAt: isoTime(0) },
    { id: "t_case-study", organizationId: DEMO_ORGANIZATION_ID, title: "Write launch case study outline", description: "Turn discovery notes into a concise case study structure.", status: "In Progress", priority: "High", projectId: "p_launch", clientId: "c_aster", assigneeId: "u_employee", watcherIds: ["u_lead"], tags: ["content"], dueDate: isoDay(4), estimateHours: 6, trackedHours: 3, checklistTotal: 4, checklistDone: 1, visibility: "client-safe", createdBy: "u_lead", updatedBy: "u_employee", archived: false, createdAt: isoTime(3), updatedAt: isoTime(1) },
    { id: "t_lms-audit", organizationId: DEMO_ORGANIZATION_ID, title: "Audit mobile onboarding flow", description: "Check the first-session experience at 320px, 375px and 768px.", status: "In Progress", priority: "High", projectId: "p_lms", clientId: "c_verdant", assigneeId: "u_employee2", watcherIds: ["u_lead"], tags: ["mobile", "qa"], dueDate: isoDay(2), estimateHours: 8, trackedHours: 5, checklistTotal: 6, checklistDone: 4, visibility: "internal", createdBy: "u_manager", updatedBy: "u_employee2", archived: false, createdAt: isoTime(4), updatedAt: isoTime(0) },
    { id: "t_nav", organizationId: DEMO_ORGANIZATION_ID, title: "Polish workspace navigation states", description: "Make active, hover and collapsed navigation states feel consistent.", status: "Completed", priority: "Medium", projectId: "p_internal", assigneeId: "u_employee", watcherIds: [], tags: ["ui", "system"], dueDate: isoDay(-2), estimateHours: 5, trackedHours: 5, checklistTotal: 3, checklistDone: 3, visibility: "internal", createdBy: "u_director", updatedBy: "u_employee", archived: false, createdAt: isoTime(6), updatedAt: isoTime(2) },
    { id: "t_invoice", organizationId: DEMO_ORGANIZATION_ID, title: "Follow up on Verdant invoice", description: "Coordinate with finance and the account owner on the overdue invoice.", status: "Backlog", priority: "High", projectId: "p_lms", clientId: "c_verdant", assigneeId: "u_manager", watcherIds: [], tags: ["finance", "attention"], dueDate: isoDay(-1), estimateHours: 2, trackedHours: 0, checklistTotal: 2, checklistDone: 0, visibility: "internal", createdBy: "u_director", updatedBy: "u_manager", archived: false, createdAt: isoTime(5), updatedAt: isoTime(4) },
    { id: "t_brand", organizationId: DEMO_ORGANIZATION_ID, title: "Prepare Northstar kickoff board", description: "Create an agenda, reference board and discovery checklist.", status: "Backlog", priority: "Medium", projectId: "p_brand", clientId: "c_northstar", assigneeId: "u_lead", watcherIds: [], tags: ["kickoff"], dueDate: isoDay(9), estimateHours: 4, trackedHours: 0, checklistTotal: 4, checklistDone: 0, visibility: "client-safe", createdBy: "u_manager", updatedBy: "u_manager", archived: false, createdAt: isoTime(3), updatedAt: isoTime(3) },
    { id: "t_report", organizationId: DEMO_ORGANIZATION_ID, title: "Publish sprint performance recap", description: "Summarize outcomes, learnings and next actions for the growth sprint.", status: "Completed", priority: "Low", projectId: "p_growth", clientId: "c_orbit", assigneeId: "u_employee2", watcherIds: [], tags: ["report"], dueDate: isoDay(-5), estimateHours: 3, trackedHours: 3, checklistTotal: 2, checklistDone: 2, visibility: "client-safe", createdBy: "u_manager", updatedBy: "u_employee2", archived: false, createdAt: isoTime(9), updatedAt: isoTime(5) },
    { id: "t_milestone", organizationId: DEMO_ORGANIZATION_ID, title: "Confirm final launch milestone dates", description: "Align production, QA and handover dates with the client timeline.", status: "In Review", priority: "Medium", projectId: "p_launch", clientId: "c_aster", assigneeId: "u_manager", watcherIds: ["u_lead"], tags: ["planning"], dueDate: isoDay(6), estimateHours: 2, trackedHours: 1, checklistTotal: 2, checklistDone: 1, visibility: "client-safe", createdBy: "u_director", updatedBy: "u_manager", archived: false, createdAt: isoTime(2), updatedAt: isoTime(1) },
    { id: "t_docs", organizationId: DEMO_ORGANIZATION_ID, title: "Document design handoff checklist", description: "Capture the repeatable handoff steps for the studio knowledge base.", status: "In Progress", priority: "Low", projectId: "p_internal", assigneeId: "u_employee", watcherIds: [], tags: ["docs"], dueDate: isoDay(12), estimateHours: 3, trackedHours: 1, checklistTotal: 5, checklistDone: 2, visibility: "internal", createdBy: "u_director", updatedBy: "u_employee", archived: false, createdAt: isoTime(2), updatedAt: isoTime(0) },
    { id: "t_client-feedback", organizationId: DEMO_ORGANIZATION_ID, title: "Review client feedback notes", description: "Group feedback into action items before the next review.", status: "Backlog", priority: "Medium", projectId: "p_lms", clientId: "c_verdant", assigneeId: "u_lead", watcherIds: [], tags: ["feedback"], dueDate: isoDay(7), estimateHours: 4, trackedHours: 0, checklistTotal: 3, checklistDone: 0, visibility: "client-safe", createdBy: "u_manager", updatedBy: "u_lead", archived: false, createdAt: isoTime(1), updatedAt: isoTime(1) },
  ],
  activities: [
    { id: "a_1", organizationId: DEMO_ORGANIZATION_ID, actorId: "u_manager", actorName: "Aarav Mehta", action: "created a new project", entityType: "Project", entityId: "p_brand", createdAt: isoTime(1) },
    { id: "a_2", organizationId: DEMO_ORGANIZATION_ID, actorId: "u_lead", actorName: "Ishita Sharma", action: "moved a task to In Review", entityType: "Task", entityId: "t_hero", createdAt: isoTime(0) },
    { id: "a_3", organizationId: DEMO_ORGANIZATION_ID, actorId: "u_director", actorName: "Neeraj Kumar", action: "updated the Verdant Foods account", entityType: "Client", entityId: "c_verdant", createdAt: isoTime(2) },
    { id: "a_4", organizationId: DEMO_ORGANIZATION_ID, actorId: "u_employee2", actorName: "Maya Patel", action: "completed a sprint recap", entityType: "Task", entityId: "t_report", createdAt: isoTime(5) },
    { id: "a_5", organizationId: DEMO_ORGANIZATION_ID, actorId: "u_employee", actorName: "Rohan Verma", action: "uploaded a design handoff file", entityType: "File", createdAt: isoTime(1) },
    { id: "a_6", organizationId: DEMO_ORGANIZATION_ID, actorId: "u_manager", actorName: "Aarav Mehta", action: "requested approval for milestone dates", entityType: "Approval", createdAt: isoTime(3) },
    { id: "a_7", organizationId: DEMO_ORGANIZATION_ID, actorId: "u_director", actorName: "Neeraj Kumar", action: "added a new team member", entityType: "People", createdAt: isoTime(6) },
    { id: "a_8", organizationId: DEMO_ORGANIZATION_ID, actorId: "u_lead", actorName: "Ishita Sharma", action: "commented on mobile onboarding", entityType: "Task", entityId: "t_lms-audit", createdAt: isoTime(0) },
  ],
  approvals: [
    { id: "ap_1", organizationId: DEMO_ORGANIZATION_ID, title: "Aster launch hero direction", type: "Deliverable", status: "Pending", requesterId: "u_lead", reviewerId: "u_manager", projectId: "p_launch", dueDate: isoDay(1), comment: "Ready for delivery review", createdAt: isoTime(1), updatedAt: isoTime(0) },
    { id: "ap_2", organizationId: DEMO_ORGANIZATION_ID, title: "Verdant scope change", type: "Change request", status: "Changes requested", requesterId: "u_manager", reviewerId: "u_director", projectId: "p_lms", dueDate: isoDay(3), comment: "Add implementation estimate", createdAt: isoTime(4), updatedAt: isoTime(2) },
    { id: "ap_3", organizationId: DEMO_ORGANIZATION_ID, title: "Design equipment request", type: "Finance", status: "Approved", requesterId: "u_employee", reviewerId: "u_manager", amount: 38000, createdAt: isoTime(8), updatedAt: isoTime(6) },
  ],
  requests: [
    { id: "r_1", organizationId: DEMO_ORGANIZATION_ID, title: "Leave request — Friday", type: "Leave", status: "Pending", requesterId: "u_employee", reviewerId: "u_lead", createdAt: isoTime(1) },
    { id: "r_2", organizationId: DEMO_ORGANIZATION_ID, title: "New monitor for QA desk", type: "Equipment", status: "Approved", requesterId: "u_employee2", reviewerId: "u_manager", createdAt: isoTime(9) },
  ],
  attendance: [
    { id: "att_1", organizationId: DEMO_ORGANIZATION_ID, userId: "u_director", date: isoDay(0), status: "Present", checkIn: "09:12", hours: 7.4 },
    { id: "att_2", organizationId: DEMO_ORGANIZATION_ID, userId: "u_manager", date: isoDay(0), status: "Present", checkIn: "09:05", hours: 7.8 },
    { id: "att_3", organizationId: DEMO_ORGANIZATION_ID, userId: "u_lead", date: isoDay(0), status: "Remote", checkIn: "09:28", hours: 7.1 },
    { id: "att_4", organizationId: DEMO_ORGANIZATION_ID, userId: "u_employee", date: isoDay(0), status: "Present", checkIn: "09:42", hours: 6.9 },
    { id: "att_5", organizationId: DEMO_ORGANIZATION_ID, userId: "u_employee2", date: isoDay(0), status: "Present", checkIn: "09:18", hours: 7.6 },
  ],
  files: [
    { id: "f_1", organizationId: DEMO_ORGANIZATION_ID, name: "Aster-launch-brief.pdf", mimeType: "application/pdf", sizeBytes: 2480000, uploaderId: "u_manager", projectId: "p_launch", clientId: "c_aster", visibility: "client-safe", archived: false, createdAt: isoTime(2) },
    { id: "f_2", organizationId: DEMO_ORGANIZATION_ID, name: "Mobile-audit-notes.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", sizeBytes: 840000, uploaderId: "u_employee2", projectId: "p_lms", clientId: "c_verdant", visibility: "internal", archived: false, createdAt: isoTime(0) },
    { id: "f_3", organizationId: DEMO_ORGANIZATION_ID, name: "Northstar-reference-board.fig", mimeType: "application/octet-stream", sizeBytes: 12400000, uploaderId: "u_lead", projectId: "p_brand", clientId: "c_northstar", visibility: "client-safe", archived: false, createdAt: isoTime(3) },
  ],
  docs: [
    { id: "d_1", organizationId: DEMO_ORGANIZATION_ID, title: "Studio handoff playbook", excerpt: "The repeatable checklist for moving approved work from design into build.", authorId: "u_director", visibility: "internal", updatedAt: isoTime(2), archived: false },
    { id: "d_2", organizationId: DEMO_ORGANIZATION_ID, title: "Client review rhythm", excerpt: "A simple format for making weekly feedback loops calm and actionable.", authorId: "u_manager", projectId: "p_launch", visibility: "client-safe", updatedAt: isoTime(1), archived: false },
  ],
  finance: [
    { id: "fin_1", organizationId: DEMO_ORGANIZATION_ID, title: "Aster launch budget", type: "Budget", clientId: "c_aster", projectId: "p_launch", amount: 185000, status: "Approved", dueDate: isoDay(12), createdAt: isoTime(18) },
    { id: "fin_2", organizationId: DEMO_ORGANIZATION_ID, title: "Verdant Foods invoice #104", type: "Invoice", clientId: "c_verdant", projectId: "p_lms", amount: 72000, status: "Overdue", dueDate: isoDay(-4), createdAt: isoTime(18) },
    { id: "fin_3", organizationId: DEMO_ORGANIZATION_ID, title: "Research contractor expense", type: "Expense", projectId: "p_lms", amount: 18000, status: "Paid", createdAt: isoTime(10) },
    { id: "fin_4", organizationId: DEMO_ORGANIZATION_ID, title: "Orbit growth payment", type: "Payment", clientId: "c_orbit", projectId: "p_growth", amount: 132000, status: "Paid", createdAt: isoTime(5) },
  ],
  goals: [
    { id: "g_1", organizationId: DEMO_ORGANIZATION_ID, title: "Improve on-time delivery", scope: "Organization", ownerId: "u_director", progress: 74, dueDate: isoDay(30), status: "On track" },
    { id: "g_2", organizationId: DEMO_ORGANIZATION_ID, title: "Ship launch system v1", scope: "Project", ownerId: "u_lead", progress: 68, dueDate: isoDay(12), status: "On track" },
    { id: "g_3", organizationId: DEMO_ORGANIZATION_ID, title: "Reduce QA rework", scope: "Team", ownerId: "u_employee2", progress: 46, dueDate: isoDay(20), status: "At risk" },
  ],
  notifications: [
    { id: "n_1", organizationId: DEMO_ORGANIZATION_ID, userId: "u_director", title: "Verdant Foods needs attention", body: "The invoice is overdue and the account owner has been notified.", type: "deadline", read: false, createdAt: isoTime(1), entityType: "Client", entityId: "c_verdant" },
    { id: "n_2", organizationId: DEMO_ORGANIZATION_ID, userId: "u_manager", title: "Approval ready for review", body: "Aster launch hero direction is waiting in Approvals.", type: "approval", read: false, createdAt: isoTime(0), entityType: "Approval", entityId: "ap_1" },
    { id: "n_3", organizationId: DEMO_ORGANIZATION_ID, userId: "u_employee", title: "You were assigned a task", body: "Write launch case study outline is due soon.", type: "assignment", read: false, createdAt: isoTime(1), entityType: "Task", entityId: "t_case-study" },
    { id: "n_4", organizationId: DEMO_ORGANIZATION_ID, userId: "u_client", title: "A new milestone is ready", body: "The launch milestone dates are ready for your review.", type: "approval", read: true, createdAt: isoTime(2), entityType: "Project", entityId: "p_launch" },
  ],
};

export const cloneSeed = (): WorkspaceData => JSON.parse(JSON.stringify(seedData)) as WorkspaceData;

export const demoCredentials = [
  { email: "director@creative-crew.local", role: "Director" },
  { email: "manager@creative-crew.local", role: "Manager" },
  { email: "lead@creative-crew.local", role: "Team Lead" },
  { email: "employee@creative-crew.local", role: "Employee" },
  { email: "client@creative-crew.local", role: "Client" },
];
