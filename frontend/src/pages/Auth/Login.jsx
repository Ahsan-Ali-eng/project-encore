import { SignIn } from "@clerk/react";

export default function Login() {
  return (
    <div className="min-h-screen bg-encore-background flex items-center justify-center px-6">
      <SignIn forceRedirectUrl="/dashboard" />
    </div>
  );
}