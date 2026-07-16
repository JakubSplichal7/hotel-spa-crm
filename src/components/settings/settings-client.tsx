"use client";

import { useState } from "react";
import { inviteUser, updateOrgName, updateUserRole } from "@/lib/actions/auth";
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

export function SettingsClient({
  org,
  profiles,
}: {
  org: Organization;
  profiles: Profile[];
}) {
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  async function handleInvite(formData: FormData) {
    setInviteError(null);
    setInviteSuccess(false);
    const result = await inviteUser(formData);
    if (result?.error) {
      setInviteError(result.error);
    } else {
      setInviteSuccess(true);
    }
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
              <Label htmlFor="name" className="sr-only">Organization name</Label>
              <Input id="name" name="name" defaultValue={org.name} />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
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
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
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
          <form action={handleInvite} className="space-y-4">
            {inviteError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{inviteError}</div>
            )}
            {inviteSuccess && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">User invited successfully</div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <NativeSelect id="role" name="role" defaultValue="rep">
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <Button type="submit">Invite User</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
