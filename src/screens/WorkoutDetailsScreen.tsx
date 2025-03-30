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
import { useTheme } from "@/theme/ThemeContext"; // Import useTheme
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

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutDetails">;

const WorkoutDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme(); // Get colors from theme context
  const { workoutId } = route.params;

  const [workout, setWorkout] = useState<CompletedWorkout | null>(null);
  const [editableWorkout, setEditableWorkout] =
    useState<CompletedWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // --- Fetch Data ---
  const loadWorkoutDetails = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedWorkout = getCompletedWorkoutById(workoutId);
      if (fetchedWorkout) {
        setWorkout(fetchedWorkout);
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
    if (isEditMode && workout) {
      setEditableWorkout(JSON.parse(JSON.stringify(workout)));
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveChanges = () => {
    if (editableWorkout) {
      try {
        updateCompletedWorkout(editableWorkout);
        setWorkout(JSON.parse(JSON.stringify(editableWorkout)));
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
    setEditableWorkout(prev => (prev ? { ...prev, notes: text } : null));
  };

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: "reps" | "weight",
    value: string
  ) => {
    setEditableWorkout(prev => {
      if (!prev) return null;
      const updatedExercises = [...prev.exercises];
      if (updatedExercises[exerciseIndex]) {
        const updatedSets = [...updatedExercises[exerciseIndex].sets];
        if (updatedSets[setIndex]) {
          const numericValue =
            field === "reps" ? parseInt(value, 10) : parseFloat(value);
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
    navigation.setOptions({
      // Use theme colors for header icons
      headerTintColor: colors.text, // Color for back arrow and title
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
    colors, // Add colors as dependency
  ]);

  // --- Styles using theme colors ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, // Use theme background
    },
    contentContainer: {
      paddingBottom: 30,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: colors.background, // Use theme background
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
      // Card component already uses theme colors
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text, // Use theme text
      marginBottom: 15,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    detailText: {
      fontSize: 16,
      color: colors.textSecondary, // Use theme text secondary
      marginLeft: 10,
    },
    notesContainer: {
      marginTop: 10,
    },
    notesLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text, // Use theme text
      marginBottom: 5,
    },
    notesText: {
      fontSize: 15,
      color: colors.textSecondary, // Use theme text secondary
      lineHeight: 22,
    },
    notesInput: {
      fontSize: 15,
      color: colors.text, // Use theme text
      lineHeight: 22,
      backgroundColor: colors.background, // Use theme background for contrast inside card
      borderRadius: 6,
      padding: 10,
      minHeight: 60,
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor: colors.border, // Use theme border
    },
    exerciseCard: {
      marginHorizontal: 16,
      marginTop: 10,
      padding: 15,
      // Card component already uses theme colors
    },
    exerciseName: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text, // Use theme text
      marginBottom: 15,
    },
    setRowHeader: {
      flexDirection: "row",
      marginBottom: 8,
      paddingBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: colors.border, // Use theme border
    },
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    setHeaderText: {
      fontSize: 13,
      color: colors.textSecondary, // Use theme text secondary
      fontWeight: "bold",
      textAlign: "center",
    },
    setText: {
      fontSize: 15,
      color: colors.textSecondary, // Use theme text secondary
      textAlign: "center",
    },
    setInput: {
      fontSize: 15,
      color: colors.text, // Use theme text
      textAlign: "center",
      backgroundColor: colors.background, // Use theme background for contrast
      borderRadius: 4,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.border, // Use theme border
    },
    // Column widths
    setCol: { width: 40 },
    repsCol: { flex: 1, marginHorizontal: 5 },
    weightCol: { flex: 1.5, marginHorizontal: 5 },
    unitCol: { width: 60 },

    // Styles for weight input + unit toggle in edit mode
    weightInputContainer: {
      flex: 1.5,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background, // Use theme background for contrast
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border, // Use theme border
      paddingLeft: 8,
      marginHorizontal: 5,
    },
    weightTextInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text, // Use theme text
      textAlign: "center",
      paddingVertical: 6,
    },
    unitToggleContainer: {
      flexDirection: "row",
      marginLeft: 5,
      paddingRight: 5,
    },
    unitToggleButton: {
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 4,
      marginLeft: 3,
      borderWidth: 1,
      borderColor: "transparent",
    },
    unitToggleButtonSelected: {
      backgroundColor: colors.primary, // Use theme primary
      borderColor: colors.primary, // Use theme primary
    },
    unitToggleText: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.textSecondary, // Use theme text secondary
    },
    unitToggleTextSelected: {
      color: colors.buttonText, // Use theme button text
    },
  });

  // --- Render Logic ---
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.destructive }}>
          {error || "Workout data unavailable."}
        </Text>
      </View>
    );
  }

  const displayData = isEditMode ? editableWorkout : workout;
  if (!displayData) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
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
        <Card key={exercise.id} style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.setRowHeader}>
            <Text style={[styles.setHeaderText, styles.setCol]}>Set</Text>
            <Text style={[styles.setHeaderText, styles.repsCol]}>Reps</Text>
            <Text style={[styles.setHeaderText, styles.weightCol]}>Weight</Text>
            {isEditMode ? <View style={styles.unitCol} /> : null}
          </View>
          {exercise.sets.map((set, setIndex) => (
            <View key={set.id} style={styles.setRow}>
              <Text style={[styles.setText, styles.setCol]}>
                {setIndex + 1}
              </Text>
              {isEditMode ? (
                <>
                  <TextInput
                    style={[styles.setInput, styles.repsCol]}
                    value={set.reps.toString()}
                    onChangeText={val =>
                      handleSetChange(exIndex, setIndex, "reps", val)
                    }
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <View style={styles.weightInputContainer}>
                    <TextInput
                      style={styles.weightTextInput}
                      value={set.weight.toString()}
                      onChangeText={val =>
                        handleSetChange(exIndex, setIndex, "weight", val)
                      }
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <View style={styles.unitToggleContainer}>
                      <TouchableOpacity
                        style={[
                          styles.unitToggleButton,
                          set.unit === "kg" && styles.unitToggleButtonSelected,
                        ]}
                        onPress={() =>
                          handleUnitChange(exIndex, setIndex, "kg")
                        }
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
                          handleUnitChange(exIndex, setIndex, "lbs")
                        }
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
                </>
              ) : (
                <>
                  <Text style={[styles.setText, styles.repsCol]}>
                    {set.reps}
                  </Text>
                  <Text style={[styles.setText, styles.weightCol]}>
                    {`${set.weight} ${set.unit}`}
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
