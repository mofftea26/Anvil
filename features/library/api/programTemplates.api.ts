import { supabase } from "@/shared/supabase/client";
import type {
  ProgramDifficulty,
  ProgramTemplate,
  ProgramTemplateState,
  WeekState,
  DayState,
} from "../types/programTemplate";
import { STATE_VERSION } from "../types/programTemplate";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/** Build initial state for durationWeeks (weeks 1..N, days 1..7 each). */
export function buildInitialProgramState(durationWeeks: number): ProgramTemplateState {
  const weeks: WeekState[] = [];
  for (let w = 1; w <= durationWeeks; w++) {
    const days: DayState[] = [];
    for (let d = 1; d <= 7; d++) {
      days.push({ dayIndex: d, workouts: [] });
    }
    weeks.push({ weekIndex: w, days });
  }
  return { version: STATE_VERSION, weeks };
}

function normalizeState(raw: unknown): ProgramTemplateState {
  if (raw && typeof raw === "object" && "version" in raw && "weeks" in raw) {
    const obj = raw as { version: number; weeks: unknown[] };
    const weeks: WeekState[] = Array.isArray(obj.weeks)
      ? obj.weeks.map((w: any) => ({
          weekIndex: typeof w?.weekIndex === "number" ? w.weekIndex : 1,
          days: Array.isArray(w?.days)
            ? w.days.map((d: any) => ({
                dayIndex: typeof d?.dayIndex === "number" ? d.dayIndex : 1,
                workouts: Array.isArray(d?.workouts)
                  ? d.workouts
                      .filter((x: any) => x && typeof x?.workoutId === "string")
                      .map((x: any) => ({
                        workoutId: String(x.workoutId),
                        source: typeof x.source === "string" ? x.source : undefined,
                        title: typeof x.title === "string" ? x.title : undefined,
                      }))
                  : [],
              }))
            : [],
        }))
      : [];
    return { version: STATE_VERSION, weeks };
  }
  return { version: STATE_VERSION, weeks: [] };
}

type RawRow = {
  id: string;
  ownerTrainerId: string;
  status: string;
  title: string;
  description: string | null;
  durationWeeks: number | null;
  difficulty: string;
  state: unknown;
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string | null;
  isArchived: boolean;
};

function toTemplate(row: RawRow): ProgramTemplate {
  return {
    id: row.id,
    ownerTrainerId: row.ownerTrainerId,
    status: row.status,
    title: row.title,
    description: row.description ?? null,
    durationWeeks: row.durationWeeks ?? null,
    difficulty:
      row.difficulty === "intermediate" || row.difficulty === "advanced"
        ? row.difficulty
        : "beginner",
    state: normalizeState(row.state),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastEditedAt: row.lastEditedAt ?? null,
    isArchived: Boolean(row.isArchived),
  };
}

export type ListProgramTemplatesParams = {
  difficulty?: ProgramDifficulty;
  includeArchived?: boolean;
};

export async function listProgramTemplates(
  params: ListProgramTemplatesParams = {}
): Promise<ProgramTemplate[]> {
  const userId = await requireUserId();
  let q = supabase
    .from("programTemplates")
    .select("*")
    .eq("ownerTrainerId", userId)
    .order("updatedAt", { ascending: false });

  if (params.includeArchived !== true) {
    q = q.eq("isArchived", false);
  }
  if (params.difficulty) {
    q = q.eq("difficulty", params.difficulty);
  }

  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as RawRow[]).map(toTemplate);
}

export async function fetchProgramTemplateById(
  id: string
): Promise<ProgramTemplate | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("programTemplates")
    .select("*")
    .eq("id", id)
    .eq("ownerTrainerId", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return toTemplate(data as RawRow);
}

export type CreateProgramTemplatePayload = {
  title: string;
  description?: string | null;
  durationWeeks: number;
  difficulty: ProgramDifficulty;
};

