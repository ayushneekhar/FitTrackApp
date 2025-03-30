// src/services/storage.ts
import { MMKV } from "react-native-mmkv";
import uuid from "react-native-uuid";

// --- Type for Weight Unit ---
export type WeightUnit = "lbs" | "kg";

// --- Interfaces ---
export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  unit: WeightUnit; // <-- Add unit to WorkoutSet
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: string | null;
  durationEstimate?: number;
  exercises: Array<{
    id: string;
    name: string;
    // Template sets might not need a unit, it's decided during the workout
    sets: Array<{ id: string; reps: number; weight: number }>;
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
      completed: boolean;
      unit: WeightUnit; // <-- Add unit to completed sets
    }>;
  }>;
}

export interface ActiveWorkoutSession {
  startTime: number;
  accumulatedSeconds: number;
  template: WorkoutTemplate | null;
}

// --- NEW: User Preferences Interface ---
export interface UserPreferences {
  defaultWeightUnit: WeightUnit;
}

export const storage = new MMKV();

// --- Storage Keys ---
const STORAGE_KEYS = {
  WORKOUT_TEMPLATES: "workoutTemplates",
  WORKOUT_HISTORY: "workoutHistory",
  ACTIVE_WORKOUT_SESSION: "activeWorkoutSession",
  LAST_USED_TIMESTAMPS: "lastUsedTimestamps",
  USER_PREFERENCES: "userPreferences", // <-- New key for preferences
};

// --- Helper Functions (getArray, saveArray, getObject, saveObject) ---
// ... (keep existing helper functions) ...
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

const getObject = <T extends object>(key: string): T | null => {
  const jsonString = storage.getString(key);
  if (jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return typeof data === "object" && data !== null ? (data as T) : null;
    } catch (error) {
      console.error(`Error parsing JSON object for key "${key}":`, error);
      return null;
    }
  }
  return null;
};

const saveObject = <T extends object>(key: string, data: T): void => {
  try {
    const jsonString = JSON.stringify(data);
    storage.set(key, jsonString);
  } catch (error) {
    console.error(`Error stringifying JSON object for key "${key}":`, error);
  }
};

// --- Workout Template Functions ---
// ... (keep existing template functions, note template sets don't have units) ...
export const getAllWorkoutTemplates = (): WorkoutTemplate[] => {
  return getArray<WorkoutTemplate>(STORAGE_KEYS.WORKOUT_TEMPLATES);
};
export const saveWorkoutTemplate = (templateToSave: WorkoutTemplate): void => {
  const templates = getAllWorkoutTemplates();
  const index = templates.findIndex(t => t.id === templateToSave.id);

  if (index === -1) {
    templates.push(templateToSave);
    console.log("Saving new template:", templateToSave.id);
  } else {
    templates[index] = templateToSave;
    console.log("Updating existing template:", templateToSave.id);
  }
  saveArray(STORAGE_KEYS.WORKOUT_TEMPLATES, templates);
};
export const deleteWorkoutTemplate = (templateId: string): void => {
  let templates = getAllWorkoutTemplates();
  templates = templates.filter(t => t.id !== templateId);
  saveArray(STORAGE_KEYS.WORKOUT_TEMPLATES, templates);
  // Also remove last used timestamp if deleting template
  const timestamps = getLastUsedTimestamps();
  delete timestamps[templateId];
  saveObject(STORAGE_KEYS.LAST_USED_TIMESTAMPS, timestamps);
  console.log("Deleted template and its timestamp:", templateId);
};
export const getWorkoutTemplateById = (
  templateId: string
): WorkoutTemplate | null => {
  const templates = getAllWorkoutTemplates();
  const template = templates.find(t => t.id === templateId);
  return template || null;
};

// --- Workout History Functions ---
// ... (keep existing history functions) ...
export const getWorkoutHistory = (): CompletedWorkout[] => {
  return getArray<CompletedWorkout>(STORAGE_KEYS.WORKOUT_HISTORY).sort(
    (a, b) => b.startTime - a.startTime
  );
};
export const saveCompletedWorkout = (workout: CompletedWorkout): void => {
  const history = getWorkoutHistory();
  // Ensure units are saved correctly
  history.unshift(workout);
  saveArray(STORAGE_KEYS.WORKOUT_HISTORY, history);
};
export const clearWorkoutHistory = (): void => {
  storage.delete(STORAGE_KEYS.WORKOUT_HISTORY);
};

// --- Active Workout Session Functions ---
// ... (keep existing active session functions) ...
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
export const getActiveWorkoutSession = (): ActiveWorkoutSession | null => {
  const jsonString = storage.getString(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
  if (jsonString) {
    try {
      const session = JSON.parse(jsonString) as ActiveWorkoutSession;
      if (
        session &&
        typeof session.startTime === "number" &&
        typeof session.accumulatedSeconds === "number"
      ) {
        console.log("Active session retrieved.");
        return session;
      } else {
        console.warn("Invalid active session data found in storage.");
        storage.delete(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
        return null;
      }
    } catch (error) {
      console.error("Error parsing active workout session:", error);
      storage.delete(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
      return null;
    }
  }
  return null;
};
export const clearActiveWorkoutSession = (): void => {
  storage.delete(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
  console.log("Active session explicitly cleared.");
};

// --- Last Used Timestamp Functions ---
// ... (keep existing timestamp functions) ...
export const getLastUsedTimestamps = (): Record<string, number> => {
  return (
    getObject<Record<string, number>>(STORAGE_KEYS.LAST_USED_TIMESTAMPS) || {}
  );
};
export const saveLastUsedTimestamp = (
  templateId: string,
  timestamp: number
): void => {
  const timestamps = getLastUsedTimestamps();
  timestamps[templateId] = timestamp;
  saveObject(STORAGE_KEYS.LAST_USED_TIMESTAMPS, timestamps);
  console.log(`Saved last used timestamp for template ${templateId}`);
};

// --- NEW: User Preferences Functions ---

/**
 * Retrieves user preferences from storage.
 * @returns UserPreferences object or default preferences if none saved.
 */
export const getUserPreferences = (): UserPreferences => {
  const defaults: UserPreferences = {
    defaultWeightUnit: "kg", // Default to kg
  };
  const savedPrefs = getObject<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
  return { ...defaults, ...savedPrefs }; // Merge saved prefs over defaults
};

/**
 * Saves user preferences to storage.
 * @param prefs - The UserPreferences object to save.
 */
export const saveUserPreferences = (prefs: UserPreferences): void => {
  saveObject(STORAGE_KEYS.USER_PREFERENCES, prefs);
  console.log("User preferences saved:", prefs);
};
