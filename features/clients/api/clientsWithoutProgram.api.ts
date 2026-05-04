import { supabase } from "@/shared/supabase/client";

export type ClientWithoutActiveProgram = {
  linkId: string;
  clientId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
  lastCheckInAt: string | null;
  clientStatus: string;
};

type RawRow = {
  linkid: string;
  clientid: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  avatarurl: string | null;
  lastcheckinat: string | null;
  clientstatus: string;
};

function mapRow(row: RawRow): ClientWithoutActiveProgram {
  return {
    linkId: row.linkid,
    clientId: row.clientid,
    firstName: row.firstname,
    lastName: row.lastname,
    email: row.email,
    avatarUrl: row.avatarurl,
    lastCheckInAt: row.lastcheckinat,
    clientStatus: row.clientstatus,
  };
}

export async function fetchClientsWithoutActiveProgram(): Promise<ClientWithoutActiveProgram[]> {
  const res = await supabase.rpc("anvil_get_trainer_clients_without_active_program");
  if (res.error) throw res.error;
  const rows = (res.data ?? []) as RawRow[];
  return rows.map(mapRow);
}
