// src/screens/EditWorkoutScreen.tsx
import React, {
  useState,
  useLayoutEffect,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
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
  WorkoutTemplate, // Import WorkoutTemplate type
  getWorkoutTemplateById, // Import fetch function
  deleteWorkoutTemplate, // Import delete function
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
import { DEFAULT_REST_DURATION } from "@/hooks/useRestTimer";

// Define navigation props type, expecting templateId
type Props = NativeStackScreenProps<RootStackParamList, "EditWorkout">;

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

const EditWorkoutScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors, preferences } = useTheme();
  const { templateId } = route.params; // Get the ID from navigation

  // State
  const [originalTemplate, setOriginalTemplate] =
    useState<WorkoutTemplate | null>(null);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [addedExercises, setAddedExercises] = useState<WorkoutExercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Load Template Data ---
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      const template = getWorkoutTemplateById(templateId);
      if (template) {
        setOriginalTemplate(template);
        setWorkoutName(template.name);
        setWorkoutType(template.type);
        setDuration(template.durationEstimate?.toString() || "");
        // Map stored exercises to the state structure (WorkoutExercise)
        // Ensure sets have unique IDs if they didn't before (though they should from creation)
        setAddedExercises(
          template.exercises.map(ex => ({
            id: ex.id,
            name: ex.name,
            // Find category/type from DUMMY_EXERCISES if needed, or assume stored name is enough
            // For simplicity, we might need to adjust how category/type are handled
            // Let's assume we only need id/name/sets from storage for editing state
            category:
              DUMMY_EXERCISES.find(dex => dex.id === ex.id)?.category ||
              Categories.Other, // Fallback category
            type:
              DUMMY_EXERCISES.find(dex => dex.id === ex.id)?.type || "Unknown", // Fallback type
            sets: ex.sets.map(set => ({
              ...set,
              weight: (set.weight || 0).toString(), // Ensure weight is string for input
              // Unit will be applied dynamically if needed, template doesn't store it
            })), // Ensure sets are copied
            defaultRestSeconds: ex.defaultRestSeconds, // <-- Load rest time
          }))
        );
        navigation.setOptions({ title: `Edit: ${template.name}` }); // Update header title
      } else {
        setError("Workout template not found.");
        Alert.alert("Error", "Could not find the workout template to edit.");
        navigation.goBack(); // Go back if template not found
      }
    } catch (err) {
      console.error("Error loading template:", err);
      setError("Failed to load workout template.");
      Alert.alert("Error", "Failed to load the workout template.");
    } finally {
      setIsLoading(false);
    }
  }, [templateId, navigation]);

  // --- Default Set Values ---
  const defaultReps = 12;
  const defaultWeight = 0;

  // --- Handlers (Copied/adapted from CreateWorkoutScreen) ---

  const handleAddExercisesFromModal = (selectedExercises: Exercise[]) => {
    const newWorkoutExercises: WorkoutExercise[] = selectedExercises.map(
      ex => ({
        ...ex,
        sets: [
          // Add just one default set when adding in edit mode? Or multiple? Let's add one.
          {
            id: uuid.v4() as string,
            reps: defaultReps,
            weight: defaultWeight,
            unit: preferences.defaultWeightUnit, // Use preference for new sets
          },
        ],
        defaultRestSeconds: DEFAULT_REST_DURATION, // <-- Set default rest
      })
    );
    setAddedExercises(prevExercises => {
      const existingIds = new Set(prevExercises.map(e => e.id));
      const uniqueNewExercises = newWorkoutExercises.filter(
        ne => !existingIds.has(ne.id)
      );
      return [...prevExercises, ...uniqueNewExercises];
    });
    setIsModalVisible(false);
  };

  const removeExercise = (idToRemove: string) => {
    setAddedExercises(prev => prev.filter(ex => ex.id !== idToRemove));
  };

  const handleAddSet = (exerciseId: string) => {
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.id === exerciseId) {
          const newSet: WorkoutSet = {
            id: uuid.v4() as string,
            reps: defaultReps,
            weight: defaultWeight,
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      })
    );
  };

  const handleRemoveSet = (exerciseId: string, setIdToRemove: string) => {
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.id === exerciseId) {
          if (ex.sets.length <= 1) {
            Alert.alert(
              "Cannot Remove",
              "Each exercise must have at least one set."
            );
            return ex;
          }
          const updatedSets = ex.sets.filter(set => set.id !== setIdToRemove);
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  const handleRepChange = (
    exerciseId: string,
    setId: string,
    newReps: string
  ) => {
    const reps = parseInt(newReps, 10);
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.id === exerciseId) {
          const updatedSets = ex.sets.map(set => {
            if (set.id === setId) {
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

  const handleWeightChange = (
    exerciseId: string,
    setId: string,
    newWeight: string
  ) => {
    const weight = parseFloat(newWeight);
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.id === exerciseId) {
          const updatedSets = ex.sets.map(set => {
            if (set.id === setId) {
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

  const handleRestChange = (exerciseId: string, newRest: string) => {
    const rest = parseInt(newRest, 10);
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.id === exerciseId) {
          // Use exercise ID here as instanceId might not be stable/present
          return { ...ex, defaultRestSeconds: isNaN(rest) ? undefined : rest };
        }
        return ex;
      })
    );
  };

  // --- Save Changes Logic ---
  const handleSaveChanges = useCallback(() => {
    if (!workoutName.trim()) {
      Alert.alert("Missing Name", "Please enter a name for the workout.");
      return;
    }
    if (addedExercises.length === 0) {
      Alert.alert(
        "Missing Exercises",
        "Please add at least one exercise to the workout."
      );
      return;
    }

    const updatedTemplate: WorkoutTemplate = {
      id: templateId, // Use the existing ID
      name: workoutName.trim(),
      type: workoutType,
      durationEstimate: duration ? parseInt(duration, 10) : undefined,
      exercises: addedExercises.map(ex => ({
        instanceId: uuid.v4() as string, // Generate new instanceId on save? Or keep original? Let's generate.
        name: ex.name, // Save the potentially updated name? Or keep original? Let's save current name.
        sets: ex.sets.map(set => ({
          id: set.id,
          reps: Number(set.reps) || 0,
          weight: parseFloat(set.weight) || 0, // Save weight as number
        })),
        defaultRestSeconds: ex.defaultRestSeconds,
      })),
    };

    console.log(
      "Saving Changes to Template:",
      JSON.stringify(updatedTemplate, null, 2)
    );
    saveWorkoutTemplate(updatedTemplate); // This will overwrite based on ID
    Alert.alert("Success", "Workout template updated!");
    navigation.goBack();
  }, [
    templateId,
    workoutName,
    workoutType,
    duration,
    addedExercises,
    navigation,
  ]);

  // --- Delete Template Logic ---
  const handleDeleteTemplate = useCallback(() => {
    Alert.alert(
      "Delete Template",
      `Are you sure you want to delete the template "${workoutName || "this workout"}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              deleteWorkoutTemplate(templateId);
              Alert.alert("Deleted", "Workout template deleted successfully.");
              navigation.goBack(); // Go back after deletion
            } catch (err) {
              console.error("Error deleting template:", err);
              Alert.alert("Error", "Could not delete the template.");
            }
          },
        },
      ]
    );
  }, [templateId, workoutName, navigation]);

  // --- Add Save Button to Header ---
  useLayoutEffect(() => {
    navigation.setOptions({
      // Title is set dynamically in useEffect
      headerRight: () => (
        <TouchableOpacity onPress={handleSaveChanges} style={styles.saveButton}>
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
  }, [navigation, handleSaveChanges, colors]); // Add dependencies

  // --- Styles (Copied/adapted from CreateWorkoutScreen) ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 80, // Extra space for delete button
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      color: colors.destructive,
      textAlign: "center",
      fontSize: 16,
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
    exercisesContainer: {
      marginTop: 10,
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
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
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
      width: 30,
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 10,
      textAlign: "center",
    },
    setInputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      marginHorizontal: 5,
    },
    setInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 8,
      textAlign: "center",
    },
    setInputLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    removeSetButton: {
      paddingLeft: 10,
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
    // Delete Button Styles
    deleteButtonContainer: {
      marginTop: 30,
    },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.destructive, // Destructive background
      paddingVertical: 12,
      borderRadius: 8,
    },
    deleteButtonText: {
      color: colors.buttonText, // Usually white/light text on red
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },
    restInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
    },
    restInputLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginRight: 8,
    },
    restTextInput: {
      backgroundColor: colors.background,
      color: colors.text,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      fontSize: 14,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 50,
      textAlign: "center",
    },
    restInputUnit: {
      fontSize: 13,
      color: colors.textSecondary,
      marginLeft: 5,
    },
  });

  // --- Render Loading or Error ---
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
          Loading Template...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Icon
          name="alert-circle-outline"
          size={40}
          color={colors.destructive}
        />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // --- Render Edit Form ---
  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Workout Details</Text>
        <Card style={{ padding: 15 }}>
          {/* Workout Name */}
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.inputLabel}>Workout Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Upper Body Strength"
              placeholderTextColor={colors.textSecondary}
              value={workoutName}
              onChangeText={setWorkoutName}
            />
          </View>

          <View style={styles.row}>
            {/* Workout Type */}
            <View style={[styles.inputGroup, { marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Workout Type</Text>
              <WorkoutTypePicker
                options={workoutTypeOptions}
                selectedValue={workoutType}
                onValueChange={setWorkoutType}
                placeholder="Select type"
              />
            </View>

            {/* Duration */}
            <View style={[styles.inputGroup, { marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Est. Duration (min)</Text>
              <View style={styles.durationInputContainer}>
                <TextInput
                  style={styles.durationInput}
                  placeholder="e.g., 60"
                  placeholderTextColor={colors.textSecondary}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
                <Icon
                  name="clock-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Exercises *</Text>

        {/* Exercise List (same rendering logic as CreateWorkoutScreen) */}
        <View style={styles.exercisesContainer}>
          {addedExercises.map(ex => (
            <View key={ex.id} style={styles.exerciseCard}>
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseDetail}>
                    {ex.type} • {ex.category}
                  </Text>
                </View>
                <View style={styles.restInputContainer}>
                  <Text style={styles.restInputLabel}>Default Rest:</Text>
                  <TextInput
                    style={styles.restTextInput}
                    value={(ex.defaultRestSeconds ?? "").toString()}
                    onChangeText={text => handleRestChange(ex.id, text)}
                    placeholder={`${DEFAULT_REST_DURATION}`}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <Text style={styles.restInputUnit}>sec</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeExerciseButton}
                  onPress={() => removeExercise(ex.id)}
                >
                  <Icon
                    name="close-circle-outline"
                    size={22}
                    color={colors.destructive}
                  />
                </TouchableOpacity>
              </View>

              {/* Sets Container */}
              <View style={styles.setsContainer}>
                {ex.sets.map((set, setIndex) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNumber}>{setIndex + 1}</Text>
                    {/* Reps Input */}
                    <View style={styles.setInputContainer}>
                      <TextInput
                        style={styles.setInput}
                        value={set.reps.toString()}
                        onChangeText={text =>
                          handleRepChange(ex.id, set.id, text)
                        }
                        keyboardType="number-pad"
                        selectTextOnFocus
                      />
                      <Text style={styles.setInputLabel}>reps</Text>
                    </View>
                    {/* Weight Input */}
                    <View style={styles.setInputContainer}>
                      <TextInput
                        style={styles.setInput}
                        value={set.weight.toString()}
                        onChangeText={text =>
                          handleWeightChange(ex.id, set.id, text)
                        }
                        keyboardType="numeric"
                        selectTextOnFocus
                      />
                      <Text style={styles.setInputLabel}>kg</Text>
                    </View>
                    {/* Remove Set Button */}
                    <TouchableOpacity
                      style={styles.removeSetButton}
                      onPress={() => handleRemoveSet(ex.id, set.id)}
                      disabled={ex.sets.length <= 1}
                    >
                      <Icon
                        name="minus-circle-outline"
                        size={20}
                        color={
                          ex.sets.length <= 1
                            ? colors.border
                            : colors.destructive
                        }
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Add Set Button */}
              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => handleAddSet(ex.id)}
              >
                <Icon
                  name="plus-circle-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.addSetButtonText}>Add Set</Text>
              </TouchableOpacity>
            </View>
          ))}
          {/* Button to add more exercises */}
          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Icon name="plus" size={20} color={colors.primary} />
            <Text style={styles.addExerciseButtonText}>Add More Exercises</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Button Area */}
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteTemplate}
          >
            <Icon
              name="trash-can-outline"
              size={20}
              color={colors.buttonText}
            />
            <Text style={styles.deleteButtonText}>Delete Template</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAddExercises={handleAddExercisesFromModal}
        allExercises={DUMMY_EXERCISES}
      />
    </>
  );
};

export default EditWorkoutScreen;
