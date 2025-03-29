import { MMKV } from "react-native-mmkv";

// --- Define Data Structures ---
// Adjust these interfaces based on the actual data you need to save

// Example for a workout template created in CreateWorkoutScreen
export interface WorkoutTemplate {
  id: string; // Unique ID (e.g., timestamp or UUID)
  name: string;
  type: string | null;
  durationEstimate?: number; // Optional estimated duration
  exercises: Array<{
    id: string; // ID of the exercise from your master list
    name: string; // Store name for display convenience
    sets: Array<{
      reps: number;
      weight: number;
    }>;

    // Add any other template-specific details per exercise if needed (e.g., default sets/reps)
  }>;
}

// Example for a completed workout instance
export interface CompletedWorkout {
  id: string; // Unique ID for this specific instance
  templateId?: string; // Optional: Link to the template used
  name: string; // Name at the time of completion
  startTime: number; // Timestamp (Date.now())
  endTime: number; // Timestamp
  durationSeconds: number;
  exercises: Array<{
    id: string;
    name: string;
    sets: Array<{
      reps: number;
      weight: number;
      // Add other set details: RPE, notes, etc.
    }>;
  }>;
  // Add overall workout notes, volume, etc.
}

export const storage = new MMKV();

// --- Define Storage Keys ---
const STORAGE_KEYS = {
  WORKOUT_TEMPLATES: "workoutTemplates",
  WORKOUT_HISTORY: "workoutHistory",
};

// --- Helper Functions ---

// Generic function to get an array from storage
const getArray = <T>(key: string): T[] => {
  const jsonString = storage.getString(key);
  if (jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return Array.isArray(data) ? data : []; // Ensure it's an array
    } catch (error) {
      console.error(`Error parsing JSON for key "${key}":`, error);
      return []; // Return empty array on error
    }
  }
  return []; // Return empty array if key doesn't exist
};

// Generic function to save an array to storage
const saveArray = <T>(key: string, data: T[]): void => {
  try {
    const jsonString = JSON.stringify(data);
    storage.set(key, jsonString);
  } catch (error) {
    console.error(`Error stringifying JSON for key "${key}":`, error);
  }
};

// --- Workout Template Functions ---

export const getAllWorkoutTemplates = (): WorkoutTemplate[] => {
  return getArray<WorkoutTemplate>(STORAGE_KEYS.WORKOUT_TEMPLATES);
};

export const saveWorkoutTemplate = (newTemplate: WorkoutTemplate): void => {
  const templates = getAllWorkoutTemplates();
  // Check if template with same ID already exists to prevent duplicates
  // Or implement update logic if needed
  if (!templates.some(t => t.id === newTemplate.id)) {
    templates.push(newTemplate);
    saveArray(STORAGE_KEYS.WORKOUT_TEMPLATES, templates);
  } else {
    console.warn(
      `Template with ID ${newTemplate.id} already exists. Not saving.`
    );
    // Optionally implement update logic here:
    // const updatedTemplates = templates.map(t => t.id === newTemplate.id ? newTemplate : t);
    // saveArray(STORAGE_KEYS.WORKOUT_TEMPLATES, updatedTemplates);
  }
};

export const deleteWorkoutTemplate = (templateId: string): void => {
  let templates = getAllWorkoutTemplates();
  templates = templates.filter(t => t.id !== templateId);
  saveArray(STORAGE_KEYS.WORKOUT_TEMPLATES, templates);
};

// --- Workout History Functions ---

export const getWorkoutHistory = (): CompletedWorkout[] => {
  // Optionally sort by date here
  return getArray<CompletedWorkout>(STORAGE_KEYS.WORKOUT_HISTORY).sort(
    (a, b) => b.startTime - a.startTime // Sort descending by start time
  );
};

export const saveCompletedWorkout = (workout: CompletedWorkout): void => {
  const history = getWorkoutHistory();
  // Add the new workout to the beginning or end
  history.unshift(workout); // Add to beginning for recent first
  saveArray(STORAGE_KEYS.WORKOUT_HISTORY, history);
};

export const clearWorkoutHistory = (): void => {
  storage.delete(STORAGE_KEYS.WORKOUT_HISTORY);
};

// --- Add functions for other data as needed ---
