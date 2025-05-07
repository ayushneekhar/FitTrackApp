import { useCallback } from 'react';
import { Alert } from 'react-native';
import { WorkoutExercise } from '@/services/storage';

interface UseWorkoutValidationProps {
  workoutName: string;
  exercises: WorkoutExercise[];
}

export const useWorkoutValidation = ({
  workoutName,
  exercises,
}: UseWorkoutValidationProps) => {
  const validateWorkout = useCallback(() => {
    if (!workoutName.trim()) {
      Alert.alert("Missing Name", "Please enter a name for the workout.");
      return false;
    }
    if (exercises.length === 0) {
      Alert.alert(
        "Missing Exercises",
        "Please add at least one exercise to the workout."
      );
      return false;
    }
    return true;
  }, [workoutName, exercises]);

  return {
    validateWorkout,
  };
}; 