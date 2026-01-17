# Architecture Pack - Chunk 2: Store + API Wiring + Endpoint Definitions

## Overview
This chunk implements the data layer foundation:
- Update shared base API with new tag types
- Create all feature API slices with endpoint definitions (stubs)
- Create minimal Redux slices for UI state (only where needed)
- Create RPC contract type files
- Update rootReducer
- Remove profile slice (server state only in RTK Query)

## 1. Update Shared Base API

**File: `src/shared/api/api.ts`**

Add new tag types for all features:
- `Program` - program data
- `ProgramPhase` - program phases
- `WorkoutDay` - workout days
- `Exercise` - exercise library
- `Assignment` - program assignments
- `WorkoutHistory` - completed workouts

## 2. Remove Profile Slice

**File: `src/store/rootReducer.ts`**

Remove `profileReducer` - profile data lives only in RTK Query cache.

## 3. Feature API Slices

### 3.1 Program Builder API

**File: `src/features/programBuilder/api/programBuilderApiTypes.ts`**

```typescript
// RPC Contract Types - exact match with backend RPC signatures

// RPC: anvil_create_program(title, description)
export type CreateProgramArgs = {
  title: string;
  description: string | null;
};
export type CreateProgramResult = {
  id: string;
};

// RPC: anvil_list_programs_for_trainer()
export type ListProgramsArgs = void;
export type ListProgramsResult = {
  id: string;
  trainerId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}[];

// RPC: anvil_get_program(programId)
export type GetProgramArgs = {
  programId: string;
};
export type GetProgramResult = {
  id: string;
  trainerId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

// RPC: anvil_update_program(programId, title, description)
export type UpdateProgramArgs = {
  programId: string;
  title?: string;
  description?: string | null;
};
export type UpdateProgramResult = null;

// RPC: anvil_delete_program(programId)
export type DeleteProgramArgs = {
  programId: string;
};
export type DeleteProgramResult = null;

// RPC: anvil_create_program_phase(programId, title, durationWeeks)
export type CreateProgramPhaseArgs = {
  programId: string;
  title: string;
  durationWeeks: number;
};
export type CreateProgramPhaseResult = {
  id: string;
};

// RPC: anvil_get_program_phases(programId)
export type GetProgramPhasesArgs = {
  programId: string;
};
export type GetProgramPhasesResult = {
  id: string;
  programId: string;
  title: string;
  durationWeeks: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}[];

// RPC: anvil_update_program_phase(phaseId, title, durationWeeks)
export type UpdateProgramPhaseArgs = {
  phaseId: string;
  title?: string;
  durationWeeks?: number;
};
export type UpdateProgramPhaseResult = null;

// RPC: anvil_delete_program_phase(phaseId)
export type DeleteProgramPhaseArgs = {
  phaseId: string;
};
export type DeleteProgramPhaseResult = null;

// RPC: anvil_create_workout_day(phaseId, dayOfWeek, title)
export type CreateWorkoutDayArgs = {
  phaseId: string;
  dayOfWeek: number;
  title: string;
};
export type CreateWorkoutDayResult = {
  id: string;
};

// RPC: anvil_get_workout_days(phaseId)
export type GetWorkoutDaysArgs = {
  phaseId: string;
};
export type GetWorkoutDaysResult = {
  id: string;
  phaseId: string;
  dayOfWeek: number;
  title: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}[];

// RPC: anvil_update_workout_day(workoutDayId, title, dayOfWeek)
export type UpdateWorkoutDayArgs = {
  workoutDayId: string;
  title?: string;
  dayOfWeek?: number;
};
export type UpdateWorkoutDayResult = null;

// RPC: anvil_delete_workout_day(workoutDayId)
export type DeleteWorkoutDayArgs = {
  workoutDayId: string;
};
export type DeleteWorkoutDayResult = null;

// RPC: anvil_add_exercise_to_workout_day(workoutDayId, exerciseId, sets, reps, weight, restSeconds, notes)
export type AddExerciseToWorkoutDayArgs = {
  workoutDayId: string;
  exerciseId: string;
  sets: number;
  reps: number | null;
  weight: number | null;
  restSeconds: number | null;
  notes: string | null;
};
export type AddExerciseToWorkoutDayResult = {
  id: string;
};

// RPC: anvil_get_workout_day_exercises(workoutDayId)
export type GetWorkoutDayExercisesArgs = {
  workoutDayId: string;
};
export type GetWorkoutDayExercisesResult = {
  id: string;
  workoutDayId: string;
  exerciseId: string;
  sets: number;
  reps: number | null;
  weight: number | null;
  restSeconds: number | null;
  notes: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}[];

// RPC: anvil_update_workout_day_exercise(workoutDayExerciseId, sets, reps, weight, restSeconds, notes)
export type UpdateWorkoutDayExerciseArgs = {
  workoutDayExerciseId: string;
  sets?: number;
  reps?: number | null;
  weight?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
};
export type UpdateWorkoutDayExerciseResult = null;

// RPC: anvil_delete_workout_day_exercise(workoutDayExerciseId)
export type DeleteWorkoutDayExerciseArgs = {
  workoutDayExerciseId: string;
};
export type DeleteWorkoutDayExerciseResult = null;
```

