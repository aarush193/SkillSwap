import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - SkillSwap',
  description: 'Log in to your SkillSwap account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
