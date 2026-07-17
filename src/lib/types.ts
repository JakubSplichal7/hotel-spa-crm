export type UserRole = "admin" | "manager" | "rep";

/** Client type — company is the main use case; individual for guests */
export type AccountType = "company" | "individual" | "hotel" | "spa" | "both";
export type AccountStatus = "prospect" | "active" | "inactive";
/** Stored in accounts.loyalty_tier — acquisition channel */
export type AcquisitionSource = "jana_splichalova" | "mailbox";

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "completed"
  | "lost";

export type ActivityType = "call" | "email" | "meeting" | "note";
export type TaskStatus = "open" | "done";
export type BookingStatus =
  | "draft"
  | "active"
  | "completed"
  | "cancelled"
  | "option";

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
  is_vip: boolean;
  loyalty_tier: AcquisitionSource | string | null;
  preferences: string | null;
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
  /** Soft flag: user declined creating a linked booking */
  booking_create_declined?: boolean;
  /** Soft flag: user declined moving linked booking to Active on Won */
  active_booking_declined?: boolean;
  created_at: string;
  updated_at: string;
  account?: Account;
  owner?: Profile;
  /** Primary linked booking when loaded */
  booking?: Booking | null;
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
  /** Calendar due date (YYYY-MM-DD), no time */
  due_at: string | null;
  /** Calendar date when marked done (YYYY-MM-DD) */
  completed_at: string | null;
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
  start_date: string | null;
  end_date: string | null;
  value: number;
  currency: string;
  status: BookingStatus;
  notes: string | null;
  /** True until user confirms details after offer-driven create */
  needs_confirmation?: boolean;
  created_at: string;
  account?: Account;
  deal?: Deal;
}

/** Stages where a linked booking is expected (soft rule) */
export const DEAL_STAGES_NEEDING_BOOKING: DealStage[] = [
  "proposal",
  "negotiation",
  "won",
  "completed",
];

export function dealStageNeedsBooking(stage: DealStage): boolean {
  return DEAL_STAGES_NEEDING_BOOKING.includes(stage);
}

/** Pick the primary booking for an offer (1:1 UI; list-ready for future) */
export function getPrimaryBooking(
  bookings: Booking[] | null | undefined
): Booking | null {
  if (!bookings?.length) return null;
  const active = bookings.filter((b) => b.status !== "cancelled");
  const pool = active.length ? active : bookings;
  return [...pool].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0];
}

export type OfferBookingHealth =
  | "ok"
  | "missing_booking"
  | "needs_confirmation"
  | "missing_active"
  | "status_mismatch";

export function getOfferBookingHealth(
  stage: DealStage,
  booking: Booking | null | undefined,
  flags?: { booking_create_declined?: boolean; active_booking_declined?: boolean }
): OfferBookingHealth {
  if (!dealStageNeedsBooking(stage)) return "ok";
  if (!booking) return "missing_booking";
  if (booking.needs_confirmation || booking.status === "draft") {
    return "needs_confirmation";
  }
  if (stage === "won") {
    if (booking.status === "active" || booking.status === "completed") return "ok";
    return flags?.active_booking_declined || booking.status !== "active"
      ? "missing_active"
      : "ok";
  }
  if (stage === "completed") {
    if (booking.status === "completed") return "ok";
    if (booking.status === "active") return "status_mismatch";
    return "missing_active";
  }
  if (
    (stage === "proposal" || stage === "negotiation") &&
    booking.status !== "option" &&
    booking.status !== "active" &&
    booking.status !== "completed"
  ) {
    return "status_mismatch";
  }
  return "ok";
}

export const DEAL_STAGES: DealStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "completed",
  "lost",
];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  completed: "Completed",
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

export const ACCOUNT_TYPES: AccountType[] = ["company", "individual"];

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  company: "Company",
  individual: "Individual",
  hotel: "Company",
  spa: "Company",
  both: "Company",
};

export const ACCOUNT_STATUSES: AccountStatus[] = [
  "prospect",
  "active",
  "inactive",
];

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  prospect: "Prospect",
  active: "Active",
  inactive: "Inactive",
};

export const ACQUISITION_SOURCES: AcquisitionSource[] = [
  "jana_splichalova",
  "mailbox",
];

export const ACQUISITION_SOURCE_LABELS: Record<AcquisitionSource, string> = {
  jana_splichalova: "Jana Šplíchalová",
  mailbox: "Mailbox",
};

export function getAcquisitionLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return (
    ACQUISITION_SOURCE_LABELS[value as AcquisitionSource] ?? value
  );
}

export const BOOKING_STATUSES: BookingStatus[] = [
  "draft",
  "option",
  "active",
  "completed",
  "cancelled",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  draft: "Draft",
  active: "Active",
  option: "Option",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const USER_ROLES: UserRole[] = ["admin", "manager", "rep"];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  rep: "Account Manager",
};

export function getDealStageLabel(stage: string): string {
  return DEAL_STAGE_LABELS[stage as DealStage] ?? stage;
}

export function getActivityTypeLabel(type: string): string {
  return ACTIVITY_TYPE_LABELS[type as ActivityType] ?? type;
}

export function getAccountTypeLabel(type: string): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type;
}