**File: `src/features/programBuilder/api/programBuilderApiSlice.ts`**

```typescript
import { api } from "../../../shared/api/api";
import { supabase } from "../../../shared/supabase/client";
import type {
  CreateProgramArgs,
  CreateProgramResult,
  ListProgramsArgs,
  ListProgramsResult,
  GetProgramArgs,
  GetProgramResult,
  UpdateProgramArgs,
  UpdateProgramResult,
  DeleteProgramArgs,
  DeleteProgramResult,
  CreateProgramPhaseArgs,
  CreateProgramPhaseResult,
  GetProgramPhasesArgs,
  GetProgramPhasesResult,
  UpdateProgramPhaseArgs,
  UpdateProgramPhaseResult,
  DeleteProgramPhaseArgs,
  DeleteProgramPhaseResult,
  CreateWorkoutDayArgs,
  CreateWorkoutDayResult,
  GetWorkoutDaysArgs,
  GetWorkoutDaysResult,
  UpdateWorkoutDayArgs,
  UpdateWorkoutDayResult,
  DeleteWorkoutDayArgs,
  DeleteWorkoutDayResult,
  AddExerciseToWorkoutDayArgs,
  AddExerciseToWorkoutDayResult,
  GetWorkoutDayExercisesArgs,
  GetWorkoutDayExercisesResult,
  UpdateWorkoutDayExerciseArgs,
  UpdateWorkoutDayExerciseResult,
  DeleteWorkoutDayExerciseArgs,
  DeleteWorkoutDayExerciseResult,
} from "./programBuilderApiTypes";

export const programBuilderApiSlice = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    createProgram: build.mutation<CreateProgramResult, CreateProgramArgs>({
      async queryFn(args) {
        const { data, error } = await supabase.rpc("anvil_create_program", {
          title: args.title,
          description: args.description,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as CreateProgramResult };
      },
      invalidatesTags: ["Program"],
    }),

    listPrograms: build.query<ListProgramsResult, ListProgramsArgs>({
      async queryFn() {
        const { data, error } = await supabase.rpc("anvil_list_programs_for_trainer");
        if (error) return { error: { message: error.message } };
        return { data: (data as ListProgramsResult) ?? [] };
      },
      providesTags: ["Program"],
    }),

    getProgram: build.query<GetProgramResult, GetProgramArgs>({
      async queryFn({ programId }) {
        const { data, error } = await supabase.rpc("anvil_get_program", {
          programId,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as GetProgramResult };
      },
      providesTags: (_res, _err, { programId }) => [{ type: "Program", id: programId }],
    }),

    updateProgram: build.mutation<UpdateProgramResult, UpdateProgramArgs>({
      async queryFn(args) {
        const { error } = await supabase.rpc("anvil_update_program", {
          programId: args.programId,
          title: args.title,
          description: args.description,
        });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: (_res, _err, { programId }) => [{ type: "Program", id: programId }],
    }),

    deleteProgram: build.mutation<DeleteProgramResult, DeleteProgramArgs>({
      async queryFn({ programId }) {
        const { error } = await supabase.rpc("anvil_delete_program", { programId });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Program"],
    }),

    createProgramPhase: build.mutation<CreateProgramPhaseResult, CreateProgramPhaseArgs>({
      async queryFn(args) {
        const { data, error } = await supabase.rpc("anvil_create_program_phase", {
          programId: args.programId,
          title: args.title,
          durationWeeks: args.durationWeeks,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as CreateProgramPhaseResult };
      },
      invalidatesTags: (_res, _err, { programId }) => [{ type: "Program", id: programId }],
    }),

    getProgramPhases: build.query<GetProgramPhasesResult, GetProgramPhasesArgs>({
      async queryFn({ programId }) {
        const { data, error } = await supabase.rpc("anvil_get_program_phases", { programId });
        if (error) return { error: { message: error.message } };
        return { data: (data as GetProgramPhasesResult) ?? [] };
      },
      providesTags: (_res, _err, { programId }) => [{ type: "Program", id: programId }],
    }),

    updateProgramPhase: build.mutation<UpdateProgramPhaseResult, UpdateProgramPhaseArgs>({
      async queryFn(args) {
        const { error } = await supabase.rpc("anvil_update_program_phase", {
          phaseId: args.phaseId,
          title: args.title,
          durationWeeks: args.durationWeeks,
        });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Program"],
    }),

    deleteProgramPhase: build.mutation<DeleteProgramPhaseResult, DeleteProgramPhaseArgs>({
      async queryFn({ phaseId }) {
        const { error } = await supabase.rpc("anvil_delete_program_phase", { phaseId });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Program"],
    }),

    createWorkoutDay: build.mutation<CreateWorkoutDayResult, CreateWorkoutDayArgs>({
      async queryFn(args) {
        const { data, error } = await supabase.rpc("anvil_create_workout_day", {
          phaseId: args.phaseId,
          dayOfWeek: args.dayOfWeek,
          title: args.title,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as CreateWorkoutDayResult };
      },
      invalidatesTags: ["Program"],
    }),

    getWorkoutDays: build.query<GetWorkoutDaysResult, GetWorkoutDaysArgs>({
      async queryFn({ phaseId }) {
        const { data, error } = await supabase.rpc("anvil_get_workout_days", { phaseId });
        if (error) return { error: { message: error.message } };
        return { data: (data as GetWorkoutDaysResult) ?? [] };
      },
      providesTags: ["Program"],
    }),

    updateWorkoutDay: build.mutation<UpdateWorkoutDayResult, UpdateWorkoutDayArgs>({
      async queryFn(args) {
        const { error } = await supabase.rpc("anvil_update_workout_day", {
          workoutDayId: args.workoutDayId,
          title: args.title,
          dayOfWeek: args.dayOfWeek,
        });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Program"],
    }),

    deleteWorkoutDay: build.mutation<DeleteWorkoutDayResult, DeleteWorkoutDayArgs>({
      async queryFn({ workoutDayId }) {
        const { error } = await supabase.rpc("anvil_delete_workout_day", { workoutDayId });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Program"],
    }),

    addExerciseToWorkoutDay: build.mutation<
      AddExerciseToWorkoutDayResult,
      AddExerciseToWorkoutDayArgs
    >({
      async queryFn(args) {
        const { data, error } = await supabase.rpc("anvil_add_exercise_to_workout_day", {
          workoutDayId: args.workoutDayId,
          exerciseId: args.exerciseId,
          sets: args.sets,
          reps: args.reps,
          weight: args.weight,
          restSeconds: args.restSeconds,
          notes: args.notes,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as AddExerciseToWorkoutDayResult };
      },
      invalidatesTags: ["Program"],
    }),

    getWorkoutDayExercises: build.query<GetWorkoutDayExercisesResult, GetWorkoutDayExercisesArgs>({
      async queryFn({ workoutDayId }) {
        const { data, error } = await supabase.rpc("anvil_get_workout_day_exercises", {
          workoutDayId,
        });
        if (error) return { error: { message: error.message } };
        return { data: (data as GetWorkoutDayExercisesResult) ?? [] };
      },
      providesTags: ["Program"],
    }),

    updateWorkoutDayExercise: build.mutation<
      UpdateWorkoutDayExerciseResult,
      UpdateWorkoutDayExerciseArgs
    >({
      async queryFn(args) {
        const { error } = await supabase.rpc("anvil_update_workout_day_exercise", {
          workoutDayExerciseId: args.workoutDayExerciseId,
          sets: args.sets,
          reps: args.reps,
          weight: args.weight,
          restSeconds: args.restSeconds,
          notes: args.notes,
        });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Program"],
    }),

    deleteWorkoutDayExercise: build.mutation<
      DeleteWorkoutDayExerciseResult,
      DeleteWorkoutDayExerciseArgs
    >({
      async queryFn({ workoutDayExerciseId }) {
        const { error } = await supabase.rpc("anvil_delete_workout_day_exercise", {
          workoutDayExerciseId,
        });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Program"],
    }),
  }),
});

export const {
  useCreateProgramMutation,
  useListProgramsQuery,
  useGetProgramQuery,
  useUpdateProgramMutation,
  useDeleteProgramMutation,
  useCreateProgramPhaseMutation,
  useGetProgramPhasesQuery,
  useUpdateProgramPhaseMutation,
  useDeleteProgramPhaseMutation,
  useCreateWorkoutDayMutation,
  useGetWorkoutDaysQuery,
  useUpdateWorkoutDayMutation,
  useDeleteWorkoutDayMutation,
  useAddExerciseToWorkoutDayMutation,
  useGetWorkoutDayExercisesQuery,
  useUpdateWorkoutDayExerciseMutation,
  useDeleteWorkoutDayExerciseMutation,
} = programBuilderApiSlice;
```

