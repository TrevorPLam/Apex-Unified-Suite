import { addDays, subDays } from "date-fns";

const today = new Date();

export const metrics = [
  { id: "rev", label: "Revenue MTD", value: "$124,500", trend: "+12.5%", isPositive: true },
  { id: "proj", label: "Active Projects", value: "34", trend: "+2", isPositive: true },
  { id: "leads", label: "Open Leads", value: "128", trend: "-5", isPositive: false },
  { id: "tasks", label: "Overdue Tasks", value: "12", trend: "-2", isPositive: true }
];

export const activities = [
  { id: 1, type: "deal_won", title: "Deal Closed: Acme Corp", time: subDays(today, 0).toISOString(), user: "Sarah J." },
  { id: 2, type: "doc_signed", title: "Contract Signed: Nexus Tech", time: subDays(today, 1).toISOString(), user: "Mike R." },
  { id: 3, type: "payment_received", title: "Payment Received: $15,000", time: subDays(today, 1).toISOString(), user: "System" },
  { id: 4, type: "task_completed", title: "Phase 1 Deliverables", time: subDays(today, 2).toISOString(), user: "Alex T." },
  { id: 5, type: "deal_won", title: "New Lead: GlobalNet", time: subDays(today, 2).toISOString(), user: "Emma D." }
];

export const deadlines = [
  { id: 1, item: "Acme Corp Q3 Report", date: addDays(today, 2).toISOString(), assignee: "Sarah J.", status: "At Risk" },
  { id: 2, item: "Nexus API Integration", date: addDays(today, 3).toISOString(), assignee: "Mike R.", status: "On Track" },
  { id: 3, item: "Q4 Tax Filing", date: addDays(today, 5).toISOString(), assignee: "Alex T.", status: "On Track" },
  { id: 4, item: "TechFlow Strategy", date: addDays(today, 7).toISOString(), assignee: "Emma D.", status: "On Track" }
];

export const crmLeads = {
  new: [
    { id: "l1", name: "John Smith", company: "TechFlow", value: "$45k", source: "Website" },
    { id: "l2", name: "Emma Davis", company: "DataSync", value: "$120k", source: "Referral" },
    { id: "l5", name: "Robert Fox", company: "Aero Logistics", value: "$95k", source: "Conference" }
  ],
  contacted: [
    { id: "l3", name: "Michael Chen", company: "CloudBase", value: "$80k", source: "Outbound" },
    { id: "l6", name: "Lisa Wong", company: "OmniTech", value: "$55k", source: "Referral" }
  ],
  qualified: [
    { id: "l4", name: "Sarah Wilson", company: "Apex Systems", value: "$250k", source: "Partner" },
    { id: "l7", name: "James Miller", company: "Core Industries", value: "$180k", source: "Website" }
  ]
};

export const crmContacts = [
  { id: "c1", name: "Alice Johnson", company: "Acme Corp", email: "alice@acme.com", lastContact: subDays(today, 2).toISOString(), status: "Active" },
  { id: "c2", name: "Bob Smith", company: "Nexus Tech", email: "bob@nexus.tech", lastContact: subDays(today, 5).toISOString(), status: "Inactive" },
  { id: "c3", name: "Charlie Davis", company: "GlobalNet", email: "charlie@globalnet.io", lastContact: subDays(today, 1).toISOString(), status: "Hot" }
];

export const projectsData = {
  tasks: [
    { id: "t1", content: "Design System V2", status: "focus", project: "Acme Corp", dueDate: addDays(today, 1).toISOString() },
    { id: "t2", content: "API Authentication", status: "this_week", project: "Nexus Tech", dueDate: addDays(today, 3).toISOString() },
    { id: "t3", content: "Database Migration", status: "later", project: "GlobalNet", dueDate: addDays(today, 10).toISOString() }
  ],
  board: {
    backlog: [{ id: "b1", title: "User Settings", priority: "Low" }, { id: "b2", title: "Export to PDF", priority: "Medium" }],
    in_progress: [{ id: "b3", title: "Dashboard Redesign", priority: "High" }],
    review: [{ id: "b4", title: "Payment Gateway", priority: "High" }],
    done: [{ id: "b5", title: "Onboarding Flow", priority: "Medium" }]
  },
  projects: [
    { id: "p1", name: "Platform Migration", client: "Acme Corp", status: "In Progress", progress: 65, dueDate: addDays(today, 14).toISOString() },
    { id: "p2", name: "Mobile App V2", client: "Nexus Tech", status: "Planning", progress: 15, dueDate: addDays(today, 45).toISOString() },
    { id: "p3", name: "Security Audit", client: "GlobalNet", status: "Review", progress: 90, dueDate: addDays(today, 5).toISOString() }
  ]
};