export async function createProgramTemplate(
  payload: CreateProgramTemplatePayload
): Promise<ProgramTemplate> {
  const ownerTrainerId = await requireUserId();
  const state = buildInitialProgramState(payload.durationWeeks);

  const { data, error } = await supabase
    .from("programTemplates")
    .insert({
      ownerTrainerId,
      status: "published",
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      durationWeeks: payload.durationWeeks,
      difficulty: payload.difficulty,
      state,
    })
    .select("*")
    .single();

  if (error) {
    if (__DEV__) {
      console.warn("[ProgramTemplate create] Supabase error:", {
        message: error.message,
        details: error.details,
        code: error.code,
        hint: error.hint,
      });
    }
    throw error;
  }
  return toTemplate(data as RawRow);
}

export type UpdateProgramTemplatePatch = {
  title?: string;
  description?: string | null;
  durationWeeks?: number;
  difficulty?: ProgramDifficulty;
  state?: ProgramTemplateState;
};

export async function updateProgramTemplate(
  id: string,
  patch: UpdateProgramTemplatePatch
): Promise<ProgramTemplate> {
  const userId = await requireUserId();
  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title.trim();
  if (patch.description !== undefined) payload.description = patch.description ?? null;
  if (patch.durationWeeks !== undefined) payload.durationWeeks = patch.durationWeeks;
  if (patch.difficulty !== undefined) payload.difficulty = patch.difficulty;
  if (patch.state !== undefined) payload.state = patch.state;
  // Keep published
  payload.status = "published";

  const { data, error } = await supabase
    .from("programTemplates")
    .update(payload)
    .eq("id", id)
    .eq("ownerTrainerId", userId)
    .select("*")
    .single();

  if (error) {
    if (__DEV__) {
      console.warn("[ProgramTemplate update] Supabase error:", {
        message: error.message,
        details: error.details,
        code: error.code,
        hint: error.hint,
      });
    }
    throw error;
  }
  return toTemplate(data as RawRow);
}

export async function deleteProgramTemplate(id: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("programTemplates")
    .delete()
    .eq("id", id)
    .eq("ownerTrainerId", userId);

  if (error) throw error;
}

export async function archiveProgramTemplate(id: string): Promise<ProgramTemplate> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("programTemplates")
    .update({ isArchived: true, status: "published" })
    .eq("id", id)
    .eq("ownerTrainerId", userId)
    .select("*")
    .single();

  if (error) throw error;
  return toTemplate(data as RawRow);
}

/** Duplicate template: fetch then insert new with "(Copy)" suffix, new id. */
/** Add a workout to a specific day (used after creating workout from Day Planner). */
export async function addWorkoutToProgramDay(
  programId: string,
  weekIndex: number,
  dayIndex: number,
  workoutId: string,
  title: string
): Promise<ProgramTemplate> {
  const template = await fetchProgramTemplateById(programId);
  if (!template) throw new Error("Program template not found");

  const weeks = template.state.weeks.map((w) => {
    if (w.weekIndex !== weekIndex) return w;
    return {
      ...w,
      days: w.days.map((d) => {
        if (d.dayIndex !== dayIndex) return d;
        return {
          ...d,
          workouts: [...d.workouts, { workoutId, source: "workouts", title }],
        };
      }),
    };
  });

  return updateProgramTemplate(programId, { state: { version: template.state.version, weeks } });
}

export async function duplicateProgramTemplate(id: string): Promise<ProgramTemplate> {
  const template = await fetchProgramTemplateById(id);
  if (!template) throw new Error("Program template not found");

  const ownerTrainerId = await requireUserId();
  const copyTitle = `${template.title.trim()} (Copy)`;

  const { data, error } = await supabase
    .from("programTemplates")
    .insert({
      ownerTrainerId,
      status: "published",
      title: copyTitle,
      description: template.description,
      durationWeeks: template.durationWeeks,
      difficulty: template.difficulty,
      state: template.state,
    })
    .select("*")
    .single();

  if (error) throw error;
  return toTemplate(data as RawRow);
}
