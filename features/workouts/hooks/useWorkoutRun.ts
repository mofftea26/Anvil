import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { appToast } from "@/shared/ui";

import {
  finishWorkoutSession,
  getOrCreateInProgressSession,
  listWorkoutSetLogs,
  upsertWorkoutSetLogs,
} from "../api/clientWorkouts.api";
import type {
  ClientWorkoutAssignment,
  WorkoutSetLogDraft,
  WorkoutSession,
  WorkoutTemplate,
} from "../types";

type Key = string;
function makeKey(exerciseId: string, setIndex: number): Key {
  return `${exerciseId}:${setIndex}`;
}

export type SetDraftVM = {
  key: string;
  setIndex: number;
  reps: string;
  weight: string;
  completed: boolean;
};

export function useWorkoutRun(params: {
  clientId: string;
  assignment: ClientWorkoutAssignment;
  template: WorkoutTemplate;
}) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [draftsByKey, setDraftsByKey] = useState<Record<Key, SetDraftVM>>({});
  const dirtyKeysRef = useRef<Set<Key>>(new Set());
  const flushTimerRef = useRef<any>(null);

  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const elapsedSec = useMemo(() => {
    if (!startedAtMs) return 0;
    return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  }, [nowMs, startedAtMs]);

  useEffect(() => {
    if (!session?.startedAt) return;
    const ms = new Date(session.startedAt).getTime();
    setStartedAtMs(Number.isFinite(ms) ? ms : Date.now());
  }, [session?.startedAt]);

  useEffect(() => {
    if (!startedAtMs) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAtMs]);

  // start/resume session + hydrate logs once
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsStarting(true);
      try {
        const { session: s, resumed } = await getOrCreateInProgressSession({
          clientId: params.clientId,
          trainerId: params.assignment.trainerId,
          workoutAssignmentId: params.assignment.id,
          workoutTemplateId: params.assignment.workoutTemplateId,
        });
        if (cancelled) return;
        setSession(s);
        appToast.success(resumed ? "Resumed session" : "Session started");

        const logs = await listWorkoutSetLogs(s.id);
        if (cancelled) return;

        setDraftsByKey((prev) => {
          const next: Record<string, SetDraftVM> = { ...prev };
          for (const block of params.template.state?.series ?? []) {
            for (const ex of block.exercises ?? []) {
              for (let setIndex = 0; setIndex < (ex.sets?.length ?? 0); setIndex++) {
                const key = makeKey(ex.id, setIndex);
                if (!next[key]) {
                  next[key] = {
                    key,
                    setIndex,
                    reps: "",
                    weight: "",
                    completed: false,
                  };
                }
              }
            }
          }
          for (const l of logs) {
            const exId = l.seriesExerciseId;
            if (!exId) continue;
            const key = makeKey(exId, l.setIndex);
            next[key] = {
              key,
              setIndex: l.setIndex,
              reps: typeof l.reps === "number" ? String(l.reps) : "",
              weight: typeof l.weight === "number" ? String(l.weight) : "",
              completed: !!l.completed,
            };
          }
          return next;
        });
      } catch (e: unknown) {
        appToast.error(e instanceof Error ? e.message : "Failed to start session");
      } finally {
        if (!cancelled) setIsStarting(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [params.assignment.id, params.assignment.trainerId, params.assignment.workoutTemplateId, params.clientId, params.template.state]);

  const flush = useCallback(async () => {
    if (!session) return;
    const dirty = Array.from(dirtyKeysRef.current);
    if (dirty.length === 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      const drafts: WorkoutSetLogDraft[] = dirty
        .map((k) => draftsByKey[k])
        .filter(Boolean)
        .map((vm) => {
          const [exerciseId] = vm.key.split(":");
          const repsNum = vm.reps.trim() === "" ? null : Number(vm.reps);
          const weightNum = vm.weight.trim() === "" ? null : Number(vm.weight);
          return {
            sessionId: session.id,
            seriesBlockId: null,
            seriesExerciseId: exerciseId || null,
            setIndex: vm.setIndex,
            reps: Number.isFinite(repsNum as any) ? (repsNum as number) : null,
            weight: Number.isFinite(weightNum as any) ? (weightNum as number) : null,
            completed: !!vm.completed,
          };
        });

      await upsertWorkoutSetLogs(drafts);
      dirtyKeysRef.current.clear();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [draftsByKey, session]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => void flush(), 700);
  }, [flush]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  const markDirty = useCallback(
    (key: Key) => {
      dirtyKeysRef.current.add(key);
      scheduleFlush();
    },
    [scheduleFlush]
  );

  const updateReps = useCallback(
    (key: Key, next: string) => {
      setDraftsByKey((prev) => {
        const cur = prev[key];
        if (!cur) return prev;
        return { ...prev, [key]: { ...cur, reps: next } };
      });
      markDirty(key);
    },
    [markDirty]
  );

  const updateWeight = useCallback(
    (key: Key, next: string) => {
      setDraftsByKey((prev) => {
        const cur = prev[key];
        if (!cur) return prev;
        return { ...prev, [key]: { ...cur, weight: next } };
      });
      markDirty(key);
    },
    [markDirty]
  );

  const toggleCompleted = useCallback(
    (key: Key) => {
      setDraftsByKey((prev) => {
        const cur = prev[key];
        if (!cur) return prev;
        return { ...prev, [key]: { ...cur, completed: !cur.completed } };
      });
      markDirty(key);
    },
    [markDirty]
  );

  const finish = useCallback(async () => {
    if (!session) return;
    await flush();
    await finishWorkoutSession({ sessionId: session.id, durationSec: elapsedSec });
  }, [elapsedSec, flush, session]);

  return {
    session,
    isStarting,
    elapsedSec,
    draftsByKey,
    updateReps,
    updateWeight,
    toggleCompleted,
    saving,
    saveError,
    flush,
    finish,
  };
}

