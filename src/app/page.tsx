import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Clock, Zap } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">SkillSwap</span>
          </Link>
          <nav className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-primary">
              Unlock Your Potential.
            </h1>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-foreground">
              Exchange Skills, Bank Time.
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
              Join SkillSwap, a community where you can share your expertise, learn new things,
              and manage your time contributions seamlessly.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/listings">Explore Skills</Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Placeholder Image Section */}
        <section className="py-12 md:py-16">
            <div className="container px-4 md:px-6">
                <Image
                    src="https://picsum.photos/1200/400?grayscale&blur=2"
                    alt="Community Collaboration"
                    width={1200}
                    height={400}
                    className="rounded-lg shadow-lg mx-auto"
                    data-ai-hint="community collaboration"
                />
            </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-12 text-foreground">
              Why SkillSwap?
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="bg-primary/20 p-3 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Connect & Collaborate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Find individuals with diverse skills and collaborate on projects or learning experiences.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="bg-primary/20 p-3 rounded-full">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Showcase Your Talents</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Create listings for skills you offer and skills you're looking to acquire.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                 <div className="bg-primary/20 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Fair Time Banking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Log your time contributions and withdrawals, ensuring a fair exchange system for everyone.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 md:py-8 border-t bg-background">
        <div className="container px-4 md:px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SkillSwap. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
