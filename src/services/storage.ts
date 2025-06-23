import { MMKV } from "react-native-mmkv";
import uuid from "react-native-uuid";
import { Categories } from "@/components/AddExerciseModal";

// --- Type for Weight Unit ---
export type WeightUnit = "lbs" | "kg";

// --- Interfaces ---
export interface WorkoutSet {
  id: string;
  reps: number;
  weight: string;
  unit: WeightUnit;
}

export interface WorkoutExercise {
  instanceId: string;
  id: string;
  name: string;
  category: Categories;
  type: string;
  sets: WorkoutSet[];
  defaultRestSeconds?: number;
}

export interface UserGoals {
  weeklyWorkouts: number;
  weeklyActiveDays: number;
  weeklyVolumeKg: number;
}

export interface WorkoutTemplateExercise {
  instanceId: string;
  id: string;
  name: string;
  sets: Array<{ id: string; reps: number; weight: number }>;
  defaultRestSeconds?: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: string | null;
  durationEstimate?: number;
  exercises: Array<WorkoutTemplateExercise>;
}

export interface CompletedWorkoutExercise {
  instanceId: string;
  id: string;
  name: string;
  sets: Array<{
    id: string;
    reps: number;
    weight: number;
    completed: boolean;
    unit: WeightUnit;
    restTakenSeconds?: number;
  }>;
}

export interface CompletedWorkout {
  id: string;
  templateId?: string;
  name: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  notes?: string;
  exercises: Array<CompletedWorkoutExercise>;
}

export interface ActiveWorkoutSession {
  startTime: number;
  accumulatedSeconds: number;
  template: WorkoutTemplate | null;
  // Add workout state for proper resuming
  workoutState?: {
    currentExerciseIndex: number;
    exercises: Array<{
      instanceId: string;
      sets: Array<{
        id: string;
        completed: boolean;
        reps?: number;
        weight?: string;
        unit?: WeightUnit;
        restTakenSeconds?: number;
      }>;
    }>;
  };
}

// --- NEW: User Preferences Interface ---
export interface UserPreferences {
  defaultWeightUnit: WeightUnit;
}

export const storage = new MMKV();

export interface WorkoutDraft {
  templateId: string | null; // null for 'Create New', ID for 'Edit'
  name: string;
  type: string | null;
  durationEstimate?: number;
  exercises: WorkoutTemplateExercise[]; // Use the same exercise structure as template
  timestamp: number; // When the draft was saved
}

// --- Storage Keys ---
const STORAGE_KEYS = {
  WORKOUT_TEMPLATES: "workoutTemplates",
  WORKOUT_HISTORY: "workoutHistory",
  ACTIVE_WORKOUT_SESSION: "activeWorkoutSession",
  LAST_USED_TIMESTAMPS: "lastUsedTimestamps",
  USER_PREFERENCES: "userPreferences",
  USER_GOALS: "userGoals",
  WORKOUT_DRAFT_CREATE: "workoutDraft_create",
  WORKOUT_DRAFT_EDIT_PREFIX: "workoutDraft_edit_",
  CUSTOM_EXERCISES: "customExercises", // NEW: Key for custom exercises
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

  // Ensure all exercises and sets have necessary IDs
  templateToSave.exercises.forEach(ex => {
    ex.instanceId = ex.instanceId || (uuid.v4() as string); // Assign instanceId if missing
    ex.sets = ex.sets.map(set => ({
      ...set,
      id: set.id || (uuid.v4() as string),
    }));
    ex.defaultRestSeconds =
      typeof ex.defaultRestSeconds === "number" && !isNaN(ex.defaultRestSeconds)
        ? ex.defaultRestSeconds
        : undefined;
  });

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
  // Ensure all exercises and sets have necessary IDs
  workout.exercises.forEach(ex => {
    ex.instanceId = ex.instanceId || (uuid.v4() as string); // Assign instanceId if missing
    ex.sets = ex.sets.map(set => ({
      ...set,
      id: set.id || (uuid.v4() as string),
    }));
  });
  history.unshift(workout);
  saveArray(STORAGE_KEYS.WORKOUT_HISTORY, history);
};

// --- NEW: Get Completed Workout by ID ---
export const getCompletedWorkoutById = (
  workoutId: string
): CompletedWorkout | null => {
  const history = getWorkoutHistory();
  return history.find(w => w.id === workoutId) || null;
};