### 3.2 Exercises API

**File: `src/features/exercises/api/exercisesApiTypes.ts`**

```typescript
// RPC Contract Types

// RPC: anvil_list_exercises_for_trainer()
export type ListExercisesArgs = void;
export type ListExercisesResult = {
  id: string;
  trainerId: string;
  title: string;
  description: string | null;
  category: string | null;
  muscleGroups: string[] | null;
  equipment: string | null;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}[];

// RPC: anvil_get_exercise(exerciseId)
export type GetExerciseArgs = {
  exerciseId: string;
};
export type GetExerciseResult = {
  id: string;
  trainerId: string;
  title: string;
  description: string | null;
  category: string | null;
  muscleGroups: string[] | null;
  equipment: string | null;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
};

// RPC: anvil_create_custom_exercise(title, description, category, muscleGroups, equipment)
export type CreateCustomExerciseArgs = {
  title: string;
  description: string | null;
  category: string | null;
  muscleGroups: string[] | null;
  equipment: string | null;
};
export type CreateCustomExerciseResult = {
  id: string;
};

// RPC: anvil_update_custom_exercise(exerciseId, title, description, category, muscleGroups, equipment)
export type UpdateCustomExerciseArgs = {
  exerciseId: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  muscleGroups?: string[] | null;
  equipment?: string | null;
};
export type UpdateCustomExerciseResult = null;

// RPC: anvil_delete_custom_exercise(exerciseId)
export type DeleteCustomExerciseArgs = {
  exerciseId: string;
};
export type DeleteCustomExerciseResult = null;
```

