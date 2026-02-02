import { supabase } from "@/shared/supabase/client";
import type {
  ProgramDifficulty,
  ProgramTemplate,
  ProgramTemplateState,
  ProgramTemplateStateV1,
  ProgramPhase,
  ProgramWeek,
  ProgramDay,
  WorkoutLibrary,
} from "../types/programTemplate";
import { JSON_STATE_VERSION, DEFAULT_PHASE_ID } from "../types/programTemplate";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/** Generate stable day id: p{phaseIndex}_w{weekIndex}_d{dayIndex} (0-based). */
function dayId(phaseIndex: number, weekIndex: number, dayIndex: number): string {
  return `p${phaseIndex}_w${weekIndex}_d${dayIndex}`;
}

/** Build default state on create: one phase, durationWeeks weeks, 7 days each as rest. */
export function buildInitialProgramState(
  durationWeeks: number,
  difficulty: ProgramDifficulty = "beginner"
): ProgramTemplateStateV1 {
  const weeks: ProgramWeek[] = [];
  for (let w = 0; w < durationWeeks; w++) {
    const days: ProgramDay[] = [];
    for (let d = 0; d < 7; d++) {
      days.push({
        id: dayId(0, w, d),
        order: d,
        label: `Day ${d + 1}`,
        type: "rest",
        workoutRef: null,
        workouts: [],
        notes: null,
      });
    }
    weeks.push({
      index: w,
      label: `Week ${w + 1}`,
      days,
    });
  }

  const phase: ProgramPhase = {
    id: DEFAULT_PHASE_ID,
    title: "Phase 1",
    description: null,
    order: 0,
    durationWeeks,
    weeks,
  };

  return {
    jsonStateVersion: JSON_STATE_VERSION,
    difficulty,
    durationWeeks,
    phases: [phase],
    workoutLibrary: {
      linkedWorkoutIds: [],
      inlineWorkouts: [],
    },
    ui: {
      selectedPhaseId: DEFAULT_PHASE_ID,
      selectedWeekIndex: 0,
      selectedDayId: null,
    },
  };
}

/** Normalize raw state: accept old shape or new, always return ProgramTemplateStateV1. */
function normalizeState(raw: unknown): ProgramTemplateState {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    // New shape
    if (
      obj.jsonStateVersion === 1 &&
      Array.isArray(obj.phases) &&
      obj.workoutLibrary &&
      typeof obj.workoutLibrary === "object"
    ) {
      const lib = obj.workoutLibrary as { linkedWorkoutIds?: unknown[]; inlineWorkouts?: unknown[] };
      return {
        jsonStateVersion: 1,
        difficulty:
          obj.difficulty === "intermediate" || obj.difficulty === "advanced"
            ? (obj.difficulty as ProgramDifficulty)
            : "beginner",
        durationWeeks: typeof obj.durationWeeks === "number" ? obj.durationWeeks : 6,
        phases: (obj.phases as ProgramPhase[]).map((p: ProgramPhase) => ({
          ...p,
          weeks: (p.weeks ?? []).map((wk: ProgramWeek) => ({
            ...wk,
            days: (wk.days ?? []).map((d: ProgramDay) => {
              const workouts = Array.isArray(d.workouts)
                ? d.workouts
                : d.workoutRef
                  ? [d.workoutRef]
                  : [];
              return {
                id: d.id ?? "",
                order: typeof d.order === "number" ? d.order : 0,
                label: typeof d.label === "string" ? d.label : "Day",
                type: workouts.length > 0 ? "workout" : "rest",
                workoutRef: workouts[0] ?? null,
                workouts,
                notes: d.notes ?? null,
              };
            }),
          })),
        })),
        workoutLibrary: {
          linkedWorkoutIds: Array.isArray(lib.linkedWorkoutIds) ? lib.linkedWorkoutIds : [],
          inlineWorkouts: Array.isArray(lib.inlineWorkouts) ? lib.inlineWorkouts : [],
        },
        ui: obj.ui as ProgramTemplateState["ui"],
      };
    }
    // Old shape: version + weeks
    if (obj.version === 1 && Array.isArray(obj.weeks)) {
      const phases: ProgramPhase[] = [
        {
          id: DEFAULT_PHASE_ID,
          title: "Phase 1",
          description: null,
          order: 0,
          durationWeeks: (obj.weeks as unknown[]).length,
          weeks: (obj.weeks as Array<{ weekIndex?: number; days?: Array<{ dayIndex?: number; workouts?: Array<{ workoutId: string; title?: string }> }> }>).map(
            (w, wi) => ({
              index: wi,
              label: `Week ${(w.weekIndex ?? wi) + 1}`,
              days: Array.from({ length: 7 }, (_, di) => {
                const day = w.days?.[di];
                const workouts = day?.workouts ?? [];
                const first = workouts[0];
                const ref = first
                  ? { source: "workoutsTable" as const, workoutId: first.workoutId }
                  : null;
                const workoutRefs = first ? [ref!] : [];
                return {
                  id: dayId(0, wi, di),
                  order: di,
                  label: `Day ${di + 1}`,
                  type: first ? "workout" : "rest",
                  workoutRef: ref,
                  workouts: workoutRefs,
                  notes: null,
                };
              }),
            })
          ),
        },
      ];
      const linkedIds: string[] = [];
      (obj.weeks as Array<{ days?: Array<{ workouts?: Array<{ workoutId: string }> }> }>).forEach((w) =>
        w.days?.forEach((d) =>
          d.workouts?.forEach((x) => {
            if (x.workoutId && !linkedIds.includes(x.workoutId)) linkedIds.push(x.workoutId);
          })
        )
      );
      return {
        jsonStateVersion: 1,
        difficulty: "beginner",
        durationWeeks: obj.weeks.length,
        phases,
        workoutLibrary: { linkedWorkoutIds: linkedIds, inlineWorkouts: [] },
      };
    }
  }
  return buildInitialProgramState(6, "beginner");
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
  const state = buildInitialProgramState(payload.durationWeeks, payload.difficulty);

  const insertPayload = {
    ownerTrainerId,
    status: "published",
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    durationWeeks: payload.durationWeeks,
    difficulty: payload.difficulty,
    state,
  };

  const { data, error } = await supabase
    .from("programTemplates")
    .insert(insertPayload)
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

