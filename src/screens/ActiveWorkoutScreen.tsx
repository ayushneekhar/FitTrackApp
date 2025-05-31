import React, { useEffect, useLayoutEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { usePreventRemove } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import {
  CompletedWorkout,
  saveCompletedWorkout,
  ActiveWorkoutSession,
  saveActiveWorkoutSession,
  clearActiveWorkoutSession,
  CompletedWorkoutExercise,
  WeightUnit,
} from "@/services/storage";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import uuid from "react-native-uuid";
import { formatDuration } from "@/utils/formatters";

// Import Hooks
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { DEFAULT_REST_DURATION, useRestTimer } from "@/hooks/useRestTimer";
import { useWorkoutState } from "@/hooks/useWorkoutState";

// Import Components
import WorkoutTimerDisplay from "@/components/WorkoutTimerDisplay";
import ExerciseNavigator from "@/components/ExerciseNavigator";
import CurrentExerciseView from "@/components/CurrentExerciseView";
import ExerciseList from "@/components/ExerciseList";

type Props = NativeStackScreenProps<RootStackParamList, "ActiveWorkout">;

const ActiveWorkoutScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors, preferences } = useTheme();
  const { template: initialTemplate, resumeData } = route.params;
  const defaultUnit = preferences.defaultWeightUnit;

  // --- Refs ---
  const isFinishedRef = useRef(false); // Track if finish process has started

  // --- Custom Hooks ---
  const workout = useWorkoutState({
    initialTemplate,
    resumeData,
    defaultUnit,
  });

  const timer = useWorkoutTimer({
    initialAccumulatedSeconds: resumeData?.accumulatedSeconds,
    autoStart: !resumeData, // Start timer immediately for new workouts
  });

  const rest = useRestTimer({
    // Pass workout state updater to record actual rest
    onRecordRest: (setIndex, restTakenSeconds) => {
      // Ensure we update the correct exercise index
      if (workout.currentExerciseIndex !== null) {
        workout.updateSetRestTime(
          workout.currentExerciseIndex,
          setIndex,
          restTakenSeconds
        );
      }
    },
  });

  // --- Derived State ---
  const isResting = rest.isResting; // Countdown/overtick active
  const isUIBlocked = rest.isResting || rest.isRestPromptVisible; // Block nav/inputs if resting or prompt shown

  // --- Save Session on Unmount/Background (If not finished) ---
  const saveCurrentSession = useCallback(() => {
    if (!isFinishedRef.current && timer.startTime > 0 && !workout.isLoading) {
      const sessionToSave: ActiveWorkoutSession = {
        startTime: timer.startTime,
        accumulatedSeconds: timer.getCurrentElapsedSeconds(), // Get latest value
        // Save the *original* template structure for resuming
        template: initialTemplate || null,
        // Save current workout progress
        workoutState: {
          currentExerciseIndex: workout.currentExerciseIndex || 0,
          exercises: workout.workoutExercises.map(ex => ({
            instanceId: ex.instanceId,
            sets: ex.sets.map(set => ({
              id: set.id,
              completed: set.completed,
              reps: Number(set.reps) || 0,
              weight: set.weight || "0",
              unit: set.unit,
              restTakenSeconds: set.restTakenSeconds,
            })),
          })),
        },
      };
      console.log("Saving session state...", sessionToSave);
      saveActiveWorkoutSession(sessionToSave);
    } else {
      console.log("Not saving session (finished, loading, or invalid).");
    }
  }, [
    timer.startTime,
    timer.getCurrentElapsedSeconds,
    initialTemplate,
    workout.isLoading,
    workout.currentExerciseIndex,
    workout.workoutExercises,
  ]);

  // --- Prevent Back Navigation Hook ---
  usePreventRemove(
    timer.startTime > 0 && !isFinishedRef.current && !workout.isLoading,
    ({ data }) => {
      Alert.alert(
        "Pause Workout?",
        "Do you want to pause this workout and leave? Your progress will be saved.",
        [
          { text: "Stay", style: "cancel", onPress: () => {} },
          {
            text: "Pause & Leave",
            style: "destructive",
            onPress: () => {
              timer.pauseTimer(); // Ensure timer is paused
              saveCurrentSession();
              navigation.dispatch(data.action);
            },
          },
        ]
      );
    }
  );

  // --- Event Handlers (Orchestration) ---

  const handleToggleSetComplete = useCallback(
    (setIndex: number) => {
      const { exerciseJustCompleted, nextDefaultRest, isCompleting } =
        workout.toggleSetComplete(setIndex);

      if (isCompleting) {
        // Set was marked *complete*
        // Auto-start the rest timer immediately
        rest.prepareRest(setIndex, nextDefaultRest ?? DEFAULT_REST_DURATION);

        // Save progress after set completion
        saveCurrentSession();
      } else {
        // Set was marked *incomplete*
        rest.clearRestState();
        // No need to resume timer since it's not paused during rest

        // Also save when sets are marked incomplete
        saveCurrentSession();
      }

      // Auto-Advance Logic (Run slightly deferred to allow state updates)
      Promise.resolve().then(() => {
        if (exerciseJustCompleted && workout.canGoNext()) {
          console.log(
            `Exercise ${workout.currentExerciseIndex + 1} completed, advancing.`
          );
          // Use the navigation handler which also clears rest state etc.
          handleNavigateExercise(workout.nextExercise);
        }
      });
    },
    [workout, timer, rest, saveCurrentSession] // Add saveCurrentSession dependency
  );

  // Handles the common logic for changing exercises
  const handleNavigateExercise = useCallback(
    (navigateAction: () => number | undefined) => {
      if (isUIBlocked) return; // Don't navigate while resting

      rest.clearRestState(); // Clear any pending rest prompt
      // No need to resume timer since it's not paused during rest
      const nextDefaultRest = navigateAction(); // Call workout hook's action
      rest.setNextRestDuration(nextDefaultRest ?? DEFAULT_REST_DURATION); // Update rest duration for the new exercise
    },
    [rest, isUIBlocked] // workout dependency is implicit via navigateAction
  );

  const handleNextExercise = () => handleNavigateExercise(workout.nextExercise);
  const handlePreviousExercise = () =>
    handleNavigateExercise(workout.prevExercise);
  const handleSelectExercise = (index: number) =>
    handleNavigateExercise(() => workout.selectExercise(index));

  // --- Finish Workout Logic ---
  const handleFinishWorkout = useCallback(() => {
    if (!timer.startTime || workout.isLoading) return;

    isFinishedRef.current = true; // Prevent saving session state on unmount
    timer.pauseTimer();
    rest.clearRestState();

    const endTime = Date.now();
    const finalDurationSeconds = timer.getCurrentElapsedSeconds();

    // Map state to CompletedWorkout structure
    const finalExercises: CompletedWorkoutExercise[] =
      workout.workoutExercises.map(ex => ({
        instanceId: ex.instanceId,
        id: ex.id,
        name: ex.name,
        sets: ex.sets.map(set => ({
          id: set.id,
          reps: Number(set.reps) || 0,
          weight: Number(set.weight) || 0,
          completed: set.completed,
          unit: set.unit,
          restTakenSeconds: set.restTakenSeconds,
        })),
      }));

    const completedWorkoutData: CompletedWorkout = {
      id: uuid.v4() as string,
      templateId: workout.templateId,
      name: workout.workoutName,
      startTime: timer.startTime,
      endTime: endTime,
      durationSeconds: finalDurationSeconds,
      exercises: finalExercises,
    };

    try {
      saveCompletedWorkout(completedWorkoutData);
      clearActiveWorkoutSession(); // Clear any potentially saved session
      console.log("Workout Saved:", completedWorkoutData);
      Alert.alert(
        "Workout Complete!",
        `Duration: ${formatDuration(finalDurationSeconds)}`,
        [{ text: "OK", onPress: () => navigation.popToTop() }]
      );
    } catch (error) {
      console.error("Failed to save workout:", error);
      Alert.alert("Error", "Could not save workout session.");
      isFinishedRef.current = false; // Allow trying again
      // Decide if timer should resume or stay paused on error
      // timer.resumeTimer();
    }
  }, [
    timer.startTime,
    timer.getCurrentElapsedSeconds,
    timer.pauseTimer,
    rest.clearRestState,
    workout.isLoading,
    workout.workoutExercises,
    workout.templateId,
    workout.workoutName,
    navigation,
  ]);

  // --- Header ---
  useLayoutEffect(() => {
    navigation.setOptions({
      title: workout.workoutName,
      headerTitleAlign: "left",
      headerLeft: () => (
        <TouchableOpacity
          onPressIn={() => navigation.goBack()} // Default goBack triggers usePreventRemove
          style={{ padding: 5, marginLeft: 10 }}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPressIn={handleFinishWorkout}
          style={styles.finishButton} // Use local styles
          disabled={workout.isLoading} // Disable if loading
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
  }, [
    navigation,
    handleFinishWorkout,
    workout.workoutName,
    workout.isLoading,
    colors,
  ]);

  // --- Styles ---
  const styles = StyleSheet.create({
    // Keep only styles needed by the main screen component itself
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    placeholderText: {
      color: colors.textSecondary,
      textAlign: "center",
      padding: 20,
      marginTop: 30,
    },
    // Finish Button (Header) - Keep this here as it's part of the screen's layout effect
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
  });

  // --- Render Loading or Content ---
  if (workout.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Workout Timer */}
      <WorkoutTimerDisplay
        elapsedSeconds={timer.elapsedSeconds}
        isRunning={timer.isTimerRunning}
        onToggle={timer.toggleTimer}
        onReset={() => {
          // Add confirmation for reset
          Alert.alert(
            "Reset Timer?",
            "Are you sure you want to reset the timer?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Reset",
                style: "destructive",
                onPress: timer.resetTimer, // Call hook's reset
              },
            ]
          );
        }}
      />

      {/* Prev/Next Navigation */}
      <ExerciseNavigator
        onPrevious={handlePreviousExercise}
        onNext={handleNextExercise}
        canGoPrevious={workout.canGoPrevious()}
        canGoNext={workout.canGoNext()}
        disabled={isUIBlocked} // Disable if resting or prompt shown
      />

      {/* Current Exercise Details */}
      {workout.currentExercise ? (
        <CurrentExerciseView
          exercise={workout.currentExercise}
          exerciseIndex={workout.currentExerciseIndex}
          isResting={rest.isResting}
          restingSetIndex={rest.restingSetIndex}
          // Pass Rest Timer State/Callbacks
          isRestPromptVisible={rest.isRestPromptVisible}
          restDisplaySeconds={rest.displaySeconds}
          restOvertickSeconds={rest.overtickSeconds}
          restTargetDuration={rest.restTimerDuration}
          restNextDuration={rest.nextRestDuration}
          formattedRestDisplayTime={rest.formattedDisplayTime}
          formattedNextRestDuration={rest.formattedNextRestDuration}
          onStartRest={rest.startRest}
          onStopRest={rest.stopRest} // Pass renamed handler
          onAdjustRestDuration={rest.adjustRestDuration}
          // Pass Set Action Callbacks
          onUpdateSetField={workout.updateSetField}
          onToggleSetComplete={handleToggleSetComplete}
        />
      ) : (
        // Placeholder when no exercise is selected/available
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={styles.placeholderText}>
            {workout.workoutExercises.length === 0
              ? "No exercises in this workout."
              : "Select an exercise."}
          </Text>
        </View>
      )}

      {/* All Exercises List */}
      <ExerciseList
        exercises={workout.workoutExercises}
        currentExerciseIndex={workout.currentExerciseIndex}
        disabled={isUIBlocked} // Disable selection if resting or prompt shown
        onSelectExercise={handleSelectExercise}
        getExerciseStatus={workout.getExerciseStatus}
      />
    </ScrollView>
  );
};

export default ActiveWorkoutScreen;