**File: `src/features/exercises/api/exercisesApiSlice.ts`**

```typescript
import { api } from "../../../shared/api/api";
import { supabase } from "../../../shared/supabase/client";
import type {
  ListExercisesArgs,
  ListExercisesResult,
  GetExerciseArgs,
  GetExerciseResult,
  CreateCustomExerciseArgs,
  CreateCustomExerciseResult,
  UpdateCustomExerciseArgs,
  UpdateCustomExerciseResult,
  DeleteCustomExerciseArgs,
  DeleteCustomExerciseResult,
} from "./exercisesApiTypes";

export const exercisesApiSlice = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    listExercises: build.query<ListExercisesResult, ListExercisesArgs>({
      async queryFn() {
        const { data, error } = await supabase.rpc("anvil_list_exercises_for_trainer");
        if (error) return { error: { message: error.message } };
        return { data: (data as ListExercisesResult) ?? [] };
      },
      providesTags: ["Exercise"],
    }),

    getExercise: build.query<GetExerciseResult, GetExerciseArgs>({
      async queryFn({ exerciseId }) {
        const { data, error } = await supabase.rpc("anvil_get_exercise", { exerciseId });
        if (error) return { error: { message: error.message } };
        return { data: data as GetExerciseResult };
      },
      providesTags: (_res, _err, { exerciseId }) => [{ type: "Exercise", id: exerciseId }],
    }),

    createCustomExercise: build.mutation<CreateCustomExerciseResult, CreateCustomExerciseArgs>({
      async queryFn(args) {
        const { data, error } = await supabase.rpc("anvil_create_custom_exercise", {
          title: args.title,
          description: args.description,
          category: args.category,
          muscleGroups: args.muscleGroups,
          equipment: args.equipment,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as CreateCustomExerciseResult };
      },
      invalidatesTags: ["Exercise"],
    }),

    updateCustomExercise: build.mutation<UpdateCustomExerciseResult, UpdateCustomExerciseArgs>({
      async queryFn(args) {
        const { error } = await supabase.rpc("anvil_update_custom_exercise", {
          exerciseId: args.exerciseId,
          title: args.title,
          description: args.description,
          category: args.category,
          muscleGroups: args.muscleGroups,
          equipment: args.equipment,
        });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: (_res, _err, { exerciseId }) => [{ type: "Exercise", id: exerciseId }],
    }),

    deleteCustomExercise: build.mutation<DeleteCustomExerciseResult, DeleteCustomExerciseArgs>({
      async queryFn({ exerciseId }) {
        const { error } = await supabase.rpc("anvil_delete_custom_exercise", { exerciseId });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Exercise"],
    }),
  }),
});

export const {
  useListExercisesQuery,
  useGetExerciseQuery,
  useCreateCustomExerciseMutation,
  useUpdateCustomExerciseMutation,
  useDeleteCustomExerciseMutation,
} = exercisesApiSlice;
```