export const updateCompletedWorkout = (
  updatedWorkout: CompletedWorkout
): void => {
  const history = getWorkoutHistory();
  const index = history.findIndex(w => w.id === updatedWorkout.id);
  if (index !== -1) {
    // Ensure IDs exist on update
    updatedWorkout.exercises.forEach(ex => {
      ex.instanceId = ex.instanceId || (uuid.v4() as string);
      ex.sets = ex.sets.map(set => ({
        ...set,
        id: set.id || (uuid.v4() as string),
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

export const deleteCompletedWorkout = (workoutId: string): void => {
  let history = getWorkoutHistory();
  history = history.filter(w => w.id !== workoutId);
  saveArray(STORAGE_KEYS.WORKOUT_HISTORY, history);
  console.log("Deleted completed workout:", workoutId);
};

export const clearWorkoutHistory = (): void => {
  storage.delete(STORAGE_KEYS.WORKOUT_HISTORY);
};

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

export const saveWorkoutDraft = (draft: WorkoutDraft): void => {
  draft.timestamp = Date.now();
  draft.exercises.forEach(ex => {
    ex.defaultRestSeconds =
      typeof ex.defaultRestSeconds === "number" && !isNaN(ex.defaultRestSeconds)
        ? ex.defaultRestSeconds
        : undefined;
  });
  if (draft.templateId === null) {
    // Save as 'Create New' draft
    saveObject(STORAGE_KEYS.WORKOUT_DRAFT_CREATE, draft);
    console.log("Create New workout draft saved.");
  } else {
    // Save as 'Edit' draft using templateId in the key
    saveObject(
      `${STORAGE_KEYS.WORKOUT_DRAFT_EDIT_PREFIX}${draft.templateId}`,
      draft
    );
    console.log(`Edit workout draft saved for template: ${draft.templateId}`);
  }
};

/**
 * Retrieves a workout draft.
 * @param templateId - The ID of the template being edited, or null for the 'Create New' draft.
 * @returns The WorkoutDraft object or null if no matching draft exists.
 */
export const getWorkoutDraft = (
  templateId: string | null
): WorkoutDraft | null => {
  if (templateId === null) {
    return getObject<WorkoutDraft>(STORAGE_KEYS.WORKOUT_DRAFT_CREATE);
  } else {
    return getObject<WorkoutDraft>(
      `${STORAGE_KEYS.WORKOUT_DRAFT_EDIT_PREFIX}${templateId}`
    );
  }
};

/**
 * Clears a specific workout draft.
 * @param templateId - The ID of the template draft to clear, or null for the 'Create New' draft.
 */
export const clearWorkoutDraft = (templateId: string | null): void => {
  if (templateId === null) {
    storage.delete(STORAGE_KEYS.WORKOUT_DRAFT_CREATE);
    console.log("Create New workout draft cleared.");
  } else {
    storage.delete(`${STORAGE_KEYS.WORKOUT_DRAFT_EDIT_PREFIX}${templateId}`);
    console.log(`Edit workout draft cleared for template: ${templateId}`);
  }
};

// --- Template Export/Import Functions ---

export interface TemplateExportData {
  version: string;
  exportDate: number;
  templates: WorkoutTemplate[];
}

/**
 * Exports all workout templates to a JSON string
 * @returns JSON string containing all templates with metadata
 */
export const exportWorkoutTemplates = (): string => {
  const templates = getAllWorkoutTemplates();
  const exportData: TemplateExportData = {
    version: "1.0.0",
    exportDate: Date.now(),
    templates: templates,
  };
  return JSON.stringify(exportData, null, 2);
};

/**
 * Exports specific workout templates to a JSON string
 * @param templateIds - Array of template IDs to export
 * @returns JSON string containing selected templates with metadata
 */
export const exportSelectedWorkoutTemplates = (
  templateIds: string[]
): string => {
  const allTemplates = getAllWorkoutTemplates();
  const selectedTemplates = allTemplates.filter(template =>
    templateIds.includes(template.id)
  );
  const exportData: TemplateExportData = {
    version: "1.0.0",
    exportDate: Date.now(),
    templates: selectedTemplates,
  };
  return JSON.stringify(exportData, null, 2);
};

/**
 * Imports workout templates from a JSON string
 * @param jsonData - JSON string containing exported templates
 * @param options - Import options
 * @returns Object with success status, imported count, and error messages
 */
export const importWorkoutTemplates = (
  jsonData: string,
  options: {
    overwriteExisting?: boolean;
    generateNewIds?: boolean;
  } = {}
): {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
} => {
  const { overwriteExisting = false, generateNewIds = false } = options;
  let importedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  try {
    const importData: TemplateExportData = JSON.parse(jsonData);

    // Validate import data structure
    if (!importData.templates || !Array.isArray(importData.templates)) {
      throw new Error(
        "Invalid import data: missing or invalid templates array"
      );
    }

    const existingTemplates = getAllWorkoutTemplates();
    const existingIds = new Set(existingTemplates.map(t => t.id));
    const existingNames = new Set(
      existingTemplates.map(t => t.name.toLowerCase())
    );

    for (const template of importData.templates) {
      try {
        // Validate template structure
        if (!template.id || !template.name || !template.exercises) {
          errors.push(
            `Skipped invalid template: ${template.name || "Unknown"}`
          );
          skippedCount++;
          continue;
        }

        let templateToImport = { ...template };

        // Handle ID conflicts
        if (existingIds.has(template.id)) {
          if (generateNewIds) {
            templateToImport.id = uuid.v4() as string;
            console.log(`Generated new ID for template: ${template.name}`);
          } else if (!overwriteExisting) {
            errors.push(
              `Skipped duplicate template: ${template.name} (ID conflict)`
            );
            skippedCount++;
            continue;
          }
        }

        // Handle name conflicts by appending number
        let finalName = templateToImport.name;
        let counter = 1;
        while (existingNames.has(finalName.toLowerCase())) {
          finalName = `${templateToImport.name} (${counter})`;
          counter++;
        }
        templateToImport.name = finalName;

        // Ensure all exercises and sets have valid IDs
        templateToImport.exercises.forEach(exercise => {
          if (!exercise.instanceId) {
            exercise.instanceId = uuid.v4() as string;
          }
          exercise.sets.forEach(set => {
            if (!set.id) {
              set.id = uuid.v4() as string;
            }
          });
        });

        // Save the template
        saveWorkoutTemplate(templateToImport);
        existingIds.add(templateToImport.id);
        existingNames.add(templateToImport.name.toLowerCase());
        importedCount++;
      } catch (templateError) {
        const errorMessage =
          templateError instanceof Error
            ? templateError.message
            : String(templateError);
        errors.push(
          `Error importing template ${template.name}: ${errorMessage}`
        );
        skippedCount++;
      }
    }

    return {
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [`Failed to parse import data: ${errorMessage}`],
    };
  }
};

// --- NEW: Custom Exercise Interface ---
export interface CustomExercise {
  id: string;
  name: string;
  category: Categories;
  type: string;
  isCustom: true; // Flag to distinguish from built-in exercises
  createdAt: number; // Timestamp when created
}

// --- NEW: Custom Exercise Functions ---
export const getAllCustomExercises = (): CustomExercise[] => {
  return getArray<CustomExercise>(STORAGE_KEYS.CUSTOM_EXERCISES);
};

export const saveCustomExercise = (
  exercise: Omit<CustomExercise, "id" | "isCustom" | "createdAt">
): CustomExercise => {
  const customExercises = getAllCustomExercises();

  const newExercise: CustomExercise = {
    ...exercise,
    id: `custom-${uuid.v4()}`,
    isCustom: true,
    createdAt: Date.now(),
  };

  customExercises.push(newExercise);
  saveArray(STORAGE_KEYS.CUSTOM_EXERCISES, customExercises);

  return newExercise;
};

export const deleteCustomExercise = (exerciseId: string): void => {
  const customExercises = getAllCustomExercises();
  const updatedExercises = customExercises.filter(ex => ex.id !== exerciseId);
  saveArray(STORAGE_KEYS.CUSTOM_EXERCISES, updatedExercises);
};

export const updateCustomExercise = (
  exerciseId: string,
  updates: Partial<Pick<CustomExercise, "name" | "category" | "type">>
): boolean => {
  const customExercises = getAllCustomExercises();
  const index = customExercises.findIndex(ex => ex.id === exerciseId);

  if (index === -1) {
    return false; // Exercise not found
  }

  customExercises[index] = {
    ...customExercises[index],
    ...updates,
  };

  saveArray(STORAGE_KEYS.CUSTOM_EXERCISES, customExercises);
  return true;
};

export const clearAllCustomExercises = (): void => {
  saveArray(STORAGE_KEYS.CUSTOM_EXERCISES, []);
};
