import { useState, useEffect, useCallback, useMemo } from "react";
import { Exercise } from "@/components/AddExerciseModal";
import {
  getAllCustomExercises,
  saveCustomExercise,
  deleteCustomExercise,
  updateCustomExercise,
  CustomExercise,
} from "@/services/storage";
import {
  armsExercises,
  backExercises,
  cardioExercises,
  chestExercises,
  coreExercises,
  legsExercises,
  shouldersExercises,
} from "@/constants/exercises";

// Built-in exercises combined
const BUILT_IN_EXERCISES: Exercise[] = [
  ...chestExercises,
  ...backExercises,
  ...legsExercises,
  ...cardioExercises,
  ...armsExercises,
  ...shouldersExercises,
  ...coreExercises,
];

export interface UseExercisesReturn {
  allExercises: Exercise[];
  customExercises: CustomExercise[];
  builtInExercises: Exercise[];
  addCustomExercise: (
    exercise: Omit<CustomExercise, "id" | "isCustom" | "createdAt">
  ) => CustomExercise;
  deleteCustomExercise: (exerciseId: string) => void;
  updateCustomExercise: (
    exerciseId: string,
    updates: Partial<Pick<CustomExercise, "name" | "category" | "type">>
  ) => boolean;
  refreshCustomExercises: () => void;
}

export const useExercises = (): UseExercisesReturn => {
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);

  // Load custom exercises on mount
  useEffect(() => {
    loadCustomExercises();
  }, []);

  const loadCustomExercises = useCallback(() => {
    const stored = getAllCustomExercises();
    setCustomExercises(stored);
  }, []);

  // Combine built-in and custom exercises
  const allExercises = useMemo((): Exercise[] => {
    return [...BUILT_IN_EXERCISES, ...customExercises];
  }, [customExercises]);

  const addCustomExercise = useCallback(
    (exercise: Omit<CustomExercise, "id" | "isCustom" | "createdAt">) => {
      const newExercise = saveCustomExercise(exercise);
      setCustomExercises(prev => [...prev, newExercise]);
      return newExercise;
    },
    []
  );

  const removeCustomExercise = useCallback((exerciseId: string) => {
    deleteCustomExercise(exerciseId);
    setCustomExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  }, []);

  const modifyCustomExercise = useCallback(
    (
      exerciseId: string,
      updates: Partial<Pick<CustomExercise, "name" | "category" | "type">>
    ) => {
      const success = updateCustomExercise(exerciseId, updates);
      if (success) {
        setCustomExercises(prev =>
          prev.map(ex => (ex.id === exerciseId ? { ...ex, ...updates } : ex))
        );
      }
      return success;
    },
    []
  );

  const refreshCustomExercises = useCallback(() => {
    loadCustomExercises();
  }, [loadCustomExercises]);

  return {
    allExercises,
    customExercises,
    builtInExercises: BUILT_IN_EXERCISES,
    addCustomExercise,
    deleteCustomExercise: removeCustomExercise,
    updateCustomExercise: modifyCustomExercise,
    refreshCustomExercises,
  };
};
