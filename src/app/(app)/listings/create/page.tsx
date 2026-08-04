import { CreateListingForm } from "@/components/listings/create-listing-form";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Listing - SkillSwap',
  description: 'Offer or request a skill on SkillSwap.',
};

export default function CreateListingPage() {
  return (
    <div>
      <CreateListingForm />
    </div>
  );
}
