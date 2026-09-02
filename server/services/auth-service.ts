import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface SignUpInput {
  email: string;
  password?: string;
  fullName: string;
  educationLevel?: string;
  subjectGroup?: string;
  schoolName?: string;
}

export interface SignInInput {
  email: string;
  password?: string;
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

export class AuthService {
  /**
   * Registers a new teacher account with profile metadata
   */
  static async signUp(input: SignUpInput): Promise<AuthResult> {
    if (!input.email || !input.password) {
      return { success: false, error: "Email và mật khẩu là bắt buộc" };
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          education_level: input.educationLevel || "SECONDARY",
          subject_group: input.subjectGroup || "MATH",
          school_name: input.schoolName || "",
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      userId: data.user?.id,
      email: data.user?.email,
    };
  }

  /**
   * Signs in an existing user
   */
  static async signIn(input: SignInInput): Promise<AuthResult> {
    if (!input.email || !input.password) {
      return { success: false, error: "Email và mật khẩu là bắt buộc" };
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      userId: data.user?.id,
      email: data.user?.email,
    };
  }

  /**
   * Signs out the current user session
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /**
   * Sends a password reset email
   */
  static async requestPasswordReset(email: string, redirectTo?: string): Promise<{ success: boolean; error?: string }> {
    if (!email) {
      return { success: false, error: "Email là bắt buộc" };
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}
