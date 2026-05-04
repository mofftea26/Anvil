import { supabase } from "@/shared/supabase/client";

import type { CheckInStatus, TrainerCheckIn } from "../types";

type RawTrainerCheckInRow = {
  id: string;
  trainerid: string;
  clientid: string;
  scheduledfor: string;
  scheduledtime: string | null;
  sortorder: number;
  status: string;
  notes: string | null;
  metricsummary: string | null;
  createdat: string;
  updatedat: string;
  clientfirstname: string | null;
  clientlastname: string | null;
  clientavatarurl: string | null;
};

function mapCheckInStatus(raw: string): CheckInStatus {
  if (
    raw === "scheduled" ||
    raw === "completed" ||
    raw === "missed" ||
    raw === "cancelled"
  ) {
    return raw;
  }
  return "scheduled";
}

export function mapTrainerCheckInRow(row: RawTrainerCheckInRow): TrainerCheckIn {
  return {
    id: row.id,
    trainerId: row.trainerid,
    clientId: row.clientid,
    scheduledFor:
      typeof row.scheduledfor === "string"
        ? row.scheduledfor.slice(0, 10)
        : String(row.scheduledfor),
    scheduledTime: row.scheduledtime,
    sortOrder: row.sortorder,
    status: mapCheckInStatus(row.status),
    notes: row.notes,
    metricSummary: row.metricsummary,
    createdAt: row.createdat,
    updatedAt: row.updatedat,
    clientFirstName: row.clientfirstname,
    clientLastName: row.clientlastname,
    clientAvatarUrl: row.clientavatarurl,
  };
}

export async function fetchTrainerCheckinsByDate(dateYmd: string): Promise<TrainerCheckIn[]> {
  const res = await supabase.rpc("anvil_get_trainer_checkins_by_date", {
    p_date: dateYmd,
  });
  if (res.error) throw res.error;
  const rows = (res.data ?? []) as RawTrainerCheckInRow[];
  return rows.map(mapTrainerCheckInRow);
}

/** Date keys (YYYY-MM-DD) in range with at least one check-in — for timeline day dots. */
export async function fetchTrainerCheckInDateKeysInRange(params: {
  startYmd: string;
  endYmd: string;
}): Promise<Set<string>> {
  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) throw new Error("Not authenticated");

  const res = await supabase
    .from("clientCheckIns")
    .select("scheduledFor")
    .eq("trainerId", uid)
    .gte("scheduledFor", params.startYmd)
    .lte("scheduledFor", params.endYmd);

  if (res.error) throw res.error;

  const set = new Set<string>();
  for (const row of res.data ?? []) {
    const raw = (row as { scheduledFor?: string }).scheduledFor;
    if (typeof raw === "string") set.add(raw.slice(0, 10));
  }
  return set;
}

export async function upsertClientCheckin(params: {
  id: string | null;
  clientId: string;
  scheduledFor: string;
  scheduledTime: string | null;
  status: CheckInStatus;
  notes: string | null;
  metricSummary: string | null;
  sortOrder: number | null;
}): Promise<void> {
  const res = await supabase.rpc("anvil_upsert_client_checkin", {
    p_id: params.id,
    p_client_id: params.clientId,
    p_scheduled_for: params.scheduledFor,
    p_scheduled_time: params.scheduledTime,
    p_status: params.status,
    p_notes: params.notes,
    p_metric_summary: params.metricSummary,
    p_sort_order: params.sortOrder,
  });
  if (res.error) throw res.error;
}

export async function reorderClientCheckin(params: {
  checkInId: string;
  sortOrder: number;
  scheduledTime: string | null;
  scheduledFor?: string | null;
}): Promise<void> {
  const res = await supabase.rpc("anvil_reorder_client_checkin", {
    p_checkin_id: params.checkInId,
    p_sort_order: params.sortOrder,
    p_scheduled_time: params.scheduledTime,
    p_scheduled_for: params.scheduledFor ?? null,
  });
  if (res.error) throw res.error;
}

export async function deleteClientCheckin(id: string): Promise<void> {
  const res = await supabase.rpc("anvil_delete_client_checkin", { p_id: id });
  if (res.error) throw res.error;
}
