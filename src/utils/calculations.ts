// src/utils/calculations.ts (Create this new file)
import { CompletedWorkout } from "@/services/storage";

/**
 * Gets the Date object for the start of the current week (Sunday).
 * @param date - The reference date (defaults to now).
 * @returns Date object for the start of the week.
 */
export const getStartOfWeek = (date = new Date()): Date => {
  const dt = new Date(date);
  const day = dt.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = dt.getDate() - day; // Adjust to Sunday
  return new Date(dt.setDate(diff));
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
  return endOfWeek;
};

/**
 * Calculates statistics for the current week based on workout history.
 * @param history - Array of CompletedWorkout objects.
 * @returns Object containing weekly stats.
 */
export const calculateWeeklyStats = (
  history: CompletedWorkout[]
): { count: number; totalSeconds: number } => {
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  startOfWeek.setHours(0, 0, 0, 0); // Start of Sunday
  const endOfWeek = getEndOfWeek(now);
  endOfWeek.setHours(23, 59, 59, 999); // End of Saturday

  const startTimestamp = startOfWeek.getTime();
  const endTimestamp = endOfWeek.getTime();

  let weeklyCount = 0;
  let weeklyTotalSeconds = 0;

  history.forEach(workout => {
    if (
      workout.startTime >= startTimestamp &&
      workout.startTime <= endTimestamp
    ) {
      weeklyCount++;
      weeklyTotalSeconds += workout.durationSeconds || 0;
    }
  });

  return {
    count: weeklyCount,
    totalSeconds: weeklyTotalSeconds,
  };
};
