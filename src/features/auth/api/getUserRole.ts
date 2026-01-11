import { supabase } from "../../../shared/supabase/client";
import type { UserRole } from "../types/auth";

export async function getUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const role = data?.role as UserRole | undefined;
  if (!role || (role !== "trainer" && role !== "client")) {
    throw new Error("Invalid or missing user role.");
  }

  return role;
}
