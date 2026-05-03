// @ts-nocheck
/* eslint-disable import/no-unresolved */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
/* eslint-enable import/no-unresolved */

type CreateClientPayload = {
  clientEmail: string;
  firstName?: string;
  lastName?: string;
  sendMagicLink?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
      });
    }

    const jwt = authHeader.slice("Bearer ".length).trim();
    const {
      data: { user: trainerAuthUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !trainerAuthUser) {
      return new Response(JSON.stringify({ error: "Invalid authentication token" }), {
        status: 401,
      });
    }

    const trainerId = trainerAuthUser.id;

    const { data: trainerRow, error: trainerRowError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", trainerId)
      .single();

    if (trainerRowError || trainerRow?.role !== "trainer") {
      return new Response(JSON.stringify({ error: "Only trainers can create clients" }), {
        status: 403,
      });
    }

    const body = (await req.json()) as CreateClientPayload;
    const clientEmail = body.clientEmail?.toLowerCase().trim();
    const firstName = body.firstName?.trim() || null;
    const lastName = body.lastName?.trim() || null;
    const sendMagicLink = body.sendMagicLink ?? true;

    if (!clientEmail || !EMAIL_RE.test(clientEmail)) {
      return new Response(JSON.stringify({ error: "A valid clientEmail is required" }), {
        status: 400,
      });
    }

    const { data: existingAuthUser, error: existingAuthUserError } = await supabaseAdmin
      .schema("auth")
      .from("users")
      .select("id,email")
      .eq("email", clientEmail)
      .maybeSingle();

    if (existingAuthUserError) {
      throw existingAuthUserError;
    }

    let clientUserId: string;
    let isNewUser = false;

    if (existingAuthUser?.id) {
      clientUserId = existingAuthUser.id;
    } else {
      const { data: createdUser, error: createUserError } =
        await supabaseAdmin.auth.admin.createUser({
          email: clientEmail,
          email_confirm: false,
          user_metadata: { firstName, lastName },
        });

      if (createUserError || !createdUser.user) {
        throw createUserError ?? new Error("Failed to create client user");
      }

      clientUserId = createdUser.user.id;
      isNewUser = true;
    }

    if (sendMagicLink && isNewUser) {
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: clientEmail,
      });
    }

    const { data: linkRow, error: linkError } = await supabaseAdmin
      .from("trainerClients")
      .upsert(
        {
          trainerId,
          clientId: clientUserId,
          status: "active",
        },
        { onConflict: "trainerId,clientId" }
      )
      .select("id,trainerId,clientId,status,createdAt")
      .single();

    if (linkError) {
      throw linkError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientId: clientUserId,
        trainerClientLink: linkRow,
        isNewUser,
        magicLinkSent: sendMagicLink && isNewUser,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("anvil-create-client error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