/** Append a workout to a day (from workouts table). */
export function setDayWorkoutFromTable(
  state: ProgramTemplateState,
  phaseIndex: number,
  weekIndex: number,
  dayOrder: number,
  workoutId: string
): ProgramTemplateState {
  const ref = { source: "workoutsTable" as const, workoutId };
  const phases = state.phases.map((p, pi) => {
    if (pi !== phaseIndex) return p;
    return {
      ...p,
      weeks: p.weeks.map((w, wi) => {
        if (wi !== weekIndex) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.order !== dayOrder) return d;
            const workouts = [...(d.workouts ?? (d.workoutRef ? [d.workoutRef] : [])), ref];
            return {
              ...d,
              type: "workout",
              workoutRef: workouts[0] ?? null,
              workouts,
            };
          }),
        };
      }),
    };
  });
  const linked = state.workoutLibrary.linkedWorkoutIds.includes(workoutId)
    ? state.workoutLibrary.linkedWorkoutIds
    : [...state.workoutLibrary.linkedWorkoutIds, workoutId];
  return {
    ...state,
    phases,
    workoutLibrary: {
      ...state.workoutLibrary,
      linkedWorkoutIds: linked,
    },
  };
}

/** Remove workout at index from a day. If none left, day becomes rest. */
export function removeWorkoutFromDayAt(
  state: ProgramTemplateState,
  phaseIndex: number,
  weekIndex: number,
  dayOrder: number,
  workoutIndex: number
): ProgramTemplateState {
  const phases = state.phases.map((p, pi) => {
    if (pi !== phaseIndex) return p;
    return {
      ...p,
      weeks: p.weeks.map((w, wi) => {
        if (wi !== weekIndex) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.order !== dayOrder) return d;
            const list = d.workouts ?? (d.workoutRef ? [d.workoutRef] : []);
            const next = list.filter((_, i) => i !== workoutIndex);
            return {
              ...d,
              type: next.length > 0 ? "workout" : "rest",
              workoutRef: next[0] ?? null,
              workouts: next,
            };
          }),
        };
      }),
    };
  });
  const linked = collectLinkedWorkoutIds(phases);
  return {
    ...state,
    phases,
    workoutLibrary: { ...state.workoutLibrary, linkedWorkoutIds: linked },
  };
}

function collectLinkedWorkoutIds(phases: ProgramPhase[]): string[] {
  const set = new Set<string>();
  phases.forEach((p) =>
    p.weeks.forEach((w) =>
      w.days.forEach((d) => {
        const list = d.workouts ?? (d.workoutRef ? [d.workoutRef] : []);
        list.forEach((r) => {
          if (r?.source === "workoutsTable") set.add(r.workoutId);
        });
      })
    )
  );
  return Array.from(set);
}

