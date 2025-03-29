// src/screens/CreateWorkoutScreen.tsx
import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Button, // Using Button for simplicity, replace with custom if needed
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator"; // Adjust if CreateWorkout is in a different stack
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import AddExerciseModal, { Exercise } from "@/components/AddExerciseModal"; // Import the modal and Exercise type
import Card from "@/components/Card"; // Reusing Card component
import { saveWorkoutTemplate } from "@/services/storage";
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

// Define navigation props type
// Assuming CreateWorkoutScreen is pushed onto the RootStack
type Props = NativeStackScreenProps<RootStackParamList, "CreateWorkout">;

const workoutTypeOptions = [
  "Strength",
  "Hypertrophy",
  "Endurance",
  "Cardio",
  "Custom",
];

// Dummy data for all available exercises (replace with actual data source)
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
  const [workoutType, setWorkoutType] = useState<string | null>(null); // Or use a default type
  const [duration, setDuration] = useState("");
  const [addedExercises, setAddedExercises] = useState<Exercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // --- Save Workout Logic ---
  const handleSaveWorkout = () => {
    if (!workoutName.trim() || addedExercises.length === 0) {
      alert("Please enter a workout name and add at least one exercise.");
      return;
    }
    console.log("Saving Workout:", {
      name: workoutName,
      type: workoutType,
      duration: duration,
      exercises: addedExercises,
    });
    saveWorkoutTemplate({
      id: Date.now().toString(),
      name: workoutName,
      type: workoutType,
      durationEstimate: duration ? parseInt(duration, 10) : undefined,
      exercises: addedExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        // Add any other details you need for the template
      })),
    });
    // Add logic to save the workout (e.g., to state management, API, AsyncStorage)
    navigation.goBack(); // Go back after saving
  };

  // --- Add Save Button to Header ---
  useLayoutEffect(() => {
    navigation.setOptions({
      // title: 'Create Workout', // Title is set in AppNavigator usually
      headerRight: () => (
        <TouchableOpacity onPress={handleSaveWorkout} style={styles.saveButton}>
          <Icon
            name="content-save-outline"
            size={18}
            color={colors.buttonText}
            style={{ marginRight: 5 }}
          />
          <Text style={styles.saveButtonText}>Save Workout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSaveWorkout]); // Add dependencies

  // --- Handle Adding Exercises from Modal ---
  const handleAddExercisesFromModal = (selectedExercises: Exercise[]) => {
    // Prevent adding duplicates if needed, or handle updates
    setAddedExercises(prevExercises => [
      ...prevExercises,
      ...selectedExercises,
    ]);
    setIsModalVisible(false);
  };

  // --- Remove Exercise ---
  const removeExercise = (idToRemove: string) => {
    setAddedExercises(prev => prev.filter(ex => ex.id !== idToRemove));
  };

  // --- Styles ---
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
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
    pickerPlaceholder: {
      color: colors.textSecondary,
    },
    // Basic styling for picker trigger
    pickerTrigger: {
      backgroundColor: colors.card,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 48, // Match TextInput height
    },
    durationInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingRight: 10, // Space for icon
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
      marginTop: 10, // Margin for button below placeholder or list
    },
    addExerciseButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "500",
      marginLeft: 8,
    },
    exerciseListItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
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
    removeButton: {
      padding: 5,
    },
    // Header Button Styles
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary, // Use theme primary
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginRight: 10,
    },
    saveButtonText: {
      color: colors.buttonText, // Use theme button text
      fontWeight: "bold",
      fontSize: 14,
    },
  });

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside inputs
      >
        <Text style={styles.sectionTitle}>Workout Details</Text>
        <Card>
          {/* Workout Name */}
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.inputLabel}>Workout Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Upper Body Strength"
              placeholderTextColor={colors.textSecondary}
              value={workoutName}
              onChangeText={setWorkoutName}
            />
          </View>

          <View style={styles.row}>
            {/* Workout Type (Placeholder - Needs a Picker/Dropdown) */}
            <View style={[styles.inputGroup, { marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Workout Type</Text>
              <WorkoutTypePicker // <-- Use the new component
                options={workoutTypeOptions}
                selectedValue={workoutType}
                onValueChange={setWorkoutType} // Directly pass the state setter
                placeholder="Select type"
              />
            </View>

            {/* Duration */}
            <View style={[styles.inputGroup, { marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <View style={styles.durationInputContainer}>
                <TextInput
                  style={styles.durationInput}
                  placeholder="e.g., 60"
                  placeholderTextColor={colors.textSecondary}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
                {/* Optional: Add stepper icons */}
                <Icon
                  name="swap-vertical"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Exercises</Text>

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
            {addedExercises.map(ex => (
              <View key={ex.id} style={styles.exerciseListItem}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseDetail}>
                    {ex.type} • {ex.category}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeExercise(ex.id)}
                >
                  <Icon
                    name="close-circle-outline"
                    size={22}
                    color={colors.destructive}
                  />
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
        allExercises={DUMMY_EXERCISES} // Pass the full list here
      />
    </>
  );
};

export default CreateWorkoutScreen;