export const documentsData = {
  repository: [
    { id: "d1", name: "Q3_Financial_Report.pdf", type: "pdf", size: "2.4 MB", modified: subDays(today, 2).toISOString() },
    { id: "d2", name: "Employee_Handbook_2023.docx", type: "word", size: "1.1 MB", modified: subDays(today, 15).toISOString() },
    { id: "d3", name: "Acme_Contract_Draft.pdf", type: "pdf", size: "4.8 MB", modified: subDays(today, 1).toISOString() }
  ],
  esign: [
    { id: "e1", doc: "NDA_NexusTech.pdf", signers: "Bob Smith", status: "Sent", sent: subDays(today, 1).toISOString() },
    { id: "e2", doc: "Consulting_Agreement.pdf", signers: "Alice Johnson", status: "Signed", sent: subDays(today, 5).toISOString() },
    { id: "e3", doc: "Project_SOW.pdf", signers: "Charlie Davis", status: "Viewed", sent: subDays(today, 0).toISOString() }
  ]
};

export const financeData = {
  ap: [
    { id: "ap1", vendor: "AWS", amount: "$3,450.00", dueDate: addDays(today, 5).toISOString(), status: "Pending" },
    { id: "ap2", vendor: "Slack", amount: "$850.00", dueDate: addDays(today, 10).toISOString(), status: "Approved" },
    { id: "ap3", vendor: "Office Supplies Inc", amount: "$245.50", dueDate: subDays(today, 2).toISOString(), status: "Overdue" }
  ],
  ar: [
    { id: "ar1", customer: "Acme Corp", amount: "$15,000.00", status: "Sent", dueDate: addDays(today, 15).toISOString() },
    { id: "ar2", customer: "GlobalNet", amount: "$45,000.00", status: "Paid", dueDate: subDays(today, 5).toISOString() },
    { id: "ar3", customer: "Nexus Tech", amount: "$8,500.00", status: "Draft", dueDate: addDays(today, 30).toISOString() }
  ],
  spend: [
    { id: "s1", dept: "Engineering", budget: 100000, actual: 85000 },
    { id: "s2", dept: "Marketing", budget: 50000, actual: 52000 },
    { id: "s3", dept: "Sales", budget: 75000, actual: 40000 }
  ]
};

export const assetsData = [
  { id: "a1", name: "MacBook Pro 16\"", category: "Hardware", location: "SF Office", status: "Assigned", serial: "C02DG543MD6R" },
  { id: "a2", name: "Dell UltraSharp 32\"", category: "Peripherals", location: "NY Office", status: "Available", serial: "CN-0XX123-74261" },
  { id: "a3", name: "Herman Miller Aeron", category: "Furniture", location: "SF Office", status: "Assigned", serial: "HM-88219" }
];

export const portalClients = [
  { id: "c1", name: "Acme Corp", status: "Active", portalEnabled: true, lastActivity: subDays(today, 1).toISOString() },
  { id: "c2", name: "Nexus Tech", status: "Active", portalEnabled: true, lastActivity: subDays(today, 3).toISOString() },
  { id: "c3", name: "GlobalNet", status: "Inactive", portalEnabled: false, lastActivity: subDays(today, 30).toISOString() }
];

export const settingsUsers = [
  { id: "u1", name: "Sarah Jenkins", email: "sarah@apexos.com", role: "Admin", status: "Active" },
  { id: "u2", name: "Mike Ross", email: "mike@apexos.com", role: "Manager", status: "Active" },
  { id: "u3", name: "Alex Torres", email: "alex@apexos.com", role: "User", status: "Inactive" },
  { id: "u4", name: "Emma Davis", email: "emma@apexos.com", role: "User", status: "Active" }
];