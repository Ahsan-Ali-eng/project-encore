import { SignUp } from "@clerk/react";

export default function Register() {
  return (
    <div className="min-h-screen bg-encore-background flex items-center justify-center px-6">
      <SignUp forceRedirectUrl="/dashboard" />
    </div>
  );
}