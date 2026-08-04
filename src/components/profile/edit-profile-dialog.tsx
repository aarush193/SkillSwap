"use client";

import type { UserProfile } from "@/types/skillswap";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditProfileForm } from "./edit-profile-form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

interface EditProfileDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
}

export function EditProfileDialog({ user, isOpen, onClose, onSave }: EditProfileDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleFormSave = async (data: Partial<UserProfile>) => {
    setIsSaving(true);
    setIsSuccess(false);
    try {
      await onSave(data);
      setIsSuccess(true);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default",
      });
      // Close dialog after a brief delay to show success state
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 1000);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset states when dialog closes
    setIsSuccess(false);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile information. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <EditProfileForm 
            user={user} 
            onSave={handleFormSave} 
            onCancel={handleClose}
            isSaving={isSaving}
            isSuccess={isSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
