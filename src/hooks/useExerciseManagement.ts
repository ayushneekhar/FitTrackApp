import { useState, useCallback } from "react";
import { Alert } from "react-native";
import uuid from "react-native-uuid";
import { WorkoutExercise, WorkoutSet, WeightUnit } from "@/services/storage";
import { Exercise } from "@/components/AddExerciseModal";

interface UseExerciseManagementProps {
  defaultUnit: WeightUnit;
  defaultReps?: number;
  defaultWeight?: number;
  defaultSetCount?: number;
  defaultRestDuration?: number;
}

export const useExerciseManagement = ({
  defaultUnit,
  defaultReps = 12,
  defaultWeight = 0,
  defaultSetCount = 3,
  defaultRestDuration = 60,
}: UseExerciseManagementProps) => {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  const createDefaultSets = useCallback((): WorkoutSet[] => {
    const sets: WorkoutSet[] = [];
    for (let i = 0; i < defaultSetCount; i++) {
      sets.push({
        id: uuid.v4() as string,
        reps: defaultReps,
        weight: defaultWeight.toString(),
        unit: defaultUnit,
      });
    }
    return sets;
  }, [defaultUnit, defaultReps, defaultWeight, defaultSetCount]);

  const addExercises = useCallback(
    (selectedExercises: Exercise[]) => {
      const newWorkoutExercises: WorkoutExercise[] = selectedExercises.map(
        ex => ({
          ...ex,
          instanceId: uuid.v4() as string,
          sets: createDefaultSets(),
          defaultRestSeconds: defaultRestDuration,
        })
      );
      setExercises(prevExercises => [...prevExercises, ...newWorkoutExercises]);
    },
    [createDefaultSets, defaultRestDuration]
  );

  const removeExercise = useCallback((instanceIdToRemove: string) => {
    setExercises(prev =>
      prev.filter(ex => ex.instanceId !== instanceIdToRemove)
    );
  }, []);

  const addSet = useCallback(
    (instanceId: string) => {
      setExercises(prevExercises =>
        prevExercises.map(ex => {
          if (ex.instanceId === instanceId) {
            const newSet: WorkoutSet = {
              id: uuid.v4() as string,
              reps: defaultReps,
              weight: defaultWeight.toString(),
              unit: defaultUnit,
            };
            return { ...ex, sets: [...ex.sets, newSet] };
          }
          return ex;
        })
      );
    },
    [defaultReps, defaultWeight, defaultUnit]
  );

  const removeSet = useCallback((instanceId: string, setIdToRemove: string) => {
    setExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.instanceId === instanceId) {
          if (ex.sets.length <= 1) {
            Alert.alert(
              "Cannot Remove",
              "Each exercise must have at least one set."
            );
            return ex;
          }
          const updatedSets = ex.sets.filter(set => set.id !== setIdToRemove);
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  }, []);

  const updateReps = useCallback(
    (instanceId: string, setId: string, newReps: string) => {
      const reps = parseInt(newReps, 10);
      setExercises(prevExercises =>
        prevExercises.map(ex => {
          if (ex.instanceId === instanceId) {
            const updatedSets = ex.sets.map(set => {
              if (set.id === setId) {
                return { ...set, reps: isNaN(reps) ? 0 : reps };
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

  const updateWeight = useCallback(
    (instanceId: string, setId: string, newWeight: string) => {
      const cleanedWeight = newWeight.replace(/[^0-9.]/g, "");
      const parts = cleanedWeight.split(".");
      const validatedWeight =
        parts.length > 1
          ? `${parts[0]}.${parts.slice(1).join("")}`
          : cleanedWeight;

      setExercises(prevExercises =>
        prevExercises.map(ex => {
          if (ex.instanceId === instanceId) {
            const updatedSets = ex.sets.map(set => {
              if (set.id === setId) {
                return { ...set, weight: validatedWeight };
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

  const updateUnit = useCallback(
    (instanceId: string, setId: string, newUnit: WeightUnit) => {
      setExercises(prevExercises =>
        prevExercises.map(ex => {
          if (ex.instanceId === instanceId) {
            const updatedSets = ex.sets.map(set => {
              if (set.id === setId) {
                return { ...set, unit: newUnit };
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

  const updateRest = useCallback((instanceId: string, newRest: string) => {
    const rest = parseInt(newRest, 10);
    setExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.instanceId === instanceId) {
          return {
            ...ex,
            defaultRestSeconds: isNaN(rest) ? undefined : rest,
          };
        }
        return ex;
      })
    );
  }, []);

  return {
    exercises,
    setExercises,
    addExercises,
    removeExercise,
    addSet,
    removeSet,
    updateReps,
    updateWeight,
    updateUnit,
    updateRest,
  };
};
