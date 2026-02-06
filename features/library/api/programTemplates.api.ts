import { supabase } from "@/shared/supabase/client";
import type {
  DayWorkoutRef,
  InlineWorkout,
  ProgramDay,
  ProgramDifficulty,
  ProgramPhase,
  ProgramTemplate,
  ProgramTemplateState,
  ProgramTemplateStateV1,
  ProgramWeek,
} from "../types/programTemplate";
import { JSON_STATE_VERSION } from "../types/programTemplate";

function phaseId(phaseIndex: number): string {
  return `phase_${phaseIndex}`;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/** Generate stable day id: p{phaseIndex}_w{weekIndex}_d{dayIndex} (0-based). */
function dayId(
  phaseIndex: number,
  weekIndex: number,
  dayIndex: number
): string {
  return `p${phaseIndex}_w${weekIndex}_d${dayIndex}`;
}

/**
 * Build default state on create: phaseCount phases with durationWeeks split
 * evenly (first phases get +1 week when remainder). Each week has 7 rest days.
 */
export function buildInitialProgramState(
  durationWeeks: number,
  difficulty: ProgramDifficulty = "beginner",
  phaseCount: number = 1
): ProgramTemplateStateV1 {
  const count = Math.max(1, Math.min(phaseCount, durationWeeks));
  const baseWeeks = Math.floor(durationWeeks / count);
  const remainder = durationWeeks % count;
  const phaseWeekCounts: number[] = [];
  for (let i = 0; i < count; i++) {
    phaseWeekCounts.push(baseWeeks + (i < remainder ? 1 : 0));
  }

  const phases: ProgramPhase[] = [];
  let globalWeekIndex = 0;
  for (let p = 0; p < count; p++) {
    const phaseWeeks = phaseWeekCounts[p];
    const weeks: ProgramWeek[] = [];
    for (let w = 0; w < phaseWeeks; w++) {
      const days: ProgramDay[] = [];
      for (let d = 0; d < 7; d++) {
        days.push({
          id: dayId(p, w, d),
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
      globalWeekIndex++;
    }
    phases.push({
      id: phaseId(p),
      title: `Phase ${p + 1}`,
      description: null,
      order: p,
      durationWeeks: phaseWeeks,
      weeks,
    });
  }

  return {
    jsonStateVersion: JSON_STATE_VERSION,
    difficulty,
    durationWeeks,
    phases,
    workoutLibrary: {
      linkedWorkoutIds: [],
      inlineWorkouts: [],
    },
    ui: {
      selectedPhaseId: phaseId(0),
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
      const lib = obj.workoutLibrary as {
        linkedWorkoutIds?: unknown[];
        inlineWorkouts?: unknown[];
      };
      return {
        jsonStateVersion: 1,
        difficulty:
          obj.difficulty === "intermediate" || obj.difficulty === "advanced"
            ? (obj.difficulty as ProgramDifficulty)
            : "beginner",
        durationWeeks:
          typeof obj.durationWeeks === "number" ? obj.durationWeeks : 6,
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
          linkedWorkoutIds: Array.isArray(lib.linkedWorkoutIds)
            ? (lib.linkedWorkoutIds.filter(
                (x: unknown): x is string => typeof x === "string"
              ) as string[])
            : [],
          inlineWorkouts: Array.isArray(lib.inlineWorkouts)
            ? (lib.inlineWorkouts.filter((x: unknown): x is InlineWorkout => {
                if (!x || typeof x !== "object") return false;
                const v = x as {
                  id?: unknown;
                  title?: unknown;
                  state?: unknown;
                };
                return (
                  typeof v.id === "string" &&
                  typeof v.title === "string" &&
                  "state" in v
                );
              }) as InlineWorkout[])
            : [],
        },
        ui: obj.ui as ProgramTemplateState["ui"],
      };
    }
    // Old shape: version + weeks
    if (obj.version === 1 && Array.isArray(obj.weeks)) {
      const phases: ProgramPhase[] = [
        {
          id: phaseId(0),
          title: "Phase 1",
          description: null,
          order: 0,
          durationWeeks: (obj.weeks as unknown[]).length,
          weeks: (
            obj.weeks as Array<{
              weekIndex?: number;
              days?: Array<{
                dayIndex?: number;
                workouts?: Array<{ workoutId: string; title?: string }>;
              }>;
            }>
          ).map((w, wi) => ({
            index: wi,
            label: `Week ${(w.weekIndex ?? wi) + 1}`,
            days: Array.from({ length: 7 }, (_, di) => {
              const day = w.days?.[di];
              const workouts = day?.workouts ?? [];
              const first = workouts[0];
              const ref = first
                ? {
                    source: "workoutsTable" as const,
                    workoutId: first.workoutId,
                  }
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
          })),
        },
      ];
      const linkedIds: string[] = [];
      (
        obj.weeks as Array<{
          days?: Array<{ workouts?: Array<{ workoutId: string }> }>;
        }>
      ).forEach((w) =>
        w.days?.forEach((d) =>
          d.workouts?.forEach((x) => {
            if (x.workoutId && !linkedIds.includes(x.workoutId))
              linkedIds.push(x.workoutId);
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
  /** If true, include archived in the list (default: only non-archived). */
  includeArchived?: boolean;
  /** If true, return only archived programs (e.g. for "Archived" tab). */
  archivedOnly?: boolean;
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

  if (params.archivedOnly === true) {
    q = q.eq("isArchived", true);
  } else if (params.includeArchived !== true) {
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
  /** Number of phases; weeks are split evenly. Default 1. */
  phaseCount?: number;
};

export async function createProgramTemplate(
  payload: CreateProgramTemplatePayload
): Promise<ProgramTemplate> {
  const ownerTrainerId = await requireUserId();
  const state = buildInitialProgramState(
    payload.durationWeeks,
    payload.difficulty,
    payload.phaseCount ?? 1
  );

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
  if (patch.description !== undefined)
    payload.description = patch.description ?? null;
  if (patch.durationWeeks !== undefined)
    payload.durationWeeks = patch.durationWeeks;
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

export async function archiveProgramTemplate(
  id: string
): Promise<ProgramTemplate> {
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

export async function unarchiveProgramTemplate(
  id: string
): Promise<ProgramTemplate> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("programTemplates")
    .update({ isArchived: false, status: "published" })
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
  const phases: ProgramPhase[] = state.phases.map((p, pi) => {
    if (pi !== phaseIndex) return p;
    return {
      ...p,
      weeks: p.weeks.map((w, wi) => {
        if (wi !== weekIndex) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.order !== dayOrder) return d;
            const workouts = [
              ...(d.workouts ?? (d.workoutRef ? [d.workoutRef] : [])),
              ref,
            ];
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
  const phases: ProgramPhase[] = state.phases.map((p, pi) => {
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

/** Append a workout ref to a day (for move/copy). */
export function addRefToDay(
  state: ProgramTemplateState,
  phaseIndex: number,
  weekIndex: number,
  dayOrder: number,
  ref: DayWorkoutRef
): ProgramTemplateState {
  if (!ref) return state;
  const phases: ProgramPhase[] = state.phases.map((p, pi) => {
    if (pi !== phaseIndex) return p;
    return {
      ...p,
      weeks: p.weeks.map((w, wi) => {
        if (wi !== weekIndex) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.order !== dayOrder) return d;
            const workouts = [
              ...(d.workouts ?? (d.workoutRef ? [d.workoutRef] : [])),
              ref,
            ];
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
  const workoutId = ref.source === "workoutsTable" ? ref.workoutId : null;
  const linked =
    workoutId && !state.workoutLibrary.linkedWorkoutIds.includes(workoutId)
      ? [...state.workoutLibrary.linkedWorkoutIds, workoutId]
      : state.workoutLibrary.linkedWorkoutIds;
  return {
    ...state,
    phases,
    workoutLibrary: { ...state.workoutLibrary, linkedWorkoutIds: linked },
  };
}

/** Move a workout from one day to another (same phase/week). */
export function moveWorkoutBetweenDays(
  state: ProgramTemplateState,
  phaseIndex: number,
  weekIndex: number,
  fromDayOrder: number,
  workoutIndex: number,
  toDayOrder: number
): ProgramTemplateState {
  const phase = state.phases[phaseIndex];
  const week = phase?.weeks[weekIndex];
  const fromDay = week?.days.find((d) => d.order === fromDayOrder);
  const list =
    fromDay?.workouts ?? (fromDay?.workoutRef ? [fromDay.workoutRef] : []);
  const ref = list[workoutIndex] ?? null;
  if (!ref) return state;
  const removed = removeWorkoutFromDayAt(
    state,
    phaseIndex,
    weekIndex,
    fromDayOrder,
    workoutIndex
  );
  return addRefToDay(removed, phaseIndex, weekIndex, toDayOrder, ref);
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
export function addPhaseWeek(
  state: ProgramTemplateState,
  phaseIndex: number
): ProgramTemplateState {
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
    i === phaseIndex
      ? { ...p, weeks: newWeeks, durationWeeks: newWeeks.length }
      : p
  );
  const totalWeeks = newPhases.reduce((sum, p) => sum + p.durationWeeks, 0);
  return {
    ...state,
    durationWeeks: totalWeeks,
    phases: newPhases,
  };
}

/** Remove week at weekIndex from the given phase, then renumber weeks (Week 1, 2, 3...). */
export function removePhaseWeek(
  state: ProgramTemplateState,
  phaseIndex: number,
  weekIndex: number
): ProgramTemplateState {
  const phase = state.phases[phaseIndex];
  if (!phase || phase.weeks.length <= 1) return state;
  if (weekIndex < 0 || weekIndex >= phase.weeks.length) return state;
  const newWeeks = phase.weeks
    .filter((_, i) => i !== weekIndex)
    .map((w, i) => ({
      ...w,
      index: i,
      label: `Week ${i + 1}`,
    }));
  const newPhases = state.phases.map((p, i) =>
    i === phaseIndex
      ? { ...p, weeks: newWeeks, durationWeeks: newWeeks.length }
      : p
  );
  const totalWeeks = newPhases.reduce((sum, p) => sum + p.durationWeeks, 0);
  return {
    ...state,
    durationWeeks: totalWeeks,
    phases: newPhases,
  };
}

/** Remove phase at index, then renumber phases (Phase 1, 2, 3...). Only if more than one phase. */
export function removePhase(
  state: ProgramTemplateState,
  phaseIndex: number
): ProgramTemplateState {
  if (state.phases.length <= 1) return state;
  const newPhases = state.phases
    .filter((_, i) => i !== phaseIndex)
    .map((p, i) => ({
      ...p,
      order: i,
      title: `Phase ${i + 1}`,
    }));
  const totalWeeks = newPhases.reduce((sum, p) => sum + p.durationWeeks, 0);
  return {
    ...state,
    durationWeeks: totalWeeks,
    phases: newPhases,
  };
}

/** Duplicate the week at weekIndex (same phase); inserted after it. All week labels renumbered as "Week 1", "Week 2", etc. */
export function duplicateWeek(
  state: ProgramTemplateState,
  phaseIndex: number,
  weekIndex: number
): ProgramTemplateState {
  const phase = state.phases[phaseIndex];
  if (!phase || weekIndex < 0 || weekIndex >= phase.weeks.length) return state;
  const sourceWeek = phase.weeks[weekIndex];
  const newWeekIndex = weekIndex + 1;
  const newWeek: ProgramWeek = {
    index: newWeekIndex,
    label: `Week ${newWeekIndex + 1}`,
    days: sourceWeek.days.map((d, di) => ({
      ...d,
      id: `p${phaseIndex}_w${newWeekIndex}_d${di}`,
      workouts: [...(d.workouts ?? (d.workoutRef ? [d.workoutRef] : []))],
      workoutRef: d.workouts?.[0] ?? d.workoutRef ?? null,
    })),
  };
  const reindexedWeeks = [
    ...phase.weeks.slice(0, newWeekIndex),
    newWeek,
    ...phase.weeks.slice(newWeekIndex),
  ].map((w, i) => ({
    ...w,
    index: i,
    label: `Week ${i + 1}`,
  }));
  const newPhases = state.phases.map((p, i) =>
    i === phaseIndex
      ? { ...p, weeks: reindexedWeeks, durationWeeks: reindexedWeeks.length }
      : p
  );
  const totalWeeks = newPhases.reduce((sum, p) => sum + p.durationWeeks, 0);
  return {
    ...state,
    durationWeeks: totalWeeks,
    phases: newPhases,
  };
}

/** Reorder phases: move from fromIndex to toIndex. */
export function reorderPhases(
  state: ProgramTemplateState,
  fromIndex: number,
  toIndex: number
): ProgramTemplateState {
  if (fromIndex === toIndex) return state;
  const phases = [...state.phases];
  const [removed] = phases.splice(fromIndex, 1);
  phases.splice(toIndex, 0, removed);
  const newPhases = phases.map((p, i) => ({
    ...p,
    order: i,
    title: `Phase ${i + 1}`,
  }));
  const totalWeeks = newPhases.reduce((sum, p) => sum + p.durationWeeks, 0);
  return {
    ...state,
    durationWeeks: totalWeeks,
    phases: newPhases,
  };
}

/** Reorder weeks within a phase: move from fromIndex to toIndex. */
export function reorderWeeksInPhase(
  state: ProgramTemplateState,
  phaseIndex: number,
  fromIndex: number,
  toIndex: number
): ProgramTemplateState {
  if (fromIndex === toIndex) return state;
  const phase = state.phases[phaseIndex];
  if (!phase) return state;
  const weeks = [...phase.weeks];
  const [removed] = weeks.splice(fromIndex, 1);
  weeks.splice(toIndex, 0, removed);
  const newWeeks = weeks.map((w, i) => ({
    ...w,
    index: i,
    label: `Week ${i + 1}`,
  }));
  const newPhases = state.phases.map((p, i) =>
    i === phaseIndex
      ? { ...p, weeks: newWeeks, durationWeeks: newWeeks.length }
      : p
  );
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

export async function duplicateProgramTemplate(
  id: string
): Promise<ProgramTemplate> {
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