### 3.3 Assignment API

**File: `src/features/assignment/api/assignmentApiTypes.ts`**

```typescript
// RPC Contract Types

// RPC: anvil_assign_program_to_client(clientId, programId, startDate)
export type AssignProgramArgs = {
  clientId: string;
  programId: string;
  startDate: string; // ISO date string
};
export type AssignProgramResult = {
  id: string;
};

// RPC: anvil_get_client_assignments(clientId)
export type GetClientAssignmentsArgs = {
  clientId: string;
};
export type GetClientAssignmentsResult = {
  id: string;
  clientId: string;
  programId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}[];

// RPC: anvil_get_active_program_assignment()
export type GetActiveProgramAssignmentArgs = void;
export type GetActiveProgramAssignmentResult = {
  id: string;
  clientId: string;
  programId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} | null;

// RPC: anvil_end_program_assignment(assignmentId)
export type EndProgramAssignmentArgs = {
  assignmentId: string;
};
export type EndProgramAssignmentResult = null;
```

**File: `src/features/assignment/api/assignmentApiSlice.ts`**

```typescript
import { api } from "../../../shared/api/api";
import { supabase } from "../../../shared/supabase/client";
import type {
  AssignProgramArgs,
  AssignProgramResult,
  GetClientAssignmentsArgs,
  GetClientAssignmentsResult,
  GetActiveProgramAssignmentArgs,
  GetActiveProgramAssignmentResult,
  EndProgramAssignmentArgs,
  EndProgramAssignmentResult,
} from "./assignmentApiTypes";

export const assignmentApiSlice = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    assignProgram: build.mutation<AssignProgramResult, AssignProgramArgs>({
      async queryFn(args) {
        const { data, error } = await supabase.rpc("anvil_assign_program_to_client", {
          clientId: args.clientId,
          programId: args.programId,
          startDate: args.startDate,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as AssignProgramResult };
      },
      invalidatesTags: ["Assignment"],
    }),

    getClientAssignments: build.query<GetClientAssignmentsResult, GetClientAssignmentsArgs>({
      async queryFn({ clientId }) {
        const { data, error } = await supabase.rpc("anvil_get_client_assignments", { clientId });
        if (error) return { error: { message: error.message } };
        return { data: (data as GetClientAssignmentsResult) ?? [] };
      },
      providesTags: (_res, _err, { clientId }) => [{ type: "Assignment", id: clientId }],
    }),

    getActiveProgramAssignment: build.query<
      GetActiveProgramAssignmentResult,
      GetActiveProgramAssignmentArgs
    >({
      async queryFn() {
        const { data, error } = await supabase.rpc("anvil_get_active_program_assignment");
        if (error) return { error: { message: error.message } };
        return { data: (data as GetActiveProgramAssignmentResult) ?? null };
      },
      providesTags: ["Assignment"],
    }),

    endProgramAssignment: build.mutation<EndProgramAssignmentResult, EndProgramAssignmentArgs>({
      async queryFn({ assignmentId }) {
        const { error } = await supabase.rpc("anvil_end_program_assignment", { assignmentId });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["Assignment"],
    }),
  }),
});

export const {
  useAssignProgramMutation,
  useGetClientAssignmentsQuery,
  useGetActiveProgramAssignmentQuery,
  useEndProgramAssignmentMutation,
} = assignmentApiSlice;
```

### 3.4 Runner API

**File: `src/features/runner/api/runnerApiTypes.ts`**

