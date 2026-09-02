import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BaseRepository } from "./base-repository";

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  role: "user" | "admin" | "super_admin";
  educationLevel: string | null;
  subjectGroup: string | null;
  createdAt: string;
  updatedAt: string;
}

const memoryProfiles = new Map<string, Profile>();

export class ProfileRepository implements BaseRepository<Profile> {
  static clearMemoryStore() {
    memoryProfiles.clear();
  }

  static setMemoryProfile(profile: Profile) {
    memoryProfiles.set(profile.id, profile);
  }

  async findById(id: string): Promise<Profile | null> {
    if (memoryProfiles.has(id)) {
      return memoryProfiles.get(id)!;
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) return null;
      const profile: Profile = {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role as "user" | "admin" | "super_admin",
        educationLevel: data.education_level,
        subjectGroup: data.subject_group,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      memoryProfiles.set(profile.id, profile);
      return profile;
    } catch {
      return null;
    }
  }

  async findMany(): Promise<Profile[]> {
    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.from("profiles").select("*");
      if (error || !data) return Array.from(memoryProfiles.values());

      return data.map((item) => ({
        id: item.id,
        email: item.email,
        fullName: item.full_name,
        role: item.role as "user" | "admin" | "super_admin",
        educationLevel: item.education_level,
        subjectGroup: item.subject_group,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch {
      return Array.from(memoryProfiles.values());
    }
  }

  async create(data: Partial<Profile>): Promise<Profile> {
    const profile: Profile = {
      id: data.id || `prof_${Date.now()}`,
      email: data.email || "user@example.com",
      fullName: data.fullName || null,
      role: data.role || "user",
      educationLevel: data.educationLevel || null,
      subjectGroup: data.subjectGroup || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryProfiles.set(profile.id, profile);

    try {
      const supabase = createServerSupabaseClient();
      const { data: created, error } = await supabase
        .from("profiles")
        .insert({
          id: profile.id,
          email: profile.email,
          full_name: profile.fullName,
          role: profile.role,
          education_level: profile.educationLevel,
          subject_group: profile.subjectGroup,
        })
        .select()
        .single();

      if (!error && created) {
        return {
          id: created.id,
          email: created.email,
          fullName: created.full_name,
          role: created.role as "user" | "admin" | "super_admin",
          educationLevel: created.education_level,
          subjectGroup: created.subject_group,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
        };
      }
    } catch {
      // Memory fallback
    }

    return profile;
  }

  async update(id: string, data: Partial<Profile>): Promise<Profile> {
    const existing = await this.findById(id);
    const updated: Profile = {
      id,
      email: existing?.email || "user@example.com",
      fullName: data.fullName !== undefined ? data.fullName : existing?.fullName || null,
      role: data.role || existing?.role || "user",
      educationLevel: data.educationLevel !== undefined ? data.educationLevel : existing?.educationLevel || null,
      subjectGroup: data.subjectGroup !== undefined ? data.subjectGroup : existing?.subjectGroup || null,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryProfiles.set(id, updated);

    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("profiles")
        .update({
          full_name: updated.fullName,
          education_level: updated.educationLevel,
          subject_group: updated.subjectGroup,
        })
        .eq("id", id);
    } catch {
      // fallback
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    memoryProfiles.delete(id);
    try {
      const supabase = createServerSupabaseClient();
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      return !error;
    } catch {
      return true;
    }
  }
}
