export type UserRole = "admin" | "manager" | "rep";

export type AccountType = "hotel" | "spa" | "both";
export type AccountStatus = "prospect" | "active" | "inactive";

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type ActivityType = "call" | "email" | "meeting" | "note";
export type TaskStatus = "open" | "done";
export type BookingStatus = "draft" | "active" | "completed" | "cancelled";

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  role: UserRole;
  full_name: string;
  email?: string;
  created_at: string;
}

export interface Account {
  id: string;
  org_id: string;
  name: string;
  type: AccountType;
  city: string | null;
  country: string | null;
  status: AccountStatus;
  owner_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export interface Contact {
  id: string;
  org_id: string;
  account_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface Deal {
  id: string;
  org_id: string;
  account_id: string;
  title: string;
  stage: DealStage;
  value: number;
  currency: string;
  expected_close: string | null;
  owner_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  account?: Account;
  owner?: Profile;
}

export interface Activity {
  id: string;
  org_id: string;
  account_id: string;
  deal_id: string | null;
  type: ActivityType;
  subject: string;
  body: string | null;
  occurred_at: string;
  created_by: string;
  created_at: string;
  account?: Account;
  deal?: Deal;
  creator?: Profile;
}

export interface Task {
  id: string;
  org_id: string;
  account_id: string | null;
  deal_id: string | null;
  title: string;
  due_at: string | null;
  status: TaskStatus;
  assignee_id: string;
  created_by: string;
  created_at: string;
  account?: Account;
  deal?: Deal;
  assignee?: Profile;
}

export interface Booking {
  id: string;
  org_id: string;
  account_id: string;
  deal_id: string | null;
  title: string;
  start_date: string;
  end_date: string | null;
  value: number;
  currency: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  account?: Account;
  deal?: Deal;
}

export const DEAL_STAGES: DealStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const ACTIVITY_TYPES: ActivityType[] = [
  "call",
  "email",
  "meeting",
  "note",
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
};

export const ACCOUNT_TYPES: AccountType[] = ["hotel", "spa", "both"];
export const ACCOUNT_STATUSES: AccountStatus[] = [
  "prospect",
  "active",
  "inactive",
];

export const BOOKING_STATUSES: BookingStatus[] = [
  "draft",
  "active",
  "completed",
  "cancelled",
];

export const USER_ROLES: UserRole[] = ["admin", "manager", "rep"];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  rep: "Account Rep",
};
