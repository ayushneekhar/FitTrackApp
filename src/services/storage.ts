// src/services/storage.ts
import { MMKV } from "react-native-mmkv";
import uuid from "react-native-uuid";

// --- Interfaces (WorkoutSet, WorkoutTemplate, CompletedWorkout remain the same) ---
export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: string | null;
  durationEstimate?: number;
  exercises: Array<{
    id: string;
    name: string;
    sets: WorkoutSet[];
  }>;
}

export interface CompletedWorkout {
  id: string;
  templateId?: string;
  name: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  exercises: Array<{
    id: string;
    name: string;
    sets: Array<{
      reps: number;
      weight: number;
      completed: boolean; // <-- Add completed status
    }>;
  }>;
}

// --- NEW: Active Workout Session Interface ---
export interface ActiveWorkoutSession {
  startTime: number; // Original start time
  accumulatedSeconds: number; // Time elapsed *before* the last pause
  template: WorkoutTemplate | null; // The template being used (or null)
  // Add more state if needed: currentExerciseIndex, currentSetIndex, performedSetsData
}

export const storage = new MMKV();

// --- Storage Keys ---
const STORAGE_KEYS = {
  WORKOUT_TEMPLATES: "workoutTemplates",
  WORKOUT_HISTORY: "workoutHistory",
  ACTIVE_WORKOUT_SESSION: "activeWorkoutSession", // New key
};

// --- Helper Functions (getArray, saveArray remain the same) ---
const getArray = <T>(key: string): T[] => {
  const jsonString = storage.getString(key);
  if (jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error parsing JSON array for key "${key}":`, error);
      return [];
    }
  }
  return [];
};

const saveArray = <T>(key: string, data: T[]): void => {
  try {
    const jsonString = JSON.stringify(data);
    storage.set(key, jsonString);
  } catch (error) {
    console.error(`Error stringifying JSON array for key "${key}":`, error);
  }
};

// --- Workout Template Functions (remain the same) ---
export const getAllWorkoutTemplates = (): WorkoutTemplate[] => {
  return getArray<WorkoutTemplate>(STORAGE_KEYS.WORKOUT_TEMPLATES);
};
export const saveWorkoutTemplate = (templateToSave: WorkoutTemplate): void => {
  const templates = getAllWorkoutTemplates();
  const index = templates.findIndex(t => t.id === templateToSave.id);

  if (index === -1) {
    // Add new template if ID doesn't exist
    templates.push(templateToSave);
    console.log("Saving new template:", templateToSave.id);
  } else {
    // Update existing template if ID matches
    templates[index] = templateToSave;
    console.log("Updating existing template:", templateToSave.id);
  }
  saveArray(STORAGE_KEYS.WORKOUT_TEMPLATES, templates);
};
export const deleteWorkoutTemplate = (templateId: string): void => {
  let templates = getAllWorkoutTemplates();
  templates = templates.filter(t => t.id !== templateId);
  saveArray(STORAGE_KEYS.WORKOUT_TEMPLATES, templates);
  console.log("Deleted template:", templateId);
};

// --- Workout History Functions (remain the same) ---
export const getWorkoutHistory = (): CompletedWorkout[] => {
  return getArray<CompletedWorkout>(STORAGE_KEYS.WORKOUT_HISTORY).sort(
    (a, b) => b.startTime - a.startTime
  );
};
export const saveCompletedWorkout = (workout: CompletedWorkout): void => {
  const history = getWorkoutHistory();
  history.unshift(workout);
  saveArray(STORAGE_KEYS.WORKOUT_HISTORY, history);
};
export const clearWorkoutHistory = (): void => {
  storage.delete(STORAGE_KEYS.WORKOUT_HISTORY);
};

// --- NEW: Active Workout Session Functions ---

/**
 * Saves the current active workout session state to storage.
 * @param session - The ActiveWorkoutSession object or null to clear.
 */
export const saveActiveWorkoutSession = (
  session: ActiveWorkoutSession | null
): void => {
  try {
    if (session) {
      const jsonString = JSON.stringify(session);
      storage.set(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION, jsonString);
      console.log("Active session saved.");
    } else {
      storage.delete(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
      console.log("Active session cleared.");
    }
  } catch (error) {
    console.error("Error saving active workout session:", error);
  }
};

/**
 * Retrieves the saved active workout session from storage.
 * @returns The ActiveWorkoutSession object or null if none exists/error occurs.
 */
export const getActiveWorkoutSession = (): ActiveWorkoutSession | null => {
  const jsonString = storage.getString(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
  if (jsonString) {
    try {
      const session = JSON.parse(jsonString) as ActiveWorkoutSession;
      // Basic validation
      if (
        session &&
        typeof session.startTime === "number" &&
        typeof session.accumulatedSeconds === "number"
      ) {
        console.log("Active session retrieved.");
        return session;
      } else {
        console.warn("Invalid active session data found in storage.");
        storage.delete(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION); // Clean up invalid data
        return null;
      }
    } catch (error) {
      console.error("Error parsing active workout session:", error);
      storage.delete(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION); // Clean up invalid data
      return null;
    }
  }
  return null; // No active session found
};

/**
 * Clears the saved active workout session from storage.
 */
export const clearActiveWorkoutSession = (): void => {
  storage.delete(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
  console.log("Active session explicitly cleared.");
};

export const getWorkoutTemplateById = (
  templateId: string
): WorkoutTemplate | null => {
  const templates = getAllWorkoutTemplates();
  const template = templates.find(t => t.id === templateId);
  return template || null; // Return the found template or null
};
