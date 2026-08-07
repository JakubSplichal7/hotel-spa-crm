import { canManageAll } from "@/lib/auth";
import { TransactionLogButton } from "@/components/audit/transaction-log-button";
import type { AuditEntityType } from "@/lib/audit";
import type { Profile } from "@/lib/types";

/** Renders Transaction log only for Admin / Manager. */
export function ManagerTransactionLog({
  profile,
  accountId,
  entityType,
  entityTypes,
  entityId,
  includeRelated,
  title,
  description,
}: {
  profile: Profile;
  accountId?: string | null;
  entityType?: AuditEntityType | string | null;
  entityTypes?: (AuditEntityType | string)[] | null;
  entityId?: string | null;
  includeRelated?: boolean;
  title?: string;
  description?: string;
}) {
  if (!canManageAll(profile)) return null;
  return (
    <TransactionLogButton
      accountId={accountId}
      entityType={entityType}
      entityTypes={entityTypes}
      entityId={entityId}
      includeRelated={includeRelated}
      title={title}
      description={description}
    />
  );
}
