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

/** Why an offer was marked Lost */
export type DealLostReason = "price" | "date" | "capacity" | "services";

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
  /** True for invited users until they set their own password */
  must_change_password?: boolean;
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
  /** Required when stage is lost */
  lost_reason?: DealLostReason | null;
  /** Required free-text detail when stage is lost */
  lost_comment?: string | null;
  /** Soft flag: user declined creating a linked booking */
  booking_create_declined?: boolean;
  /** Soft flag: user declined moving linked booking to Active on Won */
  active_booking_declined?: boolean;
  /** Soft flag: user declined moving linked booking to Completed on Completed */
  completed_booking_declined?: boolean;
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
  account_id: string | null;
  deal_id: string | null;
  event_id?: string | null;
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
  event_id?: string | null;
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

export interface Event {
  id: string;
  org_id: string;
  name: string;
  event_date: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  guests?: EventGuest[];
}

export interface EventGuest {
  id: string;
  org_id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
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

/** Expected booking status for offer stages (soft pairing rule) */
export function expectedBookingStatusForStage(
  stage: DealStage
): BookingStatus | null {
  if (stage === "proposal" || stage === "negotiation") return "option";
  if (stage === "won") return "active";
  if (stage === "completed") return "completed";
  return null;
}

export type OfferBookingHealth =
  | "ok"
  | "missing_booking"
  | "needs_confirmation"
  | "missing_option"
  | "missing_active"
  | "missing_completed"
  | "status_mismatch";

export function getOfferBookingHealth(
  stage: DealStage,
  booking: Booking | null | undefined,
  flags?: {
    booking_create_declined?: boolean;
    active_booking_declined?: boolean;
    completed_booking_declined?: boolean;
  }
): OfferBookingHealth {
  const expected = expectedBookingStatusForStage(stage);
  if (!expected) return "ok";

  if (!booking) return "missing_booking";
  if (booking.needs_confirmation || booking.status === "draft") {
    return "needs_confirmation";
  }
  if (booking.status === expected) return "ok";

  if (stage === "proposal" || stage === "negotiation") {
    return "missing_option";
  }
  if (stage === "won") {
    return "missing_active";
  }
  if (stage === "completed") {
    return "missing_completed";
  }
  return "status_mismatch";
}

export function offerBookingHealthLabel(health: OfferBookingHealth): string {
  switch (health) {
    case "missing_booking":
      return "Missing booking";
    case "needs_confirmation":
      return "Needs confirmation";
    case "missing_option":
      return "No Option booking";
    case "missing_active":
      return "No Active booking";
    case "missing_completed":
      return "No Completed booking";
    case "status_mismatch":
      return "Status mismatch";
    default:
      return "";
  }
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

export const DEAL_LOST_REASONS: DealLostReason[] = [
  "price",
  "date",
  "capacity",
  "services",
];

export const DEAL_LOST_REASON_LABELS: Record<DealLostReason, string> = {
  price: "Price",
  date: "Date",
  capacity: "Capacity",
  services: "Services",
};

export function getDealLostReasonLabel(reason: string | null | undefined): string {
  if (!reason) return "—";
  return DEAL_LOST_REASON_LABELS[reason as DealLostReason] ?? reason;
}

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
