import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Shield, Bell, Palette } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings - SkillSwap',
  description: 'Manage your SkillSwap account settings.',
};

export default function SettingsPage() {
  // In a real app, these would come from user state or API
  const userSettings = {
    emailNotifications: true,
    darkMode: false, // This would typically be handled by ThemeProvider
    profileVisibility: 'public',
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile, notifications, and preferences.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Appearance</CardTitle>
          <CardDescription>Customize the look and feel of SkillSwap.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2 p-3 rounded-md border">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
              <span>Dark Mode</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Toggle between light and dark themes.
              </span>
            </Label>
            {/* This switch is illustrative; actual theme switching is handled by ThemeProvider and a theme toggle button typically in the header */}
            <Switch id="dark-mode" checked={userSettings.darkMode} aria-readonly /> 
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notifications</CardTitle>
          <CardDescription>Choose how you receive notifications from SkillSwap.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2 p-3 rounded-md border">
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span>Email Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive updates about new messages, skill matches, and platform news.
              </span>
            </Label>
            <Switch id="email-notifications" defaultChecked={userSettings.emailNotifications} />
          </div>
          {/* Add more notification settings here */}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Privacy & Security</CardTitle>
          <CardDescription>Manage your account security and profile visibility.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profile-visibility">Profile Visibility</Label>
            {/* This would be a Select component in a real scenario */}
            <Input id="profile-visibility" defaultValue={userSettings.profileVisibility} disabled placeholder="Public / Members Only / Private" />
            <p className="text-xs text-muted-foreground">Control who can see your profile details.</p>
          </div>
          <Separator />
          <div>
            <Button variant="outline">Change Password</Button>
            <p className="text-xs text-muted-foreground mt-1">It&apos;s a good idea to use a strong password that you&apos;re not using elsewhere.</p>
          </div>
           <Separator />
          <div>
            <Button variant="destructive">Deactivate Account</Button>
             <p className="text-xs text-muted-foreground mt-1">This action is irreversible and will remove all your data from SkillSwap.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
