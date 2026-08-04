import { supabase } from './supabase';
import type { UserProfile, Skill } from '@/types/skillswap';

// Helper function to convert Firebase UID to UUID format
function convertToUUID(firebaseUid: string): string {
  // If the Firebase UID is already in UUID format, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firebaseUid)) {
    return firebaseUid;
  }
  
  // Generate a deterministic UUID based on the Firebase UID
  // This is a simple hashing approach - in production, consider a more robust method
  let hash = 0;
  for (let i = 0; i < firebaseUid.length; i++) {
    const char = firebaseUid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Create a UUID-like string (this is not a true UUID but will have the right format)
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (hash + Math.random() * 16) % 16 | 0;
    hash = Math.floor(hash / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  
  return uuid;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabaseId = convertToUUID(userId);
    
    console.log("Fetching profile for user ID:", userId, "Supabase ID:", supabaseId);
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseId)
      .single();
    
    if (profileError) {
      // Check if it's the specific error for "0 rows" with .single()
      if (profileError.code === 'PGRST116' && profileError.details?.includes("0 rows")) {
        console.log("No profile found for user:", userId);
        return null; // Profile not found, return null gracefully
      }
      console.error('Supabase error fetching profile:', JSON.stringify(profileError, null, 2));
      throw new Error(`Error fetching profile data: ${profileError.message}`);
    }
    
    // If profileData is null but no error, it means 0 rows were returned with a non-.single() query (not applicable here but good practice)
    if (!profileData) {
      console.log("No profile data returned for user:", userId);
      return null;
    }
    
    console.log("Profile data from database:", profileData);
    
    // Get the skills
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .eq('profile_id', supabaseId);
    
    if (skillsError) {
      console.error('Supabase error fetching skills:', JSON.stringify(skillsError, null, 2));
      throw new Error(`Error fetching skills data: ${skillsError.message}`);
    }
    
    // Transform database model to our app model
    const skillsOffered = skillsData
      .filter(skill => skill.type === 'offered')
      .map(skill => ({ id: skill.id, name: skill.name }));
    
    const skillsWanted = skillsData
      .filter(skill => skill.type === 'wanted')
      .map(skill => ({ id: skill.id, name: skill.name }));
    
    // Ensure timeBalance is a number and has a default value of 12 if it's null/undefined/0
    const timeBalance = typeof profileData.time_balance === 'number' ? profileData.time_balance : 12;
    
    const userProfile = {
      id: userId, // Return the original Firebase UID for app use
      name: profileData.name,
      email: profileData.email,
      bio: profileData.bio || '',
      avatarUrl: profileData.avatar_url || undefined,
      backgroundImageUrl: profileData.background_image_url || undefined,
      skillsOffered,
      skillsWanted,
      timeAvailable: profileData.time_available || '',
      timeBalance: timeBalance,
    };
    
    console.log("Returning user profile with time balance:", userProfile.timeBalance);
    return userProfile;
  } catch (error: any) {
    // Ensure we log the original error if it's not from Supabase directly
    const errorMessage = error.message || 'Unknown error during profile fetch';
    console.error('Error fetching user profile:', errorMessage, error);
    throw new Error(errorMessage); // Re-throw with a consistent message
  }
}

export async function saveUserProfile(profile: Partial<UserProfile> & { id: string }): Promise<void> {
  try {
    const supabaseId = convertToUUID(profile.id);
    
    // First, upsert the profile data
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: supabaseId,
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
        background_image_url: profile.backgroundImageUrl,
        time_available: profile.timeAvailable,
        time_balance: profile.timeBalance,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });
    
    if (profileError) throw profileError;
    
    // If we have skills to update
    if (profile.skillsOffered || profile.skillsWanted) {
      // First, delete existing skills
      const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .eq('profile_id', supabaseId);
      
      if (deleteError) throw deleteError;
      
      // Prepare skills for insertion
      const skillsToInsert: any[] = [];
      
      if (profile.skillsOffered) {
        const offeredSkills = profile.skillsOffered.map(skill => ({
          profile_id: supabaseId,
          name: skill.name,
          type: 'offered',
        }));
        skillsToInsert.push(...offeredSkills);
      }
      
      if (profile.skillsWanted) {
        const wantedSkills = profile.skillsWanted.map(skill => ({
          profile_id: supabaseId,
          name: skill.name,
          type: 'wanted',
        }));
        skillsToInsert.push(...wantedSkills);
      }
      
      // Insert the new skills
      if (skillsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('skills')
          .insert(skillsToInsert);
        
        if (insertError) throw insertError;
      }
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

export async function createUserProfile(userId: string, initialData: Partial<UserProfile>): Promise<void> {
  try {
    const supabaseId = convertToUUID(userId);
    
    const profileData = {
      id: supabaseId,
      name: initialData.name || 'Anonymous User',
      email: initialData.email || '',
      bio: initialData.bio || '',
      background_image_url: initialData.backgroundImageUrl,
      time_available: initialData.timeAvailable || '',
      time_balance: initialData.timeBalance ?? 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Insert the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData);
    
    if (profileError) throw profileError;
    
    // If we have skills to create
    const skillsToInsert: any[] = [];
      
    if (initialData.skillsOffered) {
      const offeredSkills = initialData.skillsOffered.map(skill => ({
        profile_id: supabaseId,
        name: skill.name,
        type: 'offered',
      }));
      skillsToInsert.push(...offeredSkills);
    }
    
    if (initialData.skillsWanted) {
      const wantedSkills = initialData.skillsWanted.map(skill => ({
        profile_id: supabaseId,
        name: skill.name,
        type: 'wanted',
      }));
      skillsToInsert.push(...wantedSkills);
    }
    
    // Insert the skills
    if (skillsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('skills')
        .insert(skillsToInsert);
      
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function updateAllZeroBalancesToDefault(): Promise<void> {
  try {
    console.log("Starting to update all zero time balances to 12 hours...");
    
    // First get all profiles with zero balance
    const { data: zeroBalanceProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, time_balance')
      .or('time_balance.eq.0,time_balance.is.null');
    
    if (fetchError) {
      console.error('Error fetching profiles with zero balances:', fetchError);
      throw fetchError;
    }
    
    console.log(`Found ${zeroBalanceProfiles.length} profiles with zero/null time balance`);
    
    if (zeroBalanceProfiles.length === 0) {
      console.log("No profiles to update.");
      return;
    }
    
    // Update all profiles with zero balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ time_balance: 12, updated_at: new Date().toISOString() })
      .or('time_balance.eq.0,time_balance.is.null');
    
    if (updateError) {
      console.error('Error updating profiles with zero balances:', updateError);
      throw updateError;
    }
    
    console.log(`Successfully updated ${zeroBalanceProfiles.length} profiles to have 12 hours time balance`);
  } catch (error) {
    console.error('Error updating zero time balances:', error);
    throw error;
  }
} 