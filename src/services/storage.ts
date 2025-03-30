import { MMKV } from "react-native-mmkv";
import uuid from "react-native-uuid";

// --- Type for Weight Unit ---
export type WeightUnit = "lbs" | "kg";

// --- Interfaces ---
export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  unit: WeightUnit; // Unit is part of the set during an active workout
}

export interface UserGoals {
  weeklyWorkouts: number;
  weeklyActiveDays: number;
  weeklyVolumeKg: number; // Store volume goal in a consistent unit (e.g., kg)
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
  notes?: string; // <-- Add optional notes field
  exercises: Array<{
    id: string;
    name: string;
    sets: Array<{
      id: string; // <-- Add ID to completed sets for editing
      reps: number;
      weight: number;
      completed: boolean; // Keep track if the set was marked done
      unit: WeightUnit;
    }>;
  }>;
}

export interface ActiveWorkoutSession {
  startTime: number;
  accumulatedSeconds: number;
  template: WorkoutTemplate | null;
  // Add exercises state if needed for resuming complex edits
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
  USER_PREFERENCES: "userPreferences",
  USER_GOALS: "userGoals",
};

// --- Helper Functions (getArray, saveArray, getObject, saveObject) ---
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
export const getAllWorkoutTemplates = (): WorkoutTemplate[] => {
  return getArray<WorkoutTemplate>(STORAGE_KEYS.WORKOUT_TEMPLATES);
};
export const saveWorkoutTemplate = (templateToSave: WorkoutTemplate): void => {
  const templates = getAllWorkoutTemplates();
  const index = templates.findIndex(t => t.id === templateToSave.id);

  if (index === -1) {
    // Ensure sets have IDs if creating new
    templateToSave.exercises.forEach(ex => {
      ex.sets = ex.sets.map(set => ({ ...set, id: set.id || uuid.v4() }));
    });
    templates.push(templateToSave);
    console.log("Saving new template:", templateToSave.id);
  } else {
    // Ensure sets have IDs if updating
    templateToSave.exercises.forEach(ex => {
      ex.sets = ex.sets.map(set => ({ ...set, id: set.id || uuid.v4() }));
    });
    templates[index] = templateToSave;
    console.log("Updating existing template:", templateToSave.id);
  }
  saveArray(STORAGE_KEYS.WORKOUT_TEMPLATES, templates);
};
export const deleteWorkoutTemplate = (templateId: string): void => {
  let templates = getAllWorkoutTemplates();
  templates = templates.filter(t => t.id !== templateId);
  saveArray(STORAGE_KEYS.WORKOUT_TEMPLATES, templates);
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
export const getWorkoutHistory = (): CompletedWorkout[] => {
  return getArray<CompletedWorkout>(STORAGE_KEYS.WORKOUT_HISTORY).sort(
    (a, b) => b.startTime - a.startTime // Sort newest first
  );
};

export const saveCompletedWorkout = (workout: CompletedWorkout): void => {
  const history = getWorkoutHistory();
  // Ensure sets have IDs when saving
  workout.exercises.forEach(ex => {
    ex.sets = ex.sets.map(set => ({
      ...set,
      id: set.id || (uuid.v4() as string), // Assign ID if missing
    }));
  });
  history.unshift(workout); // Add to the beginning (newest)
  saveArray(STORAGE_KEYS.WORKOUT_HISTORY, history);
};

// --- NEW: Get Completed Workout by ID ---
export const getCompletedWorkoutById = (
  workoutId: string
): CompletedWorkout | null => {
  const history = getWorkoutHistory();
  return history.find(w => w.id === workoutId) || null;
};

// --- NEW: Update Completed Workout ---
export const updateCompletedWorkout = (
  updatedWorkout: CompletedWorkout
): void => {
  const history = getWorkoutHistory();
  const index = history.findIndex(w => w.id === updatedWorkout.id);
  if (index !== -1) {
    // Ensure sets have IDs when updating
    updatedWorkout.exercises.forEach(ex => {
      ex.sets = ex.sets.map(set => ({
        ...set,
        id: set.id || (uuid.v4() as string), // Assign ID if missing
      }));
    });
    history[index] = updatedWorkout;
    saveArray(STORAGE_KEYS.WORKOUT_HISTORY, history);
    console.log("Updated completed workout:", updatedWorkout.id);
  } else {
    console.warn(
      "Could not find workout in history to update:",
      updatedWorkout.id
    );
  }
};

// --- NEW: Delete Completed Workout ---
export const deleteCompletedWorkout = (workoutId: string): void => {
  let history = getWorkoutHistory();
  history = history.filter(w => w.id !== workoutId);
  saveArray(STORAGE_KEYS.WORKOUT_HISTORY, history);
  console.log("Deleted completed workout:", workoutId);
};

export const clearWorkoutHistory = (): void => {
  storage.delete(STORAGE_KEYS.WORKOUT_HISTORY);
};

// --- Active Workout Session Functions ---
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

// --- User Preferences Functions ---
export const getUserPreferences = (): UserPreferences => {
  const defaults: UserPreferences = {
    defaultWeightUnit: "kg",
  };
  const savedPrefs = getObject<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
  return { ...defaults, ...savedPrefs };
};
export const saveUserPreferences = (prefs: UserPreferences): void => {
  saveObject(STORAGE_KEYS.USER_PREFERENCES, prefs);
  console.log("User preferences saved:", prefs);
};

// --- NEW: User Goals Functions ---

/**
 * Retrieves user goals from storage.
 * @returns UserGoals object or default goals if none saved.
 */
export const getUserGoals = (): UserGoals => {
  const defaults: UserGoals = {
    weeklyWorkouts: 3, // Example default
    weeklyActiveDays: 3, // Example default
    weeklyVolumeKg: 10000, // Example default (in kg)
  };
  const savedGoals = getObject<UserGoals>(STORAGE_KEYS.USER_GOALS);
  // Ensure all keys exist, merging defaults with saved data
  const mergedGoals = { ...defaults, ...savedGoals };
  // Ensure numbers are valid, fallback to default if not
  return {
    weeklyWorkouts:
      typeof mergedGoals.weeklyWorkouts === "number" &&
      !isNaN(mergedGoals.weeklyWorkouts)
        ? mergedGoals.weeklyWorkouts
        : defaults.weeklyWorkouts,
    weeklyActiveDays:
      typeof mergedGoals.weeklyActiveDays === "number" &&
      !isNaN(mergedGoals.weeklyActiveDays)
        ? mergedGoals.weeklyActiveDays
        : defaults.weeklyActiveDays,
    weeklyVolumeKg:
      typeof mergedGoals.weeklyVolumeKg === "number" &&
      !isNaN(mergedGoals.weeklyVolumeKg)
        ? mergedGoals.weeklyVolumeKg
        : defaults.weeklyVolumeKg,
  };
};

/**
 * Saves user goals to storage.
 * @param goals - The UserGoals object to save.
 */
export const saveUserGoals = (goals: UserGoals): void => {
  // Ensure values are numbers before saving
  const goalsToSave: UserGoals = {
    weeklyWorkouts: Number(goals.weeklyWorkouts) || 0,
    weeklyActiveDays: Number(goals.weeklyActiveDays) || 0,
    weeklyVolumeKg: Number(goals.weeklyVolumeKg) || 0,
  };
  saveObject(STORAGE_KEYS.USER_GOALS, goalsToSave);
  console.log("User goals saved:", goalsToSave);
};
