// src/screens/ActiveWorkoutScreen.tsx
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { usePreventRemove } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import {
  WorkoutTemplate,
  CompletedWorkout,
  saveCompletedWorkout,
  ActiveWorkoutSession,
  saveActiveWorkoutSession,
  clearActiveWorkoutSession,
  WorkoutSet as StoredWorkoutSet,
  WeightUnit,
} from "@/services/storage";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import uuid from "react-native-uuid";
import { formatDuration } from "@/utils/formatters";
import Card from "@/components/Card";

type Props = NativeStackScreenProps<RootStackParamList, "ActiveWorkout">;

// Extend StoredWorkoutSet for active state
interface ActiveWorkoutSet extends StoredWorkoutSet {
  completed: boolean;
}

interface ActiveWorkoutExercise {
  id: string;
  name: string;
  sets: ActiveWorkoutSet[];
}

// --- NEW: Define Exercise Status Type ---
type ExerciseStatus = "not-started" | "in-progress" | "completed";

const ActiveWorkoutScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors, preferences } = useTheme();
  const { template: initialTemplate, resumeData } = route.params;
  const defaultUnit = preferences.defaultWeightUnit;

  // --- State ---
  const [startTime, setStartTime] = useState<number>(0);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastResumeTime, setLastResumeTime] = useState<number>(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<
    ActiveWorkoutExercise[]
  >([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // --- Refs ---
  const startTimeRef = useRef(startTime);
  const accumulatedSecondsRef = useRef(accumulatedSeconds);
  const isFinishedRef = useRef(false);
  const elapsedSecondsRef = useRef(0);
  const workoutExercisesRef = useRef(workoutExercises);

  // Update refs
  useEffect(() => {
    startTimeRef.current = startTime;
    accumulatedSecondsRef.current = accumulatedSeconds;
    workoutExercisesRef.current = workoutExercises;
  }, [startTime, accumulatedSeconds, workoutExercises]);

  // --- Initialization (remains the same) ---
  useEffect(() => {
    let initialExercises: ActiveWorkoutExercise[] = [];
    let startAccumulated = 0;
    let startTimestamp = 0;
    let startResumeTime = 0;

    const createSetsWithUnit = (
      sets: Array<{ id: string; reps: number; weight: number }>
    ): ActiveWorkoutSet[] => {
      return sets.map(set => ({
        ...set,
        unit: defaultUnit,
        completed: false,
      }));
    };

    if (resumeData) {
      console.log("Resuming workout session:", resumeData);
      startAccumulated = resumeData.accumulatedSeconds;
      startTimestamp = resumeData.startTime;
      startResumeTime = Date.now();
      initialExercises =
        resumeData.template?.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: createSetsWithUnit(ex.sets),
        })) || [];
      isFinishedRef.current = false;
      clearActiveWorkoutSession();
    } else if (initialTemplate) {
      console.log("Starting new workout from template.");
      const now = Date.now();
      startTimestamp = now;
      startResumeTime = now;
      startAccumulated = 0;
      initialExercises = initialTemplate.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: createSetsWithUnit(ex.sets),
      }));
      isFinishedRef.current = false;
    } else {
      console.log("Starting empty workout.");
      const now = Date.now();
      startTimestamp = now;
      startResumeTime = now;
      startAccumulated = 0;
      initialExercises = [];
      isFinishedRef.current = false;
    }

    setStartTime(startTimestamp);
    setAccumulatedSeconds(startAccumulated);
    setLastResumeTime(startResumeTime);
    setWorkoutExercises(initialExercises);
    setCurrentExerciseIndex(0);
    setIsTimerRunning(true);
  }, [resumeData, initialTemplate, defaultUnit]);

  const currentExercise = workoutExercises[currentExerciseIndex];
  const workoutName = initialTemplate?.name || "New Workout";

  // --- Timer Logic & Controls (remain the same) ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && lastResumeTime > 0) {
      const updateTimer = () => {
        const secondsSinceLastResume = Math.round(
          (Date.now() - lastResumeTime) / 1000
        );
        const currentTotalElapsed = accumulatedSeconds + secondsSinceLastResume;
        setElapsedSeconds(currentTotalElapsed);
        elapsedSecondsRef.current = currentTotalElapsed;
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, lastResumeTime, accumulatedSeconds]);

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      setAccumulatedSeconds(elapsedSecondsRef.current);
      setLastResumeTime(0);
    } else {
      setLastResumeTime(Date.now());
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    Alert.alert("Reset Timer?", "Are you sure you want to reset the timer?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          setAccumulatedSeconds(0);
          setElapsedSeconds(0);
          elapsedSecondsRef.current = 0;
          setLastResumeTime(isTimerRunning ? Date.now() : 0);
        },
      },
    ]);
  };

  // --- Save Session Function (remains the same) ---
  const saveCurrentSession = useCallback(() => {
    if (!isFinishedRef.current && startTimeRef.current > 0) {
      const sessionToSave: ActiveWorkoutSession = {
        startTime: startTimeRef.current,
        accumulatedSeconds: elapsedSecondsRef.current,
        template: initialTemplate || null,
      };
      console.log("Saving session state...", sessionToSave);
      saveActiveWorkoutSession(sessionToSave);
    } else {
      console.log("Not saving session (finished or invalid).");
    }
  }, [initialTemplate]);

  // --- Prevent Back Navigation Hook (remains the same) ---
  usePreventRemove(startTime > 0 && !isFinishedRef.current, ({ data }) => {
    Alert.alert(
      "Pause Workout?",
      "Do you want to pause this workout and leave? Your progress will be saved.",
      [
        { text: "Stay", style: "cancel", onPress: () => {} },
        {
          text: "Pause & Leave",
          style: "destructive",
          onPress: () => {
            setIsTimerRunning(false);
            setAccumulatedSeconds(elapsedSecondsRef.current);
            saveCurrentSession();
            navigation.dispatch(data.action);
          },
        },
      ]
    );
  });

  // --- Set Data Handling (Reps, Weight, Unit - remain the same) ---
  const handleRepsChange = (setIndex: number, value: string) => {
    const reps = parseInt(value, 10);
    setWorkoutExercises(prevExercises =>
      prevExercises.map((ex, exIndex) => {
        if (exIndex === currentExerciseIndex) {
          const updatedSets = ex.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              return { ...set, reps: isNaN(reps) ? 0 : reps };
            }
            return set;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  const handleWeightChange = (setIndex: number, value: string) => {
    const weight = parseFloat(value);
    setWorkoutExercises(prevExercises =>
      prevExercises.map((ex, exIndex) => {
        if (exIndex === currentExerciseIndex) {
          const updatedSets = ex.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              return { ...set, weight: isNaN(weight) ? 0 : weight };
            }
            return set;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  const handleUnitChange = (setIndex: number, newUnit: WeightUnit) => {
    setWorkoutExercises(prevExercises =>
      prevExercises.map((ex, exIndex) => {
        if (exIndex === currentExerciseIndex) {
          const updatedSets = ex.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              return { ...set, unit: newUnit };
            }
            return set;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  // --- Toggle Set Complete & Auto-Advance ---
  const handleToggleSetComplete = (setIndex: number) => {
    let exerciseJustCompleted = false;
    let updatedExercises: ActiveWorkoutExercise[] = [];

    setWorkoutExercises(prevExercises => {
      updatedExercises = prevExercises.map((ex, exIndex) => {
        if (exIndex === currentExerciseIndex) {
          // Update the specific set's completed status
          const updatedSets = ex.sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
              return { ...set, completed: !set.completed };
            }
            return set;
          });

          // Check if *this* exercise is now fully completed
          const allSetsCompleted = updatedSets.every(set => set.completed);
          if (allSetsCompleted) {
            exerciseJustCompleted = true;
          }

          return { ...ex, sets: updatedSets };
        }
        return ex;
      });
      return updatedExercises; // Return the new state
    });

    // --- Auto-Advance Logic ---
    // Needs to run *after* state update is processed.
    // Using a microtask (Promise.resolve) ensures it runs after the current render cycle.
    Promise.resolve().then(() => {
      if (
        exerciseJustCompleted &&
        currentExerciseIndex < workoutExercisesRef.current.length - 1 // Use ref for latest length
      ) {
        console.log(
          `Exercise ${currentExerciseIndex + 1} completed, advancing.`
        );
        handleNextExercise();
      }
    });
  };

  // --- Exercise Navigation ---
  const handleNextExercise = () => {
    if (currentExerciseIndex < workoutExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      // Optionally show "Last Exercise" message or offer to finish
      Alert.alert("Last Exercise", "You've reached the last exercise.");
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1); // Corrected to prev - 1
    }
  };

  const handleSelectExercise = (index: number) => {
    setCurrentExerciseIndex(index);
  };

  // --- Finish Workout Logic (remains the same) ---
  const handleFinishWorkout = useCallback(() => {
    if (!startTime) return;
    isFinishedRef.current = true;
    const endTime = Date.now();
    const finalDurationSeconds = elapsedSecondsRef.current;

    const finalExercises = workoutExercisesRef.current.map(ex => ({
      id: ex.id,
      name: ex.name,
      sets: ex.sets.map(set => ({
        reps: Number(set.reps) || 0,
        weight: Number(set.weight) || 0,
        completed: set.completed,
        unit: set.unit,
      })),
    }));

    const completedWorkoutData: CompletedWorkout = {
      id: uuid.v4() as string,
      templateId: initialTemplate?.id,
      name: workoutName,
      startTime: startTime,
      endTime: endTime,
      durationSeconds: finalDurationSeconds,
      exercises: finalExercises,
    };

    try {
      saveCompletedWorkout(completedWorkoutData);
      clearActiveWorkoutSession();
      console.log("Workout Saved:", completedWorkoutData);
      Alert.alert(
        "Workout Complete!",
        `Duration: ${formatDuration(finalDurationSeconds)}`,
        [{ text: "OK", onPress: () => navigation.popToTop() }]
      );
    } catch (error) {
      console.error("Failed to save workout:", error);
      Alert.alert("Error", "Could not save workout session.");
      isFinishedRef.current = false;
    }
  }, [startTime, initialTemplate, workoutName, navigation]);

  // --- Header (remains the same) ---
  useLayoutEffect(() => {
    navigation.setOptions({
      title: workoutName,
      headerTitleAlign: "left",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 5, marginLeft: 10 }}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleFinishWorkout}
          style={styles.finishButton}
        >
          <Icon
            name="content-save-check-outline"
            size={18}
            color={colors.buttonText}
            style={{ marginRight: 5 }}
          />
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </TouchableOpacity>
      ),
      gestureEnabled: false,
    });
  }, [navigation, handleFinishWorkout, workoutName, colors]);

  // --- NEW: Helper to Get Exercise Status ---
  const getExerciseStatus = (
    exercise: ActiveWorkoutExercise
  ): ExerciseStatus => {
    if (!exercise || !exercise.sets || exercise.sets.length === 0) {
      return "not-started"; // Or handle as an error/edge case
    }
    const totalSets = exercise.sets.length;
    const completedSets = exercise.sets.filter(set => set.completed).length;

    if (completedSets === 0) {
      return "not-started";
    } else if (completedSets === totalSets) {
      return "completed";
    } else {
      return "in-progress";
    }
  };

  // --- Styles ---
  const styles = StyleSheet.create({
    // ... (keep existing styles for container, timer, nav, inputs etc.) ...
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 40, // Space at bottom
    },
    // Timer Section
    timerSection: {
      padding: 16,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    timerLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    timerDisplay: {
      fontSize: 48, // Large timer display
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
      fontVariant: ["tabular-nums"], // Keep numbers aligned
    },
    timerControls: {
      flexDirection: "row",
    },
    timerButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      marginHorizontal: 5,
    },
    timerButtonPrimary: {
      backgroundColor: colors.primary,
    },
    timerButtonSecondary: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timerButtonText: {
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 5,
    },
    timerButtonTextPrimary: {
      color: colors.buttonText,
    },
    timerButtonTextSecondary: {
      color: colors.text,
    },
    // Navigation Section
    navSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    navButton: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      backgroundColor: colors.card,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    navButtonDisabled: {
      backgroundColor: colors.background, // Different bg when disabled
      opacity: 0.5,
    },
    // Current Exercise Section
    currentExerciseSection: {
      paddingHorizontal: 16,
      paddingTop: 16, // Add top padding
      paddingBottom: 6, // Reduce bottom padding slightly
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    currentExerciseTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    setTableHeader: {
      flexDirection: "row",
      marginBottom: 8,
      paddingHorizontal: 5,
    },
    setHeaderText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "bold",
      textAlign: "center",
    },
    // Column widths
    setCol: { width: 40 },
    repsCol: { flex: 1, marginHorizontal: 5 },
    weightCol: { flex: 1.5, marginHorizontal: 5 }, // Make weight col wider
    doneCol: { width: 50 },
    // Set Row
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      paddingVertical: 5,
    },
    setNumberText: {
      width: 40,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    // Input container for Reps
    repsInputContainer: {
      flex: 1, // Takes space defined by repsCol
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      marginHorizontal: 5,
      minHeight: 40,
      justifyContent: "center",
      position: "relative", // Needed for absolute positioning of +/- buttons
    },
    // Input container for Weight (includes unit buttons)
    weightInputContainer: {
      flex: 1.5, // Takes space defined by weightCol
      flexDirection: "row", // Arrange input and units horizontally
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingLeft: 8, // Padding before the text input
      marginHorizontal: 5,
      minHeight: 40,
    },
    setInput: {
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
      paddingVertical: 8,
    },
    // Specific style for weight input to control its width within the container
    weightTextInput: {
      flex: 1, // Allow input to take available space before units
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
      paddingVertical: 8,
    },
    // Unit toggle buttons
    unitToggleContainer: {
      flexDirection: "row",
      marginLeft: 5, // Space between input and units
      paddingRight: 5, // Padding inside the border
    },
    unitToggleButton: {
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 4,
      marginLeft: 3,
    },
    unitToggleButtonSelected: {
      backgroundColor: colors.primary,
    },
    unitToggleText: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.textSecondary,
    },
    unitToggleTextSelected: {
      color: colors.buttonText,
    },
    // Done button
    setDoneButton: {
      width: 50,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 5,
    },
    setDoneButtonCompleted: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    setRowCompleted: {
      opacity: 0.6,
    },
    // Reps +/- buttons
    decreaseReps: {
      position: "absolute",
      right: 5, // Position inside right edge
      top: -5, // Adjust vertical position
      zIndex: 2,
      padding: 5,
    },
    increaseReps: {
      position: "absolute",
      right: 5, // Position inside right edge
      bottom: -5, // Adjust vertical position
      zIndex: 2,
      padding: 5,
    },
    // All Exercises Section
    allExercisesSection: {
      paddingTop: 16,
      rowGap: 8, // Use gap for spacing between items
      paddingBottom: 20, // Add padding at the bottom
    },
    allExercisesTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
      paddingHorizontal: 16,
    },
    exerciseListItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12, // Adjust padding
      paddingHorizontal: 16,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.card, // Default background
    },
    exerciseListItemActive: {
      borderColor: colors.primary, // Highlight border for active
      backgroundColor: colors.progressBarBackground, // Slightly different bg for active
    },
    // --- NEW: Styles for Exercise Status ---
    exerciseListItemContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1, // Take available space
    },
    statusIcon: {
      marginRight: 12, // Space between icon and text
      width: 20, // Fixed width for alignment
      textAlign: "center",
    },
    exerciseListItemTextContainer: {
      flex: 1, // Allow text to wrap
    },
    exerciseListName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500", // Make name slightly bolder
    },
    exerciseListSets: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2, // Add space below name
    },
    // Specific styles based on status
    exerciseListItemInProgress: {
      // Optional: slightly different background or border
      // backgroundColor: colors.background,
    },
    exerciseListItemCompleted: {
      opacity: 0.6, // Dim completed exercises
      // backgroundColor: colors.background, // Optional different background
    },
    // Finish Button (Header)
    finishButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginRight: 10,
    },
    finishButtonText: {
      color: colors.buttonText,
      fontWeight: "bold",
      fontSize: 14,
    },
    placeholderText: {
      color: colors.textSecondary,
      textAlign: "center",
      padding: 20,
    },
  });

  // --- Render ---
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Workout Timer */}
      <View style={styles.timerSection}>
        {/* ... timer display and buttons ... */}
        <Text style={styles.timerLabel}>Workout Timer</Text>
        <Text style={styles.timerDisplay}>
          {formatDuration(elapsedSeconds)}
        </Text>
        <View style={styles.timerControls}>
          <TouchableOpacity
            style={[
              styles.timerButton,
              isTimerRunning
                ? styles.timerButtonSecondary
                : styles.timerButtonPrimary,
            ]}
            onPress={handleToggleTimer}
          >
            <Icon
              name={isTimerRunning ? "pause" : "play"}
              size={18}
              color={isTimerRunning ? colors.text : colors.buttonText}
            />
            <Text
              style={[
                styles.timerButtonText,
                isTimerRunning
                  ? styles.timerButtonTextSecondary
                  : styles.timerButtonTextPrimary,
              ]}
            >
              {isTimerRunning ? "Pause" : "Start"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timerButton, styles.timerButtonSecondary]}
            onPress={handleResetTimer}
          >
            <Icon name="backup-restore" size={18} color={colors.text} />
            <Text
              style={[styles.timerButtonText, styles.timerButtonTextSecondary]}
            >
              Reset
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Prev/Next Navigation */}
      <View style={styles.navSection}>
        {/* ... nav buttons ... */}
        <TouchableOpacity
          style={[
            styles.navButton,
            currentExerciseIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePreviousExercise}
          disabled={currentExerciseIndex === 0}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentExerciseIndex >= workoutExercises.length - 1 &&
              styles.navButtonDisabled,
          ]}
          onPress={handleNextExercise}
          disabled={currentExerciseIndex >= workoutExercises.length - 1}
        >
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Current Exercise Details */}
      {currentExercise ? (
        <View style={styles.currentExerciseSection}>
          <Text style={styles.currentExerciseTitle}>
            {currentExercise.name}
          </Text>
          {/* Set Table Header */}
          <View style={styles.setTableHeader}>
            <Text style={[styles.setHeaderText, styles.setCol]}>Set</Text>
            <Text style={[styles.setHeaderText, styles.repsCol]}>Reps</Text>
            <Text style={[styles.setHeaderText, styles.weightCol]}>Weight</Text>
            <Text style={[styles.setHeaderText, styles.doneCol]}>Done</Text>
          </View>
          {/* Sets List */}
          {currentExercise.sets.map((set, index) => (
            <View
              key={set.id}
              style={[styles.setRow, set.completed && styles.setRowCompleted]}
            >
              <Text style={styles.setNumberText}>{index + 1}</Text>

              {/* Reps Input */}
              <View style={styles.repsInputContainer}>
                <TextInput
                  style={styles.setInput}
                  value={set.reps.toString()}
                  onChangeText={value => handleRepsChange(index, value)}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  editable={!set.completed}
                />
                {/* +/- Buttons for Reps */}
                <TouchableOpacity
                  onPress={() =>
                    !set.completed &&
                    handleRepsChange(index, (set.reps + 1).toString())
                  }
                  style={styles.decreaseReps}
                  disabled={set.completed}
                >
                  <Icon
                    name="chevron-up"
                    size={20}
                    color={set.completed ? colors.border : colors.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    !set.completed &&
                    handleRepsChange(
                      index,
                      Math.max(0, set.reps - 1).toString()
                    )
                  }
                  style={styles.increaseReps}
                  disabled={set.completed}
                >
                  <Icon
                    name="chevron-down"
                    size={20}
                    color={set.completed ? colors.border : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Weight Input & Unit Toggle */}
              <View style={styles.weightInputContainer}>
                <TextInput
                  style={styles.weightTextInput}
                  value={set.weight.toString()}
                  onChangeText={value => handleWeightChange(index, value)}
                  keyboardType="numeric"
                  selectTextOnFocus
                  editable={!set.completed}
                />
                <View style={styles.unitToggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.unitToggleButton,
                      set.unit === "kg" && styles.unitToggleButtonSelected,
                    ]}
                    onPress={() =>
                      !set.completed && handleUnitChange(index, "kg")
                    }
                    disabled={set.completed}
                  >
                    <Text
                      style={[
                        styles.unitToggleText,
                        set.unit === "kg" && styles.unitToggleTextSelected,
                      ]}
                    >
                      kg
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unitToggleButton,
                      set.unit === "lbs" && styles.unitToggleButtonSelected,
                    ]}
                    onPress={() =>
                      !set.completed && handleUnitChange(index, "lbs")
                    }
                    disabled={set.completed}
                  >
                    <Text
                      style={[
                        styles.unitToggleText,
                        set.unit === "lbs" && styles.unitToggleTextSelected,
                      ]}
                    >
                      lbs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Done Button */}
              <TouchableOpacity
                style={[
                  styles.setDoneButton,
                  set.completed && styles.setDoneButtonCompleted,
                ]}
                onPress={() => handleToggleSetComplete(index)}
              >
                <Icon
                  name={set.completed ? "check" : "checkbox-blank-outline"}
                  size={20}
                  color={
                    set.completed ? colors.buttonText : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={styles.placeholderText}>
            {workoutExercises.length === 0
              ? "No exercises in this workout."
              : "Select an exercise."}
          </Text>
        </View>
      )}

      {/* All Exercises List */}
      <View style={styles.allExercisesSection}>
        <Text style={styles.allExercisesTitle}>All Exercises</Text>
        {workoutExercises.map((exercise, index) => {
          const status = getExerciseStatus(exercise);
          let statusIconName: React.ComponentProps<typeof Icon>["name"] =
            "circle-outline"; // Default: not-started
          let statusIconColor = colors.textSecondary;
          let itemStyle = styles.exerciseListItem;

          if (status === "in-progress") {
            statusIconName = "circle-slice-5"; // Example icon for in-progress
            statusIconColor = colors.primary;
            itemStyle = {
              ...itemStyle,
              ...styles.exerciseListItemInProgress,
            };
          } else if (status === "completed") {
            statusIconName = "check-circle";
            statusIconColor = colors.primary; // Or a success color like green
            itemStyle = { ...itemStyle, ...styles.exerciseListItemCompleted };
          }

          // Add active style if it's the current exercise
          if (index === currentExerciseIndex) {
            itemStyle = { ...itemStyle, ...styles.exerciseListItemActive };
          }

          return (
            <TouchableOpacity
              key={exercise.id}
              style={itemStyle}
              onPress={() => handleSelectExercise(index)}
            >
              <View style={styles.exerciseListItemContent}>
                <Icon
                  name={statusIconName}
                  size={18}
                  color={statusIconColor}
                  style={styles.statusIcon}
                />
                <View style={styles.exerciseListItemTextContainer}>
                  <Text style={styles.exerciseListName}>{exercise.name}</Text>
                  <Text style={styles.exerciseListSets}>
                    {exercise.sets.length} sets
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        {workoutExercises.length === 0 && (
          <Text style={[styles.placeholderText, { padding: 15 }]}>
            Add exercises to begin.
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

export default ActiveWorkoutScreen;
