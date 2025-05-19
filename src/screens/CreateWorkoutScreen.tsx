import React, {
  useState,
  useLayoutEffect,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { Alert } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import AddExerciseModal, {
  Exercise,
  Categories,
} from "@/components/AddExerciseModal";
import Card from "@/components/Card";
import {
  saveWorkoutTemplate,
  WorkoutSet,
  WorkoutTemplate,
  saveWorkoutDraft,
  getWorkoutDraft,
  clearWorkoutDraft,
  WorkoutDraft,
  WorkoutTemplateExercise,
  WeightUnit,
  WorkoutExercise,
} from "@/services/storage";
import {
  armsExercises,
  backExercises,
  cardioExercises,
  chestExercises,
  coreExercises,
  legsExercises,
  shouldersExercises,
} from "@/constants/exercises";
import WorkoutTypePicker from "@/components/WorkoutTypePicker";
import uuid from "react-native-uuid";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { lightColors } from "@/theme/colors"; // For style function type
import WeightUnitInput from "@/components/WeightUnitInput";
import { WorkoutDetailsForm } from "@/components/WorkoutDetailsForm";
import ExerciseList from "@/components/ExerciseList";
import { useWorkoutDraft } from "@/hooks/useWorkoutDraft";
import { useExerciseManagement } from "@/hooks/useExerciseManagement";
import { useWorkoutValidation } from "@/hooks/useWorkoutValidation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateWorkout">;

const DEFAULT_REST_DURATION = 60; // Default rest if not set in template

// Define ExerciseStatus type here or import from where ExerciseList gets it
type ExerciseStatus = "not-started" | "in-progress" | "completed";
// Define ActiveWorkoutExercise and ActiveWorkoutSet for mapping
// This is a simplified version, ensure it matches the one expected by ExerciseList
interface ActiveWorkoutSet extends WorkoutSet {
  completed: boolean;
  restTakenSeconds?: number;
}
interface ActiveWorkoutExercise extends WorkoutExercise {
  sets: ActiveWorkoutSet[];
}

const workoutTypeOptions = [
  "Strength",
  "Hypertrophy",
  "Endurance",
  "Cardio",
  "Custom",
];

const DUMMY_EXERCISES: Exercise[] = [
  ...chestExercises,
  ...backExercises,
  ...legsExercises,
  ...cardioExercises,
  ...armsExercises,
  ...shouldersExercises,
  ...coreExercises,
];

type ScreenColors = typeof lightColors; // Or define a specific interface

const CreateWorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, preferences } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const defaultUnit = preferences.defaultWeightUnit;

  const [workoutName, setWorkoutName] = useState("");
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [addedExercises, setAddedExercises] = useState<WorkoutExercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const savedRef = useRef(false);
  const addExerciseModalRef = useRef<BottomSheetModal>(null);

  const {
    exercises,
    addExercises,
    removeExercise,
    addSet,
    removeSet,
    updateReps,
    updateWeight,
    updateUnit,
    updateRest,
  } = useExerciseManagement({
    defaultUnit,
  });

  const { hasUnsavedChanges } = useWorkoutDraft({
    workoutName,
    workoutType,
    duration,
    addedExercises: exercises,
    setAddedExercises,
    setWorkoutName,
    setWorkoutType,
    setDuration,
    defaultUnit,
  });

  const { validateWorkout } = useWorkoutValidation({
    workoutName,
    exercises,
  });

  const getExerciseStatusForTemplate = useCallback(
    (exercise: ActiveWorkoutExercise): ExerciseStatus => {
      // In template creation, exercises don't have an active status
      return "not-started";
    },
    []
  );

  const handlePresentModalPress = useCallback(() => {
    addExerciseModalRef.current?.present();
  }, []);

  const defaultReps = 12;
  const defaultWeight = 0;
  const defaultSetCount = 3;

  const createDefaultSets = useCallback((): WorkoutSet[] => {
    const sets: WorkoutSet[] = [];
    for (let i = 0; i < defaultSetCount; i++) {
      sets.push({
        id: uuid.v4() as string,
        reps: defaultReps,
        weight: defaultWeight.toString(),
        unit: defaultUnit,
      });
    }
    return sets;
  }, [defaultUnit]);

  const handleAddExercisesFromModal = useCallback(
    (selectedExercises: Exercise[]) => {
      const newWorkoutExercises: WorkoutExercise[] = selectedExercises.map(
        ex => ({
          ...ex,
          instanceId: uuid.v4() as string,
          sets: createDefaultSets(),
          defaultRestSeconds: DEFAULT_REST_DURATION,
        })
      );

      addExercises(newWorkoutExercises);
    },
    [createDefaultSets, addExercises]
  );

  const handleSaveWorkout = useCallback(() => {
    if (!validateWorkout()) return;

    const exercisesToSave: WorkoutTemplateExercise[] = exercises.map(ex => ({
      instanceId: ex.instanceId,
      id: ex.id,
      name: ex.name,
      sets: ex.sets.map(set => ({
        id: set.id,
        reps: Number(set.reps) || 0,
        weight: parseFloat(set.weight) || 0,
      })),
      defaultRestSeconds: ex.defaultRestSeconds,
    }));

    const templateToSave: WorkoutTemplate = {
      id: uuid.v4() as string,
      name: workoutName.trim(),
      type: workoutType,
      durationEstimate: duration ? parseInt(duration, 10) : undefined,
      exercises: exercisesToSave,
    };

    console.log(
      "Saving Workout Template (unit omitted):",
      JSON.stringify(templateToSave, null, 2)
    );
    saveWorkoutTemplate(templateToSave);
    savedRef.current = true;
    clearWorkoutDraft(null);
    Alert.alert("Success", "Workout template saved!");
    navigation.goBack();
  }, [
    workoutName,
    workoutType,
    duration,
    exercises,
    navigation,
    validateWorkout,
    savedRef,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSaveWorkout} style={styles.saveButton}>
          <Icon
            name="content-save-outline"
            size={18}
            color={colors.buttonText}
            style={{ marginRight: 5 }}
          />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [handleSaveWorkout]);

  return (
    <View style={styles.container}>
      <WorkoutDetailsForm
        workoutName={workoutName}
        workoutType={workoutType}
        duration={duration}
        onNameChange={setWorkoutName}
        onTypeChange={setWorkoutType}
        onDurationChange={setDuration}
        workoutTypeOptions={workoutTypeOptions}
      />

      <ExerciseList
        exercises={exercises} // Use mapped exercises
        onRemoveExercise={removeExercise}
        onAddSet={addSet}
        onRemoveSet={removeSet}
        onRepsChange={updateReps}
        onWeightChange={updateWeight}
        onUnitChange={updateUnit}
        onRestChange={updateRest}
        onAddExercise={handlePresentModalPress}
        // Props required by ExerciseList as seen in ActiveWorkoutScreen
        getExerciseStatus={getExerciseStatusForTemplate}
        currentExerciseIndex={-1} // No current exercise in create mode
        onSelectExercise={() => {}} // No selection logic in create mode
        disabled={false} // Not disabled in create mode
      />

      <AddExerciseModal
        ref={addExerciseModalRef}
        onClose={() => {}}
        onAddExercises={handleAddExercisesFromModal}
        allExercises={DUMMY_EXERCISES}
      />
    </View>
  );
};

