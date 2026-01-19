import { useCallback, useState } from "react";
import { publishWorkoutDraft } from "../api/workouts.api";

export function usePublishWorkoutDraft() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const publish = useCallback(async (draftId: string, title?: string | null) => {
    try {
      setIsPublishing(true);
      setPublishError(null);

      const res = await publishWorkoutDraft(draftId, title ?? null);
      return res.workoutId;
    } catch (e: any) {
      setPublishError(e?.message ?? "Failed to publish workout");
      return null;
    } finally {
      setIsPublishing(false);
    }
  }, []);

  return {
    publish,
    isPublishing,
    publishError,
  };
}
