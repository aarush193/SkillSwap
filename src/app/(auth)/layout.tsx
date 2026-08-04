import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Link href="/" className="mb-8 flex items-center space-x-2 text-2xl font-bold text-primary">
        <Zap className="h-8 w-8" />
        <span>SkillSwap</span>
      </Link>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
