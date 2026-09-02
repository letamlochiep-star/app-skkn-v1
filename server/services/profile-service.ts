import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileRepository, type Profile } from "@/server/repositories/profile-repository";

export interface UpdateProfileInput {
  fullName?: string;
  educationLevel?: string;
  subjectGroup?: string;
  schoolName?: string;
  role?: string; // Attempted role changes will be explicitly stripped/rejected
}

export class ProfileService {
  private static repo = new ProfileRepository();

  /**
   * Retrieves profile by user ID
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    if (!userId) return null;
    return this.repo.findById(userId);
  }

  /**
   * Updates user profile safely.
   * Strips out any unauthorized role modifications to protect privilege boundaries.
   */
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    if (!userId) {
      throw new Error("UNAUTHORIZED: User ID is required");
    }

    // Role cannot be updated by normal user actions
    const safeData: Partial<Profile> = {
      fullName: input.fullName,
      educationLevel: input.educationLevel,
      subjectGroup: input.subjectGroup,
    };

    return this.repo.update(userId, safeData);
  }
}
