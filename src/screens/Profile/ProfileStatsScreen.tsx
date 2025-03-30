// src/screens/Profile/ProfileStatsScreen.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput, // Import TextInput
  Alert,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Card from "@/components/Card";
import ProgressBar from "@/components/ProgressBar";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import {
  getWorkoutHistory,
  CompletedWorkout,
  getUserGoals, // Import goal functions
  saveUserGoals, // Import goal functions
  UserGoals, // Import goal type
} from "@/services/storage";
import { calculateWeeklyStats } from "@/utils/calculations";
import { formatRelativeDate } from "@/utils/formatters";

// Define structure for PRs
interface PersonalRecord {
  exerciseName: string;
  weight: number;
  unit: string;
  date: number; // Store timestamp
}

// Define which exercises to track PRs for
const PR_EXERCISES_TO_TRACK = [
  "Barbell Bench Press",
  "Barbell Squats",
  "Deadlifts",
];

const ProfileStatsScreen: React.FC = () => {
  const { colors, preferences } = useTheme(); // Get preferences for unit display
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({
    count: 0,
    totalSeconds: 0,
    activeDaysCount: 0,
    totalVolumeKg: 0,
  });
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [goals, setGoals] = useState<UserGoals>(getUserGoals()); // Load initial goals
  const [editableGoals, setEditableGoals] = useState<UserGoals>(goals); // State for editing
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  // --- Data Loading and Calculation ---
  const loadStatsAndGoals = useCallback(() => {
    setIsLoading(true);
    try {
      // Load Goals first
      const currentGoals = getUserGoals();
      setGoals(currentGoals);
      setEditableGoals(currentGoals); // Sync editable state

      // Load History and Calculate Stats
      const history = getWorkoutHistory();
      const stats = calculateWeeklyStats(history);
      setWeeklyStats(stats);

      // Calculate Personal Records (same logic as before)
      const calculatedPRs: Record<string, PersonalRecord> = {};
      history.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (PR_EXERCISES_TO_TRACK.includes(exercise.name)) {
            exercise.sets.forEach(set => {
              if (set.weight > 0) {
                const currentPR = calculatedPRs[exercise.name];
                if (!currentPR || set.weight > currentPR.weight) {
                  calculatedPRs[exercise.name] = {
                    exerciseName: exercise.name,
                    weight: set.weight,
                    unit: set.unit,
                    date: workout.startTime,
                  };
                }
              }
            });
          }
        });
      });
      setPersonalRecords(Object.values(calculatedPRs));
    } catch (error) {
      console.error("Error loading profile stats:", error);
      Alert.alert("Error", "Could not load profile data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload data when the screen comes into focus
  useFocusEffect(loadStatsAndGoals);

  // --- Goal Editing Handlers ---
  const handleToggleEditGoals = () => {
    if (isEditingGoals) {
      // If cancelling, reset editable goals to current saved goals
      setEditableGoals(goals);
    }
    setIsEditingGoals(!isEditingGoals);
  };

  const handleGoalChange = (field: keyof UserGoals, value: string) => {
    const numericValue = parseInt(value, 10);
    setEditableGoals(prev => ({
      ...prev,
      [field]: isNaN(numericValue) ? "" : numericValue, // Store as number or empty string if invalid temp
    }));
  };

  const handleSaveGoals = () => {
    // Validate before saving (ensure they are numbers >= 0)
    const goalsToSave: UserGoals = {
      weeklyWorkouts: Number(editableGoals.weeklyWorkouts) || 0,
      weeklyActiveDays: Number(editableGoals.weeklyActiveDays) || 0,
      weeklyVolumeKg: Number(editableGoals.weeklyVolumeKg) || 0,
    };
    saveUserGoals(goalsToSave);
    setGoals(goalsToSave); // Update the main goals state
    setIsEditingGoals(false);
    Alert.alert("Success", "Weekly goals updated!");
  };

  // --- Render Logic ---
  const weeklyWorkoutProgress =
    goals.weeklyWorkouts > 0 ? weeklyStats.count / goals.weeklyWorkouts : 0;
  const weeklyDaysProgress =
    goals.weeklyActiveDays > 0
      ? weeklyStats.activeDaysCount / goals.weeklyActiveDays
      : 0;
  const weeklyVolumeProgress =
    goals.weeklyVolumeKg > 0
      ? weeklyStats.totalVolumeKg / goals.weeklyVolumeKg
      : 0;

  // Format volume for display based on user preference
  const displayVolume =
    preferences.defaultWeightUnit === "lbs"
      ? Math.round(weeklyStats.totalVolumeKg / 0.453592) // Convert kg to lbs
      : weeklyStats.totalVolumeKg;
  const displayVolumeGoal =
    preferences.defaultWeightUnit === "lbs"
      ? Math.round(goals.weeklyVolumeKg / 0.453592) // Convert kg to lbs
      : goals.weeklyVolumeKg;
  const displayVolumeUnit = preferences.defaultWeightUnit;

  // --- Styles ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingVertical: 8,
      paddingBottom: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4, // Reduced margin
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    editButton: {
      padding: 5, // Touch area for edit icon
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 15, // Reduced margin
    },
    goalItem: {
      // Removed marginTop, handled by container
    },
    goalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 5, // Space between label row and progress bar
    },
    goalHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    goalLabel: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.text,
    },
    goalProgressText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    progressBar: {
      marginTop: 0, // Removed top margin
      marginBottom: 15, // Add margin below progress bar
    },
    // Styles for Goal Editing
    goalInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 15,
    },
    goalInputLabel: {
      fontSize: 14,
      color: colors.text,
      flex: 2, // Give label more space
    },
    goalInput: {
      flex: 1, // Input takes less space
      fontSize: 14,
      color: colors.text,
      textAlign: "right",
      backgroundColor: colors.background, // Contrast background
      borderRadius: 4,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 10,
    },
    goalEditButtons: {
      flexDirection: "row",
      justifyContent: "flex-end", // Align buttons to the right
      marginTop: 10,
    },
    goalActionButton: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 6,
      marginLeft: 10,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    goalActionButtonText: {
      fontSize: 14,
      fontWeight: "500",
    },
    saveButtonText: {
      color: colors.buttonText,
    },
    cancelButtonText: {
      color: colors.text,
    },
    // PR Styles (keep existing)
    prItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    prItemLast: {
      borderBottomWidth: 0,
    },
    prInfo: {
      flex: 1,
      marginRight: 10,
    },
    prExercise: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    prDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    prWeight: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    iconStyle: {
      color: colors.textSecondary,
    },
    placeholderText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: 10,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled" // Handle taps during input
    >
      {/* Weekly Goals Card */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weekly Goals</Text>
          {!isEditingGoals && ( // Show Edit button only when not editing
            <TouchableOpacity
              onPress={handleToggleEditGoals}
              style={styles.editButton}
            >
              <Icon name="pencil-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.cardSubtitle}>
          {isEditingGoals
            ? "Set your targets for the week"
            : "Your progress towards this week's goals"}
        </Text>

        {isEditingGoals ? (
          // --- Goal Editing View ---
          <>
            <View style={styles.goalInputContainer}>
              <Text style={styles.goalInputLabel}>Workouts / week</Text>
              <TextInput
                style={styles.goalInput}
                value={editableGoals.weeklyWorkouts.toString()}
                onChangeText={val => handleGoalChange("weeklyWorkouts", val)}
                keyboardType="number-pad"
                selectTextOnFocus
              />
            </View>
            <View style={styles.goalInputContainer}>
              <Text style={styles.goalInputLabel}>Active Days / week</Text>
              <TextInput
                style={styles.goalInput}
                value={editableGoals.weeklyActiveDays.toString()}
                onChangeText={val => handleGoalChange("weeklyActiveDays", val)}
                keyboardType="number-pad"
                selectTextOnFocus
              />
            </View>
            <View style={styles.goalInputContainer}>
              <Text style={styles.goalInputLabel}>
                Volume / week ({displayVolumeUnit})
              </Text>
              <TextInput
                style={styles.goalInput}
                value={
                  (preferences.defaultWeightUnit === "lbs"
                    ? Math.round(editableGoals.weeklyVolumeKg / 0.453592)
                    : editableGoals.weeklyVolumeKg
                  ).toString() // Display/edit in preferred unit
                }
                onChangeText={val => {
                  // Convert back to kg for saving
                  const displayVal = parseInt(val, 10);
                  const valKg =
                    preferences.defaultWeightUnit === "lbs"
                      ? Math.round(
                          (isNaN(displayVal) ? 0 : displayVal) * 0.453592
                        )
                      : isNaN(displayVal)
                        ? 0
                        : displayVal;
                  handleGoalChange("weeklyVolumeKg", valKg.toString());
                }}
                keyboardType="number-pad"
                selectTextOnFocus
              />
            </View>
            <View style={styles.goalEditButtons}>
              <TouchableOpacity
                onPress={handleToggleEditGoals} // Cancel action
                style={[styles.goalActionButton, styles.cancelButton]}
              >
                <Text
                  style={[styles.goalActionButtonText, styles.cancelButtonText]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveGoals}
                style={[styles.goalActionButton, styles.saveButton]}
              >
                <Text
                  style={[styles.goalActionButtonText, styles.saveButtonText]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // --- Goal Display View ---
          <>
            {/* Workouts Goal */}
            <View style={styles.goalItem}>
              <View style={styles.goalRow}>
                <View style={styles.goalHeader}>
                  <Icon name="dumbbell" size={16} style={styles.iconStyle} />
                  <Text style={styles.goalLabel}>Workouts</Text>
                </View>
                <Text style={styles.goalProgressText}>
                  {weeklyStats.count}/{goals.weeklyWorkouts}
                </Text>
              </View>
              <ProgressBar
                progress={weeklyWorkoutProgress}
                style={styles.progressBar}
              />
            </View>

            {/* Active Days Goal */}
            <View style={styles.goalItem}>
              <View style={styles.goalRow}>
                <View style={styles.goalHeader}>
                  <Icon
                    name="calendar-check"
                    size={16}
                    style={styles.iconStyle}
                  />
                  <Text style={styles.goalLabel}>Active Days</Text>
                </View>
                <Text style={styles.goalProgressText}>
                  {weeklyStats.activeDaysCount}/{goals.weeklyActiveDays}
                </Text>
              </View>
              <ProgressBar
                progress={weeklyDaysProgress}
                style={styles.progressBar}
              />
            </View>

            {/* Volume Goal */}
            <View style={styles.goalItem}>
              <View style={styles.goalRow}>
                <View style={styles.goalHeader}>
                  <Icon
                    name="weight-kilogram"
                    size={16}
                    style={styles.iconStyle}
                  />
                  <Text style={styles.goalLabel}>
                    Volume ({displayVolumeUnit})
                  </Text>
                </View>
                <Text style={styles.goalProgressText}>
                  {displayVolume.toLocaleString()}/
                  {displayVolumeGoal.toLocaleString()}
                </Text>
              </View>
              <ProgressBar
                progress={weeklyVolumeProgress}
                style={styles.progressBar}
              />
            </View>
          </>
        )}
      </Card>

      {/* Personal Records Card (Keep existing PR rendering logic) */}
      <Card>
        <Text style={styles.cardTitle}>Personal Records</Text>
        {personalRecords.length > 0 ? (
          personalRecords.map((pr, index) => (
            <View
              key={pr.exerciseName}
              style={[
                styles.prItem,
                index === personalRecords.length - 1 && styles.prItemLast,
              ]}
            >
              <View style={styles.prInfo}>
                <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                <Text style={styles.prDate}>{formatRelativeDate(pr.date)}</Text>
              </View>
              <Text style={styles.prWeight}>
                {pr.weight} {pr.unit}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.placeholderText}>
            No personal records found for tracked exercises yet.
          </Text>
        )}
        {PR_EXERCISES_TO_TRACK.filter(
          exName => !personalRecords.some(pr => pr.exerciseName === exName)
        ).map((exName, index, array) => (
          <View
            key={exName}
            style={[
              styles.prItem,
              personalRecords.length === 0 && index === array.length - 1
                ? styles.prItemLast
                : null,
            ]}
          >
            <View style={styles.prInfo}>
              <Text style={styles.prExercise}>{exName}</Text>
              <Text style={styles.prDate}>No record yet</Text>
            </View>
            <Text style={styles.prWeight}>-</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

export default ProfileStatsScreen;
