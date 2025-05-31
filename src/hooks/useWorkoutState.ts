import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import uuid from "react-native-uuid";
import {
  WorkoutTemplate,
  ActiveWorkoutSession,
  WorkoutSet,
  WeightUnit,
  WorkoutTemplateExercise, // Assuming this type exists from storage
} from "@/services/storage"; // Adjust path as needed
import { useTheme } from "@/theme/ThemeContext"; // For default unit

// --- Types (Copied from original component) ---
export interface ActiveWorkoutSet extends WorkoutSet {
  completed: boolean;
  restTakenSeconds?: number;
}

export interface ActiveWorkoutExercise {
  id: string; // Exercise definition ID
  instanceId: string; // Unique ID for this instance in the workout
  name: string;
  sets: ActiveWorkoutSet[];
  defaultRestSeconds?: number; // Store default rest
}

export type ExerciseStatus = "not-started" | "in-progress" | "completed";

// --- Hook Props ---
interface UseWorkoutStateProps {
  initialTemplate?: WorkoutTemplate | null;
  resumeData?: ActiveWorkoutSession | null;
  defaultUnit: WeightUnit;
}

// --- Hook ---
export function useWorkoutState({
  initialTemplate,
  resumeData,
  defaultUnit,
}: UseWorkoutStateProps) {
  const [workoutName, setWorkoutName] = useState("New Workout");
  const [workoutExercises, setWorkoutExercises] = useState<
    ActiveWorkoutExercise[]
  >([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Indicate loading/initialization
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);

  // Ref to track if a set was just marked as complete or incomplete
  const setCompletionStatusRef = useRef<{
    index: number;
    isCompleting: boolean;
  } | null>(null);

  // Initialization Effect
  useEffect(() => {
    setIsLoading(true);
    let initialExercises: ActiveWorkoutExercise[] = [];
    let initialName = "New Workout";
    let initialIndex = 0; // Or load from resumeData if available
    let initialTemplateId: string | undefined = undefined;

    const createSetsWithDefaults = (
      sets: Array<{ id: string; reps: number; weight: number }> // Assuming this structure from template/resume
    ): ActiveWorkoutSet[] => {
      return sets.map(set => ({
        ...set,
        weight: set.weight.toString(), // Convert number to string for ActiveWorkoutSet
        unit: defaultUnit,
        completed: false, // Default to not completed
        restTakenSeconds: undefined,
      }));
    };

    // Helper to map template/resume exercises to ActiveWorkoutExercise
    const mapExercises = (
      sourceExercises: WorkoutTemplateExercise[] // Use the correct type for template exercises
    ): ActiveWorkoutExercise[] => {
      return sourceExercises.map(ex => ({
        id: ex.id,
        instanceId: ex.instanceId || (uuid.v4() as string), // Ensure instanceId exists
        name: ex.name,
        sets: createSetsWithDefaults(ex.sets), // Adapt based on actual structure
        defaultRestSeconds: ex.defaultRestSeconds,
      }));
    };

    if (resumeData?.template) {
      console.log("Resuming workout session from template:", resumeData);
      initialName = resumeData.template.name || "Resumed Workout";
      initialTemplateId = resumeData.template.id;
      initialExercises = mapExercises(resumeData.template.exercises);

      // Restore workout progress if available
      if (resumeData.workoutState) {
        console.log("Restoring workout progress...", resumeData.workoutState);
        initialIndex = resumeData.workoutState.currentExerciseIndex || 0;

        // Merge saved progress with template exercises
        initialExercises = initialExercises.map(ex => {
          const savedExercise = resumeData.workoutState?.exercises.find(
            saved => saved.instanceId === ex.instanceId
          );

          if (savedExercise) {
            // Restore set progress
            const restoredSets = ex.sets.map(set => {
              const savedSet = savedExercise.sets.find(
                saved => saved.id === set.id
              );
              if (savedSet) {
                return {
                  ...set,
                  completed: savedSet.completed,
                  reps: savedSet.reps || set.reps,
                  weight: savedSet.weight || set.weight,
                  unit: savedSet.unit || set.unit,
                  restTakenSeconds: savedSet.restTakenSeconds,
                };
              }
              return set;
            });
            return { ...ex, sets: restoredSets };
          }
          return ex;
        });
      }
    } else if (initialTemplate) {
      console.log("Starting new workout from template.");
      initialName = initialTemplate.name;
      initialTemplateId = initialTemplate.id;
      initialExercises = mapExercises(initialTemplate.exercises);
    } else {
      console.log("Starting empty workout.");
      // Keep initialExercises empty
    }

    setWorkoutName(initialName);
    setTemplateId(initialTemplateId);
    setWorkoutExercises(initialExercises);
    setCurrentExerciseIndex(initialIndex);
    setIsLoading(false);
  }, [resumeData, initialTemplate, defaultUnit]); // Rerun if these change

  const currentExercise = useMemo(() => {
    return workoutExercises[currentExerciseIndex];
  }, [workoutExercises, currentExerciseIndex]);

  const updateSetField = useCallback(
    (
      exerciseIndex: number,
      setIndex: number,
      field: keyof ActiveWorkoutSet,
      value: any
    ) => {
      setWorkoutExercises(prevExercises =>
        prevExercises.map((ex, exIdx) => {
          if (exIdx === exerciseIndex) {
            const updatedSets = ex.sets.map((set, sIdx) => {
              if (sIdx === setIndex) {
                // Basic type handling for common fields
                let processedValue = value;
                if (field === "reps") {
                  processedValue = parseInt(value, 10);
                  if (isNaN(processedValue)) processedValue = 0;
                } else if (field === "weight") {
                  // Keep weight as string to allow proper decimal input
                  // Only clean up invalid characters but preserve decimal points
                  processedValue = value.replace(/[^0-9.]/g, "");
                  // Ensure only one decimal point
                  const parts = processedValue.split(".");
                  if (parts.length > 2) {
                    processedValue = parts[0] + "." + parts.slice(1).join("");
                  }
                }
                return { ...set, [field]: processedValue };
              }
              return set;
            });
            return { ...ex, sets: updatedSets };
          }
          return ex;
        })
      );
    },
    []
  );

  const toggleSetComplete = useCallback(
    (
      setIndex: number
    ): {
      exerciseJustCompleted: boolean;
      nextDefaultRest?: number;
      isCompleting: boolean;
    } => {
      let exerciseJustCompleted = false;
      let isCompleting = false;
      let nextDefaultRest = currentExercise?.defaultRestSeconds;

      setWorkoutExercises(prevExercises => {
        const updatedExercises = prevExercises.map((ex, exIndex) => {
          if (exIndex === currentExerciseIndex) {
            const updatedSets = ex.sets.map((set, sIndex) => {
              if (sIndex === setIndex) {
                isCompleting = !set.completed; // Determine action *before* update
                return { ...set, completed: !set.completed };
              }
              return set;
            });

            const allSetsCompleted = updatedSets.every(set => set.completed);
            if (allSetsCompleted && isCompleting) {
              // Only mark exercise complete if we are *completing* the last set
              exerciseJustCompleted = true;
            }

            return { ...ex, sets: updatedSets };
          }
          return ex;
        });
        return updatedExercises;
      });

      // Store status for the orchestrator
      setCompletionStatusRef.current = { index: setIndex, isCompleting };

      return { exerciseJustCompleted, nextDefaultRest, isCompleting };
    },
    [currentExerciseIndex, currentExercise]
  );

  // Helper for the orchestrator to check the last toggle action
  const isSetCompleting = useCallback((setIndex: number): boolean => {
    return (
      setCompletionStatusRef.current?.index === setIndex &&
      setCompletionStatusRef.current?.isCompleting
    );
  }, []);

  const updateSetRestTime = useCallback(
    (exerciseIndex: number, setIndex: number, restSeconds: number) => {
      console.log(
        `Recording ${restSeconds}s rest after exercise ${exerciseIndex}, set ${setIndex}`
      );
      updateSetField(exerciseIndex, setIndex, "restTakenSeconds", restSeconds);
    },
    [updateSetField]
  );

  const getExerciseStatus = useCallback(
    (exercise: ActiveWorkoutExercise): ExerciseStatus => {
      if (!exercise || !exercise.sets || exercise.sets.length === 0) {
        return "not-started";
      }
      const totalSets = exercise.sets.length;
      const completedSets = exercise.sets.filter(set => set.completed).length;

      if (completedSets === 0) {
        return "not-started";
      } else if (completedSets === totalSets) {
        return "completed";
      } else {
        return "in-progress";
      }
    },
    []
  );

  const canGoNext = useCallback(() => {
    return currentExerciseIndex < workoutExercises.length - 1;
  }, [currentExerciseIndex, workoutExercises.length]);

  const canGoPrevious = useCallback(() => {
    return currentExerciseIndex > 0;
  }, [currentExerciseIndex]);

  // Navigation functions now return the default rest of the *target* exercise
  const nextExercise = useCallback((): number | undefined => {
    if (canGoNext()) {
      const nextIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIndex);
      return workoutExercises[nextIndex]?.defaultRestSeconds;
    }
    return undefined;
  }, [canGoNext, currentExerciseIndex, workoutExercises]);

  const prevExercise = useCallback((): number | undefined => {
    if (canGoPrevious()) {
      const prevIndex = currentExerciseIndex - 1;
      setCurrentExerciseIndex(prevIndex);
      return workoutExercises[prevIndex]?.defaultRestSeconds;
    }
    return undefined;
  }, [canGoPrevious, currentExerciseIndex, workoutExercises]);

  const selectExercise = useCallback(
    (index: number): number | undefined => {
      if (index >= 0 && index < workoutExercises.length) {
        setCurrentExerciseIndex(index);
        return workoutExercises[index]?.defaultRestSeconds;
      }
      return undefined;
    },
    [workoutExercises]
  );

  return {
    workoutName,
    templateId,
    workoutExercises,
    currentExercise,
    currentExerciseIndex,
    isLoading,
    updateSetField,
    toggleSetComplete,
    isSetCompleting, // Expose helper
    updateSetRestTime,
    nextExercise,
    prevExercise,
    selectExercise,
    getExerciseStatus,
    canGoNext,
    canGoPrevious,
  };
}
