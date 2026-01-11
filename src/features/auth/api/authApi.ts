import * as Linking from "expo-linking";
import { supabase } from "../../../shared/supabase/client";

function getRedirectUrl(path: string) {
  // Configure allowed redirects in Supabase Auth settings:
  // e.g. anvil://, exp://, and your production scheme
  return Linking.createURL(path);
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signInWithMagicLink(email: string) {
  const emailRedirectTo = getRedirectUrl("/"); // role gate
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });
  if (error) throw new Error(error.message);
}

export async function signUpWithPassword(email: string, password: string) {
  const emailRedirectTo = getRedirectUrl("/"); // after confirm / magic
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) throw new Error(error.message);
}

export async function sendPasswordReset(email: string) {
  const redirectTo = getRedirectUrl("/(auth)/reset-password");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
