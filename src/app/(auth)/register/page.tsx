import { RegisterForm } from "@/components/auth/register-form";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - SkillSwap',
  description: 'Create a new SkillSwap account.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
