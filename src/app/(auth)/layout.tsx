import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Link href="/" className="mb-8 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
        <BrandLogo variant="full" size="xl" />
      </Link>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
