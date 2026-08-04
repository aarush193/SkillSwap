
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile - SkillSwap',
  description: 'View and manage your SkillSwap profile and skill exchanges.',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
