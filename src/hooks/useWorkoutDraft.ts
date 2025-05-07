import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { WorkoutDraft, saveWorkoutDraft, getWorkoutDraft, clearWorkoutDraft } from '@/services/storage';
import { WorkoutExercise } from '@/services/storage';

interface UseWorkoutDraftProps {
  workoutName: string;
  workoutType: string | null;
  duration: string;
  addedExercises: WorkoutExercise[];
}

export const useWorkoutDraft = ({
  workoutName,
  workoutType,
  duration,
  addedExercises,
}: UseWorkoutDraftProps) => {
  const navigation = useNavigation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const savedRef = useRef(false);

  // Effect for unsaved changes
  useEffect(() => {
    if (!isInitialLoad) {
      setHasUnsavedChanges(true);
    }
  }, [workoutName, workoutType, duration, addedExercises, isInitialLoad]);

  // Effect for loading draft
  useEffect(() => {
    const draft = getWorkoutDraft(null);
    if (draft) {
      console.log("Found Create New draft:", draft);
      Alert.alert(
        "Resume Draft?",
        "You have an unsaved workout draft. Resume editing?",
        [
          {
            text: "Discard Draft",
            style: "destructive",
            onPress: () => {
              clearWorkoutDraft(null);
              setIsInitialLoad(false);
            },
          },
          {
            text: "Resume",
            onPress: () => {
              setWorkoutName(draft.name);
              setWorkoutType(draft.type);
              setDuration(draft.durationEstimate?.toString() || "");
              // Map draft exercises, ensuring sets have IDs and default unit if missing
              const exercisesWithSetIdsAndUnits = draft.exercises.map(ex => ({
                ...ex,
                sets: ex.sets.map(set => ({
                  ...set,
                  id: set.id || (uuid.v4() as string),
                  weight: (set.weight || 0).toString(),
                  unit: (set as any).unit || defaultUnit, // Add unit from draft or default
                })),
                defaultRestSeconds: ex.defaultRestSeconds,
              }));
              setAddedExercises(exercisesWithSetIdsAndUnits);
              setIsInitialLoad(false);
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      setIsInitialLoad(false);
    }
    savedRef.current = false;
  }, []);

  // Effect for saving draft on navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", e => {
      if (!hasUnsavedChanges || savedRef.current || isInitialLoad) return;
      e.preventDefault();
      const currentDraft: WorkoutDraft = {
        templateId: null,
        name: workoutName,
        type: workoutType,
        durationEstimate: duration ? parseInt(duration, 10) : undefined,
        exercises: addedExercises.map(ex => ({
          instanceId: ex.instanceId,
          id: ex.id,
          name: ex.name,
          sets: ex.sets.map(set => ({
            id: set.id,
            reps: set.reps,
            weight: set.weight,
          })),
          defaultRestSeconds: ex.defaultRestSeconds,
        })),
        timestamp: Date.now(),
      };
      saveWorkoutDraft(currentDraft);
      console.log("Draft saved on navigating away.");
      navigation.dispatch(e.data.action);
    });
    return unsubscribe;
  }, [
    navigation,
    hasUnsavedChanges,
    isInitialLoad,
    workoutName,
    workoutType,
    duration,
    addedExercises,
  ]);

  return {
    isInitialLoad,
    hasUnsavedChanges,
    savedRef,
  };
}; 