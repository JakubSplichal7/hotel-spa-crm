"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword, signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChangePasswordForm({
  required = false,
  email,
  fullName,
}: {
  required?: boolean;
  email?: string | null;
  fullName?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await changePassword(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {required ? "Set a new password" : "Change password"}
        </CardTitle>
        {(fullName || email) && (
          <p className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {fullName || email}
            </span>
            {fullName && email ? ` (${email})` : null}
          </p>
        )}
        {required ? (
          <p className="text-sm text-muted-foreground">
            This account uses a temporary password. Choose a new one to continue
            — or sign out if this is not your account.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save password"}
          </Button>
        </form>

        <div className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={signingOut}
            onClick={handleSignOut}
          >
            {signingOut ? "Signing out..." : "Not you? Sign out"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
