import { useState, useEffect, useRef } from "react";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import {
  WorkoutDraft,
  saveWorkoutDraft,
  getWorkoutDraft,
  clearWorkoutDraft,
} from "@/services/storage";
import { WorkoutExercise } from "@/services/storage";
import { Alert } from "react-native";

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
  setAddedExercises,
  setWorkoutName,
  setWorkoutType,
  setDuration,
  defaultUnit,
}: UseWorkoutDraftProps) => {
  const navigation = useNavigation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const savedRef = useRef(false);

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
            },
          },
          {
            text: "Resume",
            onPress: () => {
              setWorkoutName(draft.name);
              setWorkoutType(draft.type);
              setDuration(draft.durationEstimate?.toString() || "");
              setAddedExercises(draft.exercises);
            },
          },
        ],
        { cancelable: false }
      );
    }
    savedRef.current = false;
  }, []);

  usePreventRemove(hasUnsavedChanges, () => {
    console.log("hasUnsavedChanges", hasUnsavedChanges);
    if (!hasUnsavedChanges || savedRef.current) return;
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
  });

  return {
    hasUnsavedChanges,
    savedRef,
  };
};