```typescript
// RPC Contract Types

// RPC: anvil_get_workout_day_for_client(workoutDayId)
export type GetWorkoutDayForClientArgs = {
  workoutDayId: string;
};
export type GetWorkoutDayForClientResult = {
  id: string;
  phaseId: string;
  dayOfWeek: number;
  title: string;
  orderIndex: number;
  exercises: {
    id: string;
    workoutDayId: string;
    exerciseId: string;
    exercise: {
      id: string;
      title: string;
      description: string | null;
    };
    sets: number;
    reps: number | null;
    weight: number | null;
    restSeconds: number | null;
    notes: string | null;
    orderIndex: number;
  }[];
  createdAt: string;
  updatedAt: string;
};

// RPC: anvil_start_workout(workoutDayId)
export type StartWorkoutArgs = {
  workoutDayId: string;
};
export type StartWorkoutResult = {
  id: string;
};

// RPC: anvil_complete_workout(workoutId)
export type CompleteWorkoutArgs = {
  workoutId: string;
};
export type CompleteWorkoutResult = null;

// RPC: anvil_log_workout_set(workoutId, workoutDayExerciseId, setNumber, reps, weight, restSeconds)
export type LogWorkoutSetArgs = {
  workoutId: string;
  workoutDayExerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  restSeconds: number | null;
};
export type LogWorkoutSetResult = {
  id: string;
};

// RPC: anvil_get_workout_sets(workoutId)
export type GetWorkoutSetsArgs = {
  workoutId: string;
};
export type GetWorkoutSetsResult = {
  id: string;
  workoutId: string;
  workoutDayExerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  restSeconds: number | null;
  completedAt: string;
}[];

// RPC: anvil_get_workout_history()
export type GetWorkoutHistoryArgs = void;
export type GetWorkoutHistoryResult = {
  id: string;
  workoutDayId: string;
  workoutDay: {
    id: string;
    title: string;
  };
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}[];

// RPC: anvil_get_workout_details(workoutId)
export type GetWorkoutDetailsArgs = {
  workoutId: string;
};
export type GetWorkoutDetailsResult = {
  id: string;
  workoutDayId: string;
  workoutDay: {
    id: string;
    title: string;
  };
  startedAt: string;
  completedAt: string | null;
  sets: {
    id: string;
    workoutDayExerciseId: string;
    setNumber: number;
    reps: number | null;
    weight: number | null;
    restSeconds: number | null;
    completedAt: string;
  }[];
  createdAt: string;
};
```

**File: `src/features/runner/api/runnerApiSlice.ts`**

