// src/screens/WorkoutDetailsScreen.tsx
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import Card from "@/components/Card";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import {
  getCompletedWorkoutById,
  CompletedWorkout,
  updateCompletedWorkout,
  deleteCompletedWorkout,
  WeightUnit,
} from "@/services/storage";
import { formatDuration, formatRelativeDate } from "@/utils/formatters";
import UnitToggleButtonGroup from "@/components/UnitToggleButtonGroup"; // Import toggle button
import WeightUnitInput from "@/components/WeightUnitInput"; // Import weight input

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutDetails">;

const WorkoutDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { workoutId } = route.params;

  const [workout, setWorkout] = useState<CompletedWorkout | null>(null);
  const [editableWorkout, setEditableWorkout] =
    useState<CompletedWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // --- Fetch Data ---
  const loadWorkoutDetails = useCallback(() => {
    // ... (implementation remains the same)
    setIsLoading(true);
    setError(null);
    try {
      const fetchedWorkout = getCompletedWorkoutById(workoutId);
      if (fetchedWorkout) {
        setWorkout(fetchedWorkout);
        // Deep copy for editing, ensure restTakenSeconds is copied
        setEditableWorkout(JSON.parse(JSON.stringify(fetchedWorkout)));
        navigation.setOptions({ title: fetchedWorkout.name });
      } else {
        setError("Workout not found.");
        Alert.alert("Error", "Could not find the completed workout details.");
        navigation.goBack();
      }
    } catch (err) {
      console.error("Error loading workout details:", err);
      setError("Failed to load workout details.");
      Alert.alert("Error", "An error occurred while loading the workout.");
    } finally {
      setIsLoading(false);
    }
  }, [workoutId, navigation]);

  useEffect(() => {
    loadWorkoutDetails();
  }, [loadWorkoutDetails]);

  // --- Edit Mode Handlers ---
  const handleToggleEdit = () => {
    // ... (implementation remains the same)
    if (isEditMode && workout) {
      // Reset editable state if cancelling edit
      setEditableWorkout(JSON.parse(JSON.stringify(workout)));
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveChanges = () => {
    // ... (implementation remains the same)
    if (editableWorkout) {
      try {
        updateCompletedWorkout(editableWorkout);
        setWorkout(JSON.parse(JSON.stringify(editableWorkout))); // Update displayed data
        setIsEditMode(false);
        Alert.alert("Success", "Workout details updated.");
      } catch (err) {
        console.error("Error saving workout details:", err);
        Alert.alert("Error", "Could not save changes.");
      }
    }
  };

  // --- Delete Handler ---
  const handleDelete = () => {
    // ... (implementation remains the same)
    Alert.alert(
      "Delete Workout?",
      "Are you sure you want to delete this completed workout record? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              deleteCompletedWorkout(workoutId);
              Alert.alert("Deleted", "Workout record deleted.");
              navigation.goBack();
            } catch (err) {
              console.error("Error deleting workout:", err);
              Alert.alert("Error", "Could not delete the workout record.");
            }
          },
        },
      ]
    );
  };

  // --- Input Change Handlers ---
  const handleNotesChange = (text: string) => {
    // ... (implementation remains the same)
    setEditableWorkout(prev => (prev ? { ...prev, notes: text } : null));
  };

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: "reps" | "weight" | "restTakenSeconds", // Add restTakenSeconds
    value: string
  ) => {
    setEditableWorkout(prev => {
      if (!prev) return null;
      const updatedExercises = [...prev.exercises];
      if (updatedExercises[exerciseIndex]) {
        const updatedSets = [...updatedExercises[exerciseIndex].sets];
        if (updatedSets[setIndex]) {
          const numericValue =
            field === "weight" ? parseFloat(value) : parseInt(value, 10); // Keep reps/rest as int
          updatedSets[setIndex] = {
            ...updatedSets[setIndex],
            [field]: isNaN(numericValue) ? 0 : numericValue,
          };
          updatedExercises[exerciseIndex] = {
            ...updatedExercises[exerciseIndex],
            sets: updatedSets,
          };
          return { ...prev, exercises: updatedExercises };
        }
      }
      return prev;
    });
  };

  const handleUnitChange = (
    exerciseIndex: number,
    setIndex: number,
    unit: WeightUnit
  ) => {
    // ... (implementation remains the same)
    setEditableWorkout(prev => {
      if (!prev) return null;
      const updatedExercises = [...prev.exercises];
      if (updatedExercises[exerciseIndex]) {
        const updatedSets = [...updatedExercises[exerciseIndex].sets];
        if (updatedSets[setIndex]) {
          updatedSets[setIndex] = { ...updatedSets[setIndex], unit: unit };
          updatedExercises[exerciseIndex] = {
            ...updatedExercises[exerciseIndex],
            sets: updatedSets,
          };
          return { ...prev, exercises: updatedExercises };
        }
      }
      return prev;
    });
  };

  // --- Dynamic Header ---
  useLayoutEffect(() => {
    // ... (implementation remains the same)
    navigation.setOptions({
      headerTintColor: colors.text,
      headerRight: () => (
        <View style={styles.headerButtons}>
          {isEditMode ? (
            <>
              <TouchableOpacity
                onPress={handleToggleEdit}
                style={styles.headerButton}
              >
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveChanges}
                style={[styles.headerButton, { marginLeft: 15 }]}
              >
                <Icon name="check" size={24} color={colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleToggleEdit}
                style={styles.headerButton}
              >
                <Icon name="pencil-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.headerButton, { marginLeft: 15 }]}
              >
                <Icon
                  name="trash-can-outline"
                  size={24}
                  color={colors.destructive}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    });
  }, [
    navigation,
    isEditMode,
    handleToggleEdit,
    handleSaveChanges,
    handleDelete,
    colors,
  ]);

  // --- Styles ---
  const styles = StyleSheet.create({
    // ... (keep existing styles: container, contentContainer, centered, headerButtons, headerButton, detailsCard, sectionTitle, detailRow, detailText, notesContainer, notesLabel, notesText, notesInput, exerciseCard, exerciseName) ...
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingBottom: 30,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: colors.background,
    },
    headerButtons: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerButton: {
      padding: 8,
    },
    detailsCard: {
      marginHorizontal: 16,
      marginTop: 8,
      padding: 15,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    detailText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginLeft: 10,
    },
    notesContainer: {
      marginTop: 10,
    },
    notesLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 5,
    },
    notesText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    notesInput: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
      backgroundColor: colors.background,
      borderRadius: 6,
      padding: 10,
      minHeight: 60,
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor: colors.border,
    },
    exerciseCard: {
      marginHorizontal: 16,
      marginTop: 10,
      padding: 15,
    },
    exerciseName: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    setRowHeader: {
      flexDirection: "row",
      marginBottom: 8,
      paddingBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 5, // Add padding to align with rows
    },
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 5, // Add padding to align with header
    },
    setHeaderText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "bold",
      textAlign: "center",
    },
    setText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
    },
    setInput: {
      fontSize: 15,
      color: colors.text,
      textAlign: "center",
      backgroundColor: colors.background,
      borderRadius: 4,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 40, // Ensure minimum width for small numbers
    },
    // Column widths - Adjust flex values
    setCol: { width: 35 }, // Slightly narrower
    repsCol: { flex: 0.8, marginHorizontal: 4 }, // Less flex
    weightCol: { flex: 1.2, marginHorizontal: 4 }, // More flex for WeightUnitInput
    restCol: { flex: 1, marginHorizontal: 4 }, // Flex for rest display/input
    // WeightUnitInput container style for edit mode
    weightInputStyle: {
      flex: 1.2, // Match header flex
      marginHorizontal: 4,
    },
  });

  // --- Render Logic ---
  if (isLoading) {
    // ... (loading indicator remains the same)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !workout) {
    // ... (error display remains the same)
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.destructive }}>
          {error || "Workout data unavailable."}
        </Text>
      </View>
    );
  }

  const displayData = isEditMode ? editableWorkout : workout;
  if (!displayData) return null; // Should not happen if loading/error handled

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Details Card (remains the same) */}
      <Card style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Workout Details</Text>
        <View style={styles.detailRow}>
          <Icon
            name="calendar-blank-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.detailText}>
            {formatRelativeDate(displayData.startTime)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="clock-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {formatDuration(displayData.durationSeconds)}
          </Text>
        </View>
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          {isEditMode ? (
            <TextInput
              style={styles.notesInput}
              value={editableWorkout?.notes || ""}
              onChangeText={handleNotesChange}
              placeholder="Add notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          ) : (
            <Text style={styles.notesText}>
              {displayData.notes || "No notes added."}
            </Text>
          )}
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { marginTop: 20, marginLeft: 16 }]}>
        Exercises
      </Text>
      {displayData.exercises.map((exercise, exIndex) => (
        <Card key={exercise.instanceId} style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          {/* --- Updated Set Header --- */}
          <View style={styles.setRowHeader}>
            <Text style={[styles.setHeaderText, styles.setCol]}>Set</Text>
            <Text style={[styles.setHeaderText, styles.repsCol]}>Reps</Text>
            <Text style={[styles.setHeaderText, styles.weightCol]}>Weight</Text>
            <Text style={[styles.setHeaderText, styles.restCol]}>Rest</Text>
          </View>
          {/* --- End Updated Set Header --- */}

          {exercise.sets.map((set, setIndex) => (
            <View key={set.id} style={styles.setRow}>
              <Text style={[styles.setText, styles.setCol]}>
                {setIndex + 1}
              </Text>
              {isEditMode ? (
                <>
                  {/* Reps Input */}
                  <TextInput
                    style={[styles.setInput, styles.repsCol]}
                    value={set.reps.toString()}
                    onChangeText={val =>
                      handleSetChange(exIndex, setIndex, "reps", val)
                    }
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  {/* Weight Input */}
                  <WeightUnitInput
                    containerStyle={styles.weightInputStyle} // Apply flex style
                    weightValue={set.weight.toString()}
                    unitValue={set.unit}
                    onWeightChange={val =>
                      handleSetChange(exIndex, setIndex, "weight", val)
                    }
                    onUnitChange={unit =>
                      handleUnitChange(exIndex, setIndex, unit)
                    }
                  />
                  {/* Rest Input */}
                  <TextInput
                    style={[styles.setInput, styles.restCol]}
                    value={(set.restTakenSeconds ?? "").toString()} // Handle undefined
                    onChangeText={val =>
                      handleSetChange(
                        exIndex,
                        setIndex,
                        "restTakenSeconds",
                        val
                      )
                    }
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                </>
              ) : (
                <>
                  {/* Reps Display */}
                  <Text style={[styles.setText, styles.repsCol]}>
                    {set.reps}
                  </Text>
                  {/* Weight Display */}
                  <Text style={[styles.setText, styles.weightCol]}>
                    {`${set.weight} ${set.unit}`}
                  </Text>
                  {/* Rest Display */}
                  <Text style={[styles.setText, styles.restCol]}>
                    {set.restTakenSeconds !== undefined &&
                    set.restTakenSeconds > 0
                      ? formatDuration(set.restTakenSeconds)
                      : "-"}
                  </Text>
                </>
              )}
            </View>
          ))}
        </Card>
      ))}
    </ScrollView>
  );
};

export default WorkoutDetailsScreen;
