import { requireProfile } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default async function ChangePasswordPage() {
  const profile = await requireProfile();
  const required = Boolean(profile.must_change_password);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <ChangePasswordForm
        required={required}
        email={profile.email}
        fullName={profile.full_name}
      />
    </div>
  );
}