```typescript
import { api } from "../../../shared/api/api";
import { supabase } from "../../../shared/supabase/client";
import type {
  GetWorkoutDayForClientArgs,
  GetWorkoutDayForClientResult,
  StartWorkoutArgs,
  StartWorkoutResult,
  CompleteWorkoutArgs,
  CompleteWorkoutResult,
  LogWorkoutSetArgs,
  LogWorkoutSetResult,
  GetWorkoutSetsArgs,
  GetWorkoutSetsResult,
  GetWorkoutHistoryArgs,
  GetWorkoutHistoryResult,
  GetWorkoutDetailsArgs,
  GetWorkoutDetailsResult,
} from "./runnerApiTypes";

export const runnerApiSlice = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    getWorkoutDayForClient: build.query<GetWorkoutDayForClientResult, GetWorkoutDayForClientArgs>({
      async queryFn({ workoutDayId }) {
        const { data, error } = await supabase.rpc("anvil_get_workout_day_for_client", {
          workoutDayId,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as GetWorkoutDayForClientResult };
      },
      providesTags: (_res, _err, { workoutDayId }) => [{ type: "WorkoutDay", id: workoutDayId }],
    }),

    startWorkout: build.mutation<StartWorkoutResult, StartWorkoutArgs>({
      async queryFn({ workoutDayId }) {
        const { data, error } = await supabase.rpc("anvil_start_workout", { workoutDayId });
        if (error) return { error: { message: error.message } };
        return { data: data as StartWorkoutResult };
      },
      invalidatesTags: ["WorkoutHistory"],
    }),

    completeWorkout: build.mutation<CompleteWorkoutResult, CompleteWorkoutArgs>({
      async queryFn({ workoutId }) {
        const { error } = await supabase.rpc("anvil_complete_workout", { workoutId });
        if (error) return { error: { message: error.message } };
        return { data: null };
      },
      invalidatesTags: ["WorkoutHistory"],
    }),

    logWorkoutSet: build.mutation<LogWorkoutSetResult, LogWorkoutSetArgs>({
      async queryFn(args) {
        const { data, error } = await supabase.rpc("anvil_log_workout_set", {
          workoutId: args.workoutId,
          workoutDayExerciseId: args.workoutDayExerciseId,
          setNumber: args.setNumber,
          reps: args.reps,
          weight: args.weight,
          restSeconds: args.restSeconds,
        });
        if (error) return { error: { message: error.message } };
        return { data: data as LogWorkoutSetResult };
      },
      invalidatesTags: ["WorkoutHistory"],
    }),

    getWorkoutSets: build.query<GetWorkoutSetsResult, GetWorkoutSetsArgs>({
      async queryFn({ workoutId }) {
        const { data, error } = await supabase.rpc("anvil_get_workout_sets", { workoutId });
        if (error) return { error: { message: error.message } };
        return { data: (data as GetWorkoutSetsResult) ?? [] };
      },
      providesTags: (_res, _err, { workoutId }) => [{ type: "WorkoutHistory", id: workoutId }],
    }),

    getWorkoutHistory: build.query<GetWorkoutHistoryResult, GetWorkoutHistoryArgs>({
      async queryFn() {
        const { data, error } = await supabase.rpc("anvil_get_workout_history");
        if (error) return { error: { message: error.message } };
        return { data: (data as GetWorkoutHistoryResult) ?? [] };
      },
      providesTags: ["WorkoutHistory"],
    }),

    getWorkoutDetails: build.query<GetWorkoutDetailsResult, GetWorkoutDetailsArgs>({
      async queryFn({ workoutId }) {
        const { data, error } = await supabase.rpc("anvil_get_workout_details", { workoutId });
        if (error) return { error: { message: error.message } };
        return { data: data as GetWorkoutDetailsResult };
      },
      providesTags: (_res, _err, { workoutId }) => [{ type: "WorkoutHistory", id: workoutId }],
    }),
  }),
});

export const {
  useGetWorkoutDayForClientQuery,
  useStartWorkoutMutation,
  useCompleteWorkoutMutation,
  useLogWorkoutSetMutation,
  useGetWorkoutSetsQuery,
  useGetWorkoutHistoryQuery,
  useGetWorkoutDetailsQuery,
} = runnerApiSlice;
```

## 4. Redux Slices (Minimal UI State Only)

### 4.1 Program Builder Slice

**File: `src/features/programBuilder/store/programBuilderSlice.ts`**

```typescript
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ProgramBuilderState = {
  selectedExerciseIds: string[]; // Only if needed across screens
  activeTab: "overview" | "exercises" | "schedule" | null; // Only if persists across navigation
};

const initialState: ProgramBuilderState = {
  selectedExerciseIds: [],
  activeTab: null,
};

export const programBuilderSlice = createSlice({
  name: "programBuilder",
  initialState,
  reducers: {
    setSelectedExerciseIds(state, action: PayloadAction<string[]>) {
      state.selectedExerciseIds = action.payload;
    },
    toggleExerciseSelection(state, action: PayloadAction<string>) {
      const index = state.selectedExerciseIds.indexOf(action.payload);
      if (index === -1) {
        state.selectedExerciseIds.push(action.payload);
      } else {
        state.selectedExerciseIds.splice(index, 1);
      }
    },
    setActiveTab(state, action: PayloadAction<"overview" | "exercises" | "schedule" | null>) {
      state.activeTab = action.payload;
    },
    resetProgramBuilder() {
      return initialState;
    },
  },
});

export const programBuilderActions = programBuilderSlice.actions;
export const programBuilderReducer = programBuilderSlice.reducer;
```

### 4.2 Runner Slice

**File: `src/features/runner/store/runnerSlice.ts`**

```typescript
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type TimerState = "idle" | "running" | "paused";

type RunnerState = {
  currentSetIndex: number;
  timerState: TimerState;
  timerSeconds: number;
  completedSets: string[]; // workoutSet IDs
};

const initialState: RunnerState = {
  currentSetIndex: 0,
  timerState: "idle",
  timerSeconds: 0,
  completedSets: [],
};

export const runnerSlice = createSlice({
  name: "runner",
  initialState,
  reducers: {
    setCurrentSetIndex(state, action: PayloadAction<number>) {
      state.currentSetIndex = action.payload;
    },
    startTimer(state) {
      state.timerState = "running";
    },
    pauseTimer(state) {
      state.timerState = "paused";
    },
    stopTimer(state) {
      state.timerState = "idle";
      state.timerSeconds = 0;
    },
    setTimerSeconds(state, action: PayloadAction<number>) {
      state.timerSeconds = action.payload;
    },
    addCompletedSet(state, action: PayloadAction<string>) {
      if (!state.completedSets.includes(action.payload)) {
        state.completedSets.push(action.payload);
      }
    },
    removeCompletedSet(state, action: PayloadAction<string>) {
      state.completedSets = state.completedSets.filter((id) => id !== action.payload);
    },
    resetRunner() {
      return initialState;
    },
  },
});

export const runnerActions = runnerSlice.actions;
export const runnerReducer = runnerSlice.reducer;
```

