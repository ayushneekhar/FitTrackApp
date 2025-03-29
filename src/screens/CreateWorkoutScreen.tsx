// src/screens/CreateWorkoutScreen.tsx
import React, { useState, useLayoutEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert, // Use Alert for feedback
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
import { saveWorkoutTemplate, WorkoutSet } from "@/services/storage"; // Import WorkoutSet
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
import uuid from "react-native-uuid"; // Import uuid

// Define the structure for an exercise within this screen's state
interface WorkoutExercise {
  id: string; // Exercise ID from master list
  name: string;
  category: Categories;
  type: string;
  sets: WorkoutSet[]; // Use the imported WorkoutSet type
}

type Props = NativeStackScreenProps<RootStackParamList, "CreateWorkout">;

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

const CreateWorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [workoutName, setWorkoutName] = useState("");
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  // Update state to hold WorkoutExercise[]
  const [addedExercises, setAddedExercises] = useState<WorkoutExercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // --- Default Set Values ---
  const defaultReps = 12;
  const defaultWeight = 0;
  const defaultSetCount = 3;

  // --- Create Default Sets ---
  const createDefaultSets = (): WorkoutSet[] => {
    const sets: WorkoutSet[] = [];
    for (let i = 0; i < defaultSetCount; i++) {
      sets.push({
        id: uuid.v4() as string, // Generate unique ID for the set
        reps: defaultReps,
        weight: defaultWeight,
      });
    }
    return sets;
  };

  // --- Handle Adding Exercises from Modal ---
  const handleAddExercisesFromModal = (selectedExercises: Exercise[]) => {
    const newWorkoutExercises: WorkoutExercise[] = selectedExercises.map(
      ex => ({
        ...ex, // Spread basic exercise info (id, name, category, type)
        sets: createDefaultSets(), // Add default sets
      })
    );

    // Prevent adding duplicates by ID
    setAddedExercises(prevExercises => {
      const existingIds = new Set(prevExercises.map(e => e.id));
      const uniqueNewExercises = newWorkoutExercises.filter(
        ne => !existingIds.has(ne.id)
      );
      return [...prevExercises, ...uniqueNewExercises];
    });
    setIsModalVisible(false);
  };

  // --- Remove Exercise ---
  const removeExercise = (idToRemove: string) => {
    setAddedExercises(prev => prev.filter(ex => ex.id !== idToRemove));
  };

  // --- Add a Set to an Exercise ---
  const handleAddSet = (exerciseId: string) => {
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.id === exerciseId) {
          // Add a new default set
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

  // --- Remove a Set from an Exercise ---
  const handleRemoveSet = (exerciseId: string, setIdToRemove: string) => {
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.id === exerciseId) {
          // Prevent removing the last set
          if (ex.sets.length <= 1) {
            Alert.alert(
              "Cannot Remove",
              "Each exercise must have at least one set."
            );
            return ex;
          }
          // Filter out the set to remove
          const updatedSets = ex.sets.filter(set => set.id !== setIdToRemove);
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  // --- Update Reps for a Set ---
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
              // Update reps, default to 0 if parsing fails or input is empty
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

  // --- Update Weight for a Set ---
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
              // Update weight, default to 0 if parsing fails or input is empty
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

  // --- Save Workout Logic ---
  // Use useCallback to memoize the function for useLayoutEffect dependency
  const handleSaveWorkout = useCallback(() => {
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

    const templateToSave: WorkoutTemplate = {
      id: uuid.v4() as string, // Generate unique ID for the template
      name: workoutName.trim(),
      type: workoutType,
      durationEstimate: duration ? parseInt(duration, 10) : undefined,
      exercises: addedExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets.map(set => ({
          // Ensure data types are correct
          id: set.id,
          reps: Number(set.reps) || 0,
          weight: Number(set.weight) || 0,
        })),
      })),
    };

    console.log(
      "Saving Workout Template:",
      JSON.stringify(templateToSave, null, 2)
    );
    saveWorkoutTemplate(templateToSave);
    Alert.alert("Success", "Workout template saved!");
    navigation.goBack(); // Go back after saving
  }, [workoutName, workoutType, duration, addedExercises, navigation]);

  // --- Add Save Button to Header ---
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
  }, [navigation, handleSaveWorkout, colors]); // Add dependencies

  // --- Styles ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 50, // Ensure space at bottom
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
      marginTop: 15, // Margin for button below placeholder or list
    },
    addExerciseButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "500",
      marginLeft: 8,
    },
    // Exercise Item Styling
    exerciseCard: {
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden", // Clip content
    },
    exerciseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.background, // Slightly different bg for header
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
    // Sets Area Styling
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
      width: 30, // Fixed width for alignment
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 10,
      textAlign: "center",
    },
    setInputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background, // Input background
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      marginHorizontal: 5, // Space between inputs
    },
    setInput: {
      flex: 1, // Take remaining space
      fontSize: 14,
      color: colors.text,
      paddingVertical: 8, // Adjust padding
      textAlign: "center",
    },
    setInputLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 4, // Space between input and label (kg/reps)
    },
    removeSetButton: {
      paddingLeft: 10, // Space before the remove icon
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
    // Header Button Styles
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
  });

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

        {addedExercises.length === 0 ? (
          <View style={styles.placeholderContainer}>
            <Icon name="dumbbell" size={40} color={colors.textSecondary} />
            <Text style={styles.placeholderText}>No exercises added yet</Text>
            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Icon name="plus" size={20} color={colors.primary} />
              <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.exercisesContainer}>
            {addedExercises.map((ex, exIndex) => (
              <View key={ex.id} style={styles.exerciseCard}>
                {/* Exercise Header */}
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {ex.type} • {ex.category}
                    </Text>
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
                          keyboardType="number-pad" // Use number-pad for easier input
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
                          keyboardType="numeric" // Allows decimals
                          selectTextOnFocus
                        />
                        <Text style={styles.setInputLabel}>kg</Text>
                      </View>
                      {/* Remove Set Button */}
                      <TouchableOpacity
                        style={styles.removeSetButton}
                        onPress={() => handleRemoveSet(ex.id, set.id)}
                        disabled={ex.sets.length <= 1} // Disable if only one set
                      >
                        <Icon
                          name="minus-circle-outline"
                          size={20}
                          color={
                            ex.sets.length <= 1
                              ? colors.border // Dimmed color when disabled
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
            {/* Button to add more exercises below the list */}
            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Icon name="plus" size={20} color={colors.primary} />
              <Text style={styles.addExerciseButtonText}>
                Add More Exercises
              </Text>
            </TouchableOpacity>
          </View>
        )}
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

export default CreateWorkoutScreen;
