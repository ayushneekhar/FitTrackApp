import React, {
  useState,
  useLayoutEffect,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
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
  WorkoutTemplate,
  saveWorkoutDraft,
  getWorkoutDraft,
  clearWorkoutDraft,
  WorkoutDraft,
  WorkoutTemplateExercise,
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
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
// Removed useFocusEffect as it's not needed here

// Interface for state (ensure WorkoutSet is imported or defined)
interface WorkoutExercise {
  instanceId: string;
  id: string;
  name: string;
  category: Categories;
  type: string;
  sets: WorkoutSet[];
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
  const [addedExercises, setAddedExercises] = useState<WorkoutExercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Flag for initial load

  const savedRef = useRef(false);

  useEffect(() => {
    if (!isInitialLoad) {
      setHasUnsavedChanges(true);
    }
  }, [workoutName, workoutType, duration, addedExercises, isInitialLoad]);

  useEffect(() => {
    const draft = getWorkoutDraft(null);
    if (draft) {
      console.log("Found Create New draft:", draft);
      Alert.alert(
        "Resume Draft?",
        "You have an unsaved workout draft. Resume editing?",
        [
          {
            text: "Discard Draft",
            style: "destructive",
            onPress: () => {
              clearWorkoutDraft(null);
              setIsInitialLoad(false);
            },
          },
          {
            text: "Resume",
            onPress: () => {
              setWorkoutName(draft.name);
              setWorkoutType(draft.type);
              setDuration(draft.durationEstimate?.toString() || "");
              const exercisesWithSetIds = draft.exercises.map(ex => ({
                ...ex,
                sets: ex.sets.map(set => ({
                  ...set,
                  id: set.id || (uuid.v4() as string),
                })),
              }));
              setAddedExercises(exercisesWithSetIds);
              setIsInitialLoad(false);
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      setIsInitialLoad(false);
    }
    savedRef.current = false;
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", e => {
      if (!hasUnsavedChanges || savedRef.current || isInitialLoad) {
        return;
      }

      e.preventDefault();

      const currentDraft: WorkoutDraft = {
        templateId: null,
        name: workoutName,
        type: workoutType,
        durationEstimate: duration ? parseInt(duration, 10) : undefined,
        exercises: addedExercises,
        timestamp: Date.now(),
      };
      saveWorkoutDraft(currentDraft);
      console.log("Draft saved on navigating away.");

      navigation.dispatch(e.data.action);
    });

    return unsubscribe;
  }, [
    navigation,
    hasUnsavedChanges,
    isInitialLoad,
    workoutName,
    workoutType,
    duration,
    addedExercises,
  ]);

  const defaultReps = 12;
  const defaultWeight = 0;
  const defaultSetCount = 3;

  // --- Create Default Sets ---
  const createDefaultSets = (): WorkoutSet[] => {
    const sets: WorkoutSet[] = [];
    for (let i = 0; i < defaultSetCount; i++) {
      sets.push({
        id: uuid.v4() as string,
        reps: defaultReps,
        weight: defaultWeight,
        // unit: preferences.defaultWeightUnit // Add default unit from theme context if needed
      });
    }
    return sets;
  };

  // --- Handle Adding Exercises from Modal ---
  const handleAddExercisesFromModal = (selectedExercises: Exercise[]) => {
    const newWorkoutExercises: WorkoutExercise[] = selectedExercises.map(
      ex => ({
        ...ex,
        instanceId: uuid.v4() as string,
        sets: createDefaultSets(),
      })
    );
    setAddedExercises(prevExercises => [
      ...prevExercises,
      ...newWorkoutExercises,
    ]);
    // No need to set hasUnsavedChanges here, the useEffect will catch it
    setIsModalVisible(false);
  };

  // --- Remove Exercise ---
  const removeExercise = (instanceIdToRemove: string) => {
    setAddedExercises(prev =>
      prev.filter(ex => ex.instanceId !== instanceIdToRemove)
    );
    // No need to set hasUnsavedChanges here, the useEffect will catch it
  };

  // --- Add Set ---
  const handleAddSet = (instanceId: string) => {
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.instanceId === instanceId) {
          const newSet: WorkoutSet = {
            id: uuid.v4() as string,
            reps: defaultReps,
            weight: defaultWeight,
            // unit: preferences.defaultWeightUnit // Add default unit if needed
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      })
    );
    // No need to set hasUnsavedChanges here, the useEffect will catch it
  };

  // --- Remove Set ---
  const handleRemoveSet = (instanceId: string, setIdToRemove: string) => {
    let actuallyRemoved = false;
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.instanceId === instanceId) {
          if (ex.sets.length <= 1) {
            Alert.alert(
              "Cannot Remove",
              "Each exercise must have at least one set."
            );
            return ex;
          }
          const originalLength = ex.sets.length;
          const updatedSets = ex.sets.filter(set => set.id !== setIdToRemove);
          if (updatedSets.length < originalLength) {
            actuallyRemoved = true; // Mark that a change occurred
          }
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
    // Only trigger unsaved changes if a set was actually removed
    // if (actuallyRemoved) {
    //   setHasUnsavedChanges(true); // Let useEffect handle this
    // }
  };

  // --- Update Reps ---
  const handleRepChange = (
    instanceId: string,
    setId: string,
    newReps: string
  ) => {
    const reps = parseInt(newReps, 10);
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.instanceId === instanceId) {
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
    // No need to set hasUnsavedChanges here, the useEffect will catch it
  };

  // --- Update Weight ---
  const handleWeightChange = (
    instanceId: string,
    setId: string,
    newWeight: string
  ) => {
    const weight = parseFloat(newWeight);
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.instanceId === instanceId) {
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
    // No need to set hasUnsavedChanges here, the useEffect will catch it
  };

  // --- Save Workout Logic ---
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

    // Ensure WorkoutTemplateExercise matches the expected structure for storage
    const exercisesToSave: WorkoutTemplateExercise[] = addedExercises.map(
      ex => ({
        instanceId: ex.instanceId,
        id: ex.id,
        name: ex.name, // Assuming name is correct in state
        sets: ex.sets.map(set => ({
          id: set.id,
          reps: Number(set.reps) || 0,
          weight: Number(set.weight) || 0,
        })),
      })
    );

    const templateToSave: WorkoutTemplate = {
      id: uuid.v4() as string,
      name: workoutName.trim(),
      type: workoutType,
      durationEstimate: duration ? parseInt(duration, 10) : undefined,
      exercises: exercisesToSave,
    };

    console.log(
      "Saving Workout Template:",
      JSON.stringify(templateToSave, null, 2)
    );
    saveWorkoutTemplate(templateToSave);
    savedRef.current = true; // Mark as saved *before* navigating
    clearWorkoutDraft(null); // Clear the draft for 'Create New'
    Alert.alert("Success", "Workout template saved!");
    navigation.goBack();
  }, [workoutName, workoutType, duration, addedExercises, navigation]);

  // --- Render Item for DraggableFlatList ---
  const renderExerciseItem = useCallback(
    ({ item: ex, drag, isActive }: RenderItemParams<WorkoutExercise>) => {
      return (
        <ScaleDecorator activeScale={1.04}>
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            style={[
              styles.exerciseCard,
              { backgroundColor: isActive ? colors.border : colors.card },
            ]}
          >
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
                onPress={() => removeExercise(ex.instanceId)}
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
                        handleRepChange(ex.instanceId, set.id, text)
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
                        handleWeightChange(ex.instanceId, set.id, text)
                      }
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <Text style={styles.setInputLabel}>kg</Text>
                    {/* Add unit preference later */}
                  </View>
                  {/* Remove Set Button */}
                  <TouchableOpacity
                    style={styles.removeSetButton}
                    onPress={() => handleRemoveSet(ex.instanceId, set.id)}
                    disabled={ex.sets.length <= 1}
                  >
                    <Icon
                      name="minus-circle-outline"
                      size={20}
                      color={
                        ex.sets.length <= 1 ? colors.border : colors.destructive
                      }
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Add Set Button */}
            <TouchableOpacity
              style={styles.addSetButton}
              onPress={() => handleAddSet(ex.instanceId)}
            >
              <Icon
                name="plus-circle-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.addSetButtonText}>Add Set</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    [colors]
  );

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
  }, [navigation, handleSaveWorkout, colors]); // handleSaveWorkout is memoized

  // --- Styles ---
  const styles = StyleSheet.create({
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
    // Removed exercisesContainer as DraggableFlatList handles the list area
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
      // backgroundColor set dynamically in renderItem
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
  });

  return (
    <>
      <DraggableFlatList
        data={addedExercises}
        renderItem={renderExerciseItem}
        keyExtractor={item => item.instanceId}
        onDragEnd={({ data }) => {
          setAddedExercises(data);
        }}
        containerStyle={styles.container}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>Workout Details</Text>
            <Card style={{ marginHorizontal: 0 }}>
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
                <View style={[styles.inputGroup, { marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Workout Type</Text>
                  <WorkoutTypePicker
                    options={workoutTypeOptions}
                    selectedValue={workoutType}
                    onValueChange={setWorkoutType}
                    placeholder="Select type"
                  />
                </View>
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
            {addedExercises.length === 0 && !isInitialLoad ? ( // Show placeholder only if empty AND initial load is done
              <View style={styles.placeholderContainer}>
                <Icon name="dumbbell" size={40} color={colors.textSecondary} />
                <Text style={styles.placeholderText}>
                  No exercises added yet
                </Text>
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={() => setIsModalVisible(true)}
                >
                  <Icon name="plus" size={20} color={colors.primary} />
                  <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={
          addedExercises.length > 0 ? (
            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Icon name="plus" size={20} color={colors.primary} />
              <Text style={styles.addExerciseButtonText}>
                Add More Exercises
              </Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          isInitialLoad ? (
            <ActivityIndicator
              style={{ marginTop: 50 }}
              color={colors.primary}
            />
          ) : null
        }
      />
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
