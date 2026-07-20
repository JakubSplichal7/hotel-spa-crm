"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateOrgName, updateUserRole } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NativeSelect } from "@/components/ui/native-select";
import { USER_ROLES, ROLE_LABELS } from "@/lib/types";
import type { Organization, Profile } from "@/lib/types";
import { KeyRound } from "lucide-react";

export function SettingsClient({
  org,
  profiles,
}: {
  org: Organization;
  profiles: Profile[];
}) {
  const router = useRouter();
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setInviteError(null);
    setInviteSuccess(false);
    setInviteLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const invitedEmail = String(formData.get("email") || "")
      .trim()
      .toLowerCase();

    try {
      const supabase = createClient();
      const {
        data: { user: beforeUser },
      } = await supabase.auth.getUser();

      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          email: formData.get("email"),
          password: formData.get("password"),
          role: formData.get("role"),
        }),
      });
      const result = await res.json();

      if (!res.ok || result?.error) {
        setInviteError(result?.error || "Invite failed");
        setInviteLoading(false);
        return;
      }

      // Stay on Settings — never navigate to change-password after invite
      const {
        data: { user: afterUser },
      } = await supabase.auth.getUser();

      const swapped =
        !afterUser ||
        !beforeUser ||
        afterUser.id !== beforeUser.id ||
        afterUser.email?.toLowerCase() === invitedEmail ||
        (result.adminId && afterUser.id !== result.adminId);

      if (swapped) {
        await supabase.auth.signOut();
        window.location.href =
          "/login?message=" +
          encodeURIComponent(
            "User was created, but your session changed. Sign in again with your admin account."
          );
        return;
      }

      setInviteSuccess(true);
      form.reset();
      // Soft refresh list only — stay on /settings as the same admin
      router.refresh();
    } catch {
      setInviteError("Invite failed. Please try again.");
    }
    setInviteLoading(false);
  }

  async function handleRoleChange(userId: string, role: string) {
    await updateUserRole(userId, role);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateOrgName} className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="name" className="sr-only">
                Organization name
              </Label>
              <Input id="name" name="name" defaultValue={org.name} />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your password</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Update the password you use to sign in.
          </p>
          <Button asChild variant="outline">
            <Link href="/change-password">
              <KeyRound className="h-4 w-4" />
              Change password
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{p.full_name}</p>
                  <p className="text-sm text-muted-foreground">{p.email}</p>
                </div>
                <Select
                  defaultValue={p.role}
                  onValueChange={(role) => handleRoleChange(p.id, role)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            {inviteError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                User created. Share the email and temporary password with them —
                they must change the password on first login. You stay signed in
                as admin.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" required>
                  Full name
                </Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" required>
                  Email
                </Label>
                <Input id="email" name="email" type="email" required />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password" required>
                  Temporary password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Give this to them offline. They will be asked to change it on
                  first login.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <NativeSelect id="role" name="role" defaultValue="rep">
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <Button type="submit" disabled={inviteLoading}>
              {inviteLoading ? "Creating user..." : "Invite User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