/** Add a new phase (default 4 weeks, 7 days each). */
export function addPhase(state: ProgramTemplateState): ProgramTemplateState {
  const phaseIndex = state.phases.length;
  const phaseId = `phase_${phaseIndex}`;
  const defaultWeeks = 4;
  const weeks: ProgramWeek[] = [];
  for (let w = 0; w < defaultWeeks; w++) {
    weeks.push({
      index: w,
      label: `Week ${w + 1}`,
      days: Array.from({ length: 7 }, (_, d) => ({
        id: `p${phaseIndex}_w${w}_d${d}`,
        order: d,
        label: `Day ${d + 1}`,
        type: "rest" as const,
        workoutRef: null,
        workouts: [],
        notes: null,
      })),
    });
  }
  const newPhase: ProgramPhase = {
    id: phaseId,
    title: `Phase ${phaseIndex + 1}`,
    description: null,
    order: phaseIndex,
    durationWeeks: defaultWeeks,
    weeks,
  };
  const newPhases = [...state.phases, newPhase];
  const totalWeeks = newPhases.reduce((sum, p) => sum + p.durationWeeks, 0);
  return {
    ...state,
    durationWeeks: totalWeeks,
    phases: newPhases,
  };
}

/** Add a week to the given phase (and bump state.durationWeeks). */
export function addPhaseWeek(state: ProgramTemplateState, phaseIndex: number): ProgramTemplateState {
  const phase = state.phases[phaseIndex];
  if (!phase) return state;
  const newWeekIndex = phase.weeks.length;
  const newWeek: ProgramWeek = {
    index: newWeekIndex,
    label: `Week ${newWeekIndex + 1}`,
    days: Array.from({ length: 7 }, (_, d) => ({
      id: `p${phaseIndex}_w${newWeekIndex}_d${d}`,
      order: d,
      label: `Day ${d + 1}`,
      type: "rest" as const,
      workoutRef: null,
      workouts: [],
      notes: null,
    })),
  };
  const newWeeks = [...phase.weeks, newWeek];
  const newPhases = state.phases.map((p, i) =>
    i === phaseIndex ? { ...p, weeks: newWeeks, durationWeeks: newWeeks.length } : p
  );
  const totalWeeks = newPhases.reduce((sum, p) => sum + p.durationWeeks, 0);
  return {
    ...state,
    durationWeeks: totalWeeks,
    phases: newPhases,
  };
}

/** Remove last week from the given phase. */
export function removePhaseWeek(state: ProgramTemplateState, phaseIndex: number): ProgramTemplateState {
  const phase = state.phases[phaseIndex];
  if (!phase || phase.weeks.length <= 1) return state;
  const newWeeks = phase.weeks.slice(0, -1);
  const newPhases = state.phases.map((p, i) =>
    i === phaseIndex ? { ...p, weeks: newWeeks, durationWeeks: newWeeks.length } : p
  );
  const totalWeeks = newPhases.reduce((sum, p) => sum + p.durationWeeks, 0);
  return {
    ...state,
    durationWeeks: totalWeeks,
    phases: newPhases,
  };
}

/** Remove phase at index. Only if more than one phase. */
export function removePhase(state: ProgramTemplateState, phaseIndex: number): ProgramTemplateState {
  if (state.phases.length <= 1) return state;
  const newPhases = state.phases.filter((_, i) => i !== phaseIndex);
  const totalWeeks = newPhases.reduce((sum, p) => sum + p.durationWeeks, 0);
  return {
    ...state,
    durationWeeks: totalWeeks,
    phases: newPhases,
  };
}

/** Clear all workouts from a day (set to rest). */
export function clearDayWorkout(
  state: ProgramTemplateState,
  phaseIndex: number,
  weekIndex: number,
  dayOrder: number
): ProgramTemplateState {
  const phases = state.phases.map((p, pi) => {
    if (pi !== phaseIndex) return p;
    return {
      ...p,
      weeks: p.weeks.map((w, wi) => {
        if (wi !== weekIndex) return w;
        return {
          ...w,
          days: w.days.map((d) =>
            d.order === dayOrder
              ? { ...d, type: "rest" as const, workoutRef: null, workouts: [] }
              : d
          ),
        };
      }),
    };
  });
  const linked = collectLinkedWorkoutIds(phases);
  return {
    ...state,
    phases,
    workoutLibrary: { ...state.workoutLibrary, linkedWorkoutIds: linked },
  };
}

/** Add a workout to a day (from workouts table). Used after picking or creating workout. */
export async function addWorkoutToProgramDay(
  programId: string,
  phaseIndex: number,
  weekIndex: number,
  dayOrder: number,
  workoutId: string
): Promise<ProgramTemplate> {
  const template = await fetchProgramTemplateById(programId);
  if (!template) throw new Error("Program template not found");

  const nextState = setDayWorkoutFromTable(
    template.state,
    phaseIndex,
    weekIndex,
    dayOrder,
    workoutId
  );
  return updateProgramTemplate(programId, { state: nextState });
}

/** Remove workout from a day (set to rest). */
export function removeDayWorkout(
  state: ProgramTemplateState,
  phaseIndex: number,
  weekIndex: number,
  dayOrder: number
): ProgramTemplateState {
  return clearDayWorkout(state, phaseIndex, weekIndex, dayOrder);
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
