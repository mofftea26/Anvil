export type Tempo = {
    eccentric: string; // e.g. "3"
    bottom: string; // e.g. "0"
    concentric: string; // e.g. "1"
    top: string; // e.g. "0"
  };
  
  export type ExerciseSet = {
    id: string;
    setTypeId: string | null;
    reps: string; // keep as string for input UX
    restSec: string; // keep as string for input UX
  };
  
  export type SeriesExercise = {
    id: string;
    title: string;
    videoUrl: string | null;
  
    tempo: Tempo;
  
    sets: ExerciseSet[];
  
    // Optional text fields
    notes: string | null;
    trainerNotes: string | null;
  };
  
  export type WorkoutSeries = {
    id: string;
    label: string; // A, B, C...
    exercises: SeriesExercise[];
    durationMin?: number | null;
    durationSec?: number | null;
  };
  