export default CreateWorkoutScreen;

const getStyles = (colors: ScreenColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 50,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
      marginTop: 20,
    },
    inputLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: colors.card,
      color: colors.text,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 8,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    inputGroup: {
      flex: 1,
    },
    durationInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingRight: 10,
    },
    durationInput: {
      flex: 1,
      color: colors.text,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 16,
    },
    placeholderContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      opacity: 0.6,
    },
    placeholderText: {
      color: colors.textSecondary,
      marginTop: 10,
      fontSize: 16,
    },
    addExerciseButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 15,
    },
    addExerciseButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "500",
      marginLeft: 8,
    },
    exerciseCard: {
      borderRadius: 8,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      // backgroundColor set dynamically in renderItem
    },
    exerciseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.background,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    exerciseInfo: {
      flex: 1,
      marginRight: 10,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    exerciseDetail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    removeExerciseButton: {
      padding: 5,
    },
    setsContainer: {
      paddingHorizontal: 15,
      paddingTop: 10,
      paddingBottom: 5,
    },
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      paddingVertical: 5,
    },
    setNumber: {
      width: 30, // Adjusted width slightly
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 5, // Reduced margin
      textAlign: "center",
    },
    // Reps Input Container (remains simple)
    repsInputContainer: {
      flex: 1, // Takes up remaining space before weight
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      marginHorizontal: 5,
      minHeight: 40, // Ensure height consistency
      justifyContent: "center",
    },
    setInput: {
      // General style for text inputs in sets
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 8,
      textAlign: "center",
    },
    // Remove Set Button
    removeSetButton: {
      paddingLeft: 10, // Keep padding for touch area
      paddingVertical: 5,
    },
    addSetButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      marginTop: 5,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addSetButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 5,
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginRight: 10,
    },
    saveButtonText: {
      color: colors.buttonText,
      fontWeight: "bold",
      fontSize: 14,
    },
    restInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5, // Space above rest input
      // Removed paddingHorizontal from header, apply here if needed
    },
    restInputLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginRight: 8,
    },
    restTextInput: {
      backgroundColor: colors.background, // Match set inputs
      color: colors.text,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      fontSize: 14,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 50, // Ensure decent width
      textAlign: "center",
    },
    restInputUnit: {
      fontSize: 13,
      color: colors.textSecondary,
      marginLeft: 5,
    },
  });