### 4.3 Exercises Slice (Optional - only if picker state needs to persist)

**File: `src/features/exercises/store/exercisesSlice.ts`**

```typescript
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ExercisesState = {
  pickerOpen: boolean; // Only if picker state must persist across screens
};

const initialState: ExercisesState = {
  pickerOpen: false,
};

export const exercisesSlice = createSlice({
  name: "exercises",
  initialState,
  reducers: {
    setPickerOpen(state, action: PayloadAction<boolean>) {
      state.pickerOpen = action.payload;
    },
    resetExercises() {
      return initialState;
    },
  },
});

export const exercisesActions = exercisesSlice.actions;
export const exercisesReducer = exercisesSlice.reducer;
```

**Note**: Assignment feature doesn't need a slice - filters/selected client can be local state.

## 5. Update Root Reducer

**File: `src/store/rootReducer.ts`**

```typescript
import { combineReducers } from "@reduxjs/toolkit";
import { authReducer } from "../features/auth/store/authSlice";
import { programBuilderReducer } from "../features/programBuilder/store/programBuilderSlice";
import { runnerReducer } from "../features/runner/store/runnerSlice";
import { exercisesReducer } from "../features/exercises/store/exercisesSlice";
import { api } from "../shared/api/api";

export const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
  programBuilder: programBuilderReducer,
  runner: runnerReducer,
  exercises: exercisesReducer,
  // Profile slice removed - data only in RTK Query cache
});
```

## 6. Update Shared API Tag Types

**File: `src/shared/api/api.ts`**

```typescript
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

export type ApiError = {
  message: string;
};

/**
 * Shared RTK Query API instance.
 * Feature modules should `injectEndpoints` from here to keep things modular.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: [
    "User",
    "Profile",
    "Auth",
    "TrainerClients",
    "TrainerInvites",
    "TrainerRequests",
    "Coach",
    "Program", // NEW
    "ProgramPhase", // NEW
    "WorkoutDay", // NEW
    "Exercise", // NEW
    "Assignment", // NEW
    "WorkoutHistory", // NEW
  ],
  endpoints: () => ({}),
});
```

## 7. Implementation Checklist

- [ ] Update `src/shared/api/api.ts` with new tag types
- [ ] Remove `profileReducer` from `src/store/rootReducer.ts`
- [ ] Create `src/features/programBuilder/api/programBuilderApiTypes.ts`
- [ ] Create `src/features/programBuilder/api/programBuilderApiSlice.ts`
- [ ] Create `src/features/programBuilder/store/programBuilderSlice.ts`
- [ ] Create `src/features/exercises/api/exercisesApiTypes.ts`
- [ ] Create `src/features/exercises/api/exercisesApiSlice.ts`
- [ ] Create `src/features/exercises/store/exercisesSlice.ts` (optional)
- [ ] Create `src/features/assignment/api/assignmentApiTypes.ts`
- [ ] Create `src/features/assignment/api/assignmentApiSlice.ts`
- [ ] Create `src/features/runner/api/runnerApiTypes.ts`
- [ ] Create `src/features/runner/api/runnerApiSlice.ts`
- [ ] Create `src/features/runner/store/runnerSlice.ts`
- [ ] Update `src/store/rootReducer.ts` with new reducers
- [ ] Verify all endpoints use correct RPC signatures (no trainerId/userId unless required)
- [ ] Verify all field names match DB schema exactly (title not name, trainerId camelCase)

## 8. Notes

- All RPC calls use `supabase.rpc()` with exact function names and argument shapes
- No `trainerId`/`userId` in args unless RPC signature requires it
- Field names match DB exactly: `title` (not `name`), `trainerId` (camelCase), `createdAt`/`updatedAt`
- Redux slices are minimal - only for cross-screen UI state
- Form/draft state uses `react-hook-form` or local `useState`
- All server state lives in RTK Query cache
