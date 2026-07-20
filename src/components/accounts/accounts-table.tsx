"use client";

import { DeleteAccountButton } from "@/components/accounts/delete-account-button";
import {
  BulkRowCheckbox,
  BulkSelectAllCheckbox,
  BulkTableToolbar,
  bulkCheckboxCellClass,
  bulkCheckboxHeadClass,
  useBulkSelection,
} from "@/components/bulk-selection";
import { Badge } from "@/components/ui/badge";
import {
  getAccountDisplayName,
  getAccountTypeLabel,
  getAcquisitionLabel,
  type Account,
} from "@/lib/types";
import { deleteAccounts } from "@/lib/actions/accounts";
import Link from "next/link";

type AccountRow = Account & {
  owner?: { full_name: string } | null;
};

export function AccountsTable({ accounts }: { accounts: AccountRow[] }) {
  const selection = useBulkSelection(accounts.map((a) => a.id));

  return (
    <div>
      <BulkTableToolbar
        selection={selection}
        entityLabel="client"
        onDelete={deleteAccounts}
        exportFilename="clients"
        exportColumns={[
          "Client",
          "Official name",
          "IČO",
          "Type",
          "Location",
          "Status",
          "Acquisition",
          "Owner",
          "VIP",
        ]}
        exportRows={accounts.map((account) => ({
          Client: account.nickname || account.name,
          "Official name": account.name,
          "IČO": account.ico || "",
          Type: getAccountTypeLabel(account.type),
          Location:
            [account.city, account.country].filter(Boolean).join(", ") || "",
          Status: account.status,
          Acquisition: getAcquisitionLabel(account.loyalty_tier),
          Owner: (account.owner as { full_name: string } | null)?.full_name || "",
          VIP: account.is_vip ? "Yes" : "No",
        }))}
      />
      <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className={bulkCheckboxHeadClass}>
                <BulkSelectAllCheckbox selection={selection} />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Official name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">IČO</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Location
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Acquisition
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Owner</th>
              <th className="w-12 px-2 py-3 text-right text-sm font-medium" />
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-b hover:bg-muted/30">
                <td className={bulkCheckboxCellClass}>
                  <BulkRowCheckbox id={account.id} selection={selection} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/accounts/${account.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {getAccountDisplayName(account)}
                  </Link>
                  {account.is_vip && (
                    <Badge className="ml-2" variant="warning">
                      VIP
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {account.name}
                </td>
                <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                  {account.ico || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">
                    {getAccountTypeLabel(account.type)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {[account.city, account.country].filter(Boolean).join(", ") ||
                    "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      account.status === "active"
                        ? "success"
                        : account.status === "prospect"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {account.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">
                  {getAcquisitionLabel(account.loyalty_tier)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {(account.owner as { full_name: string } | null)?.full_name ||
                    "—"}
                </td>
                <td className="px-2 py-3 text-right">
                  <DeleteAccountButton
                    accountId={account.id}
                    accountName={getAccountDisplayName(account)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
