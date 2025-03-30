// src/utils/calculations.ts
import { CompletedWorkout, WeightUnit } from "@/services/storage";

// --- Constants ---
const LBS_TO_KG_FACTOR = 0.453592;

// --- Helper Functions ---

/**
 * Gets the Date object for the start of the current week (Sunday).
 * @param date - The reference date (defaults to now).
 * @returns Date object for the start of the week.
 */
export const getStartOfWeek = (date = new Date()): Date => {
  const dt = new Date(date);
  const day = dt.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = dt.getDate() - day; // Adjust to Sunday
  dt.setDate(diff);
  dt.setHours(0, 0, 0, 0); // Set to beginning of the day
  return dt;
};

/**
 * Gets the Date object for the end of the current week (Saturday).
 * @param date - The reference date (defaults to now).
 * @returns Date object for the end of the week.
 */
export const getEndOfWeek = (date = new Date()): Date => {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Add 6 days to get Saturday
  endOfWeek.setHours(23, 59, 59, 999); // Set to end of the day
  return endOfWeek;
};

/**
 * Calculates the volume of a single set in kilograms.
 * @param reps - Number of repetitions.
 * @param weight - Weight lifted.
 * @param unit - Unit of the weight ('kg' or 'lbs').
 * @returns Volume in kilograms.
 */
const calculateSetVolumeKg = (
  reps: number,
  weight: number,
  unit: WeightUnit
): number => {
  if (reps <= 0 || weight <= 0) {
    return 0;
  }
  const weightInKg = unit === "lbs" ? weight * LBS_TO_KG_FACTOR : weight;
  return reps * weightInKg;
};

/**
 * Calculates statistics for the current week based on workout history.
 * @param history - Array of CompletedWorkout objects.
 * @returns Object containing weekly stats including count, totalSeconds, activeDays count, and totalVolumeKg.
 */
export const calculateWeeklyStats = (
  history: CompletedWorkout[]
): {
  count: number;
  totalSeconds: number;
  activeDaysCount: number;
  totalVolumeKg: number;
} => {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = getEndOfWeek(now);

  const startTimestamp = startOfWeek.getTime();
  const endTimestamp = endOfWeek.getTime();

  let weeklyCount = 0;
  let weeklyTotalSeconds = 0;
  let weeklyTotalVolumeKg = 0;
  const activeDays = new Set<string>(); // Store 'YYYY-MM-DD' strings

  history.forEach(workout => {
    if (
      workout.startTime >= startTimestamp &&
      workout.startTime <= endTimestamp
    ) {
      weeklyCount++;
      weeklyTotalSeconds += workout.durationSeconds || 0;

      // Add day to active days set
      const workoutDate = new Date(workout.startTime);
      const dateString = `${workoutDate.getFullYear()}-${workoutDate.getMonth()}-${workoutDate.getDate()}`;
      activeDays.add(dateString);

      // Calculate volume for the workout
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          // Only include volume from completed sets? Or all sets attempted? Let's include all attempted.
          weeklyTotalVolumeKg += calculateSetVolumeKg(
            set.reps,
            set.weight,
            set.unit
          );
        });
      });
    }
  });

  return {
    count: weeklyCount,
    totalSeconds: weeklyTotalSeconds,
    activeDaysCount: activeDays.size,
    totalVolumeKg: Math.round(weeklyTotalVolumeKg), // Round volume
  };
};
