import { supabase } from "../../../shared/supabase/client";

export async function redeemInviteCode(code: string) {
  const { error } = await supabase.rpc("anvilRedeemInviteCode", { code });
  if (error) throw new Error(error.message);
}

export async function createTrainerRequest(
  trainerEmail: string,
  message: string
) {
  const { error } = await supabase.rpc("anvilCreateTrainerRequest", {
    trainerEmail,
    message,
  });
  if (error) throw new Error(error.message);
}

export async function createTrainerInvite(targetEmail?: string) {
  const { data, error } = await supabase.rpc("anvilCreateTrainerInvite", {
    targetEmail: targetEmail ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function createClientByEmail(payload: {
  clientEmail: string;
  firstName?: string;
  lastName?: string;
  sendMagicLink?: boolean;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Not authenticated");

  const { data, error } = await supabase.functions.invoke(
    "anvil-create-client",
    {
      body: payload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (error) throw new Error(error.message);
  return data;
}
