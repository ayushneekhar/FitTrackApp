import React, {
  useState,
  useLayoutEffect,
  useCallback,
  useEffect,
  useRef,
  useMemo,
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
  WeightUnit,
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
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { lightColors } from "@/theme/colors"; // For style function type
import WeightUnitInput from "@/components/WeightUnitInput";

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

type ScreenColors = typeof lightColors; // Or define a specific interface
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
  });

const CreateWorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, preferences } = useTheme(); // Get preferences
  const styles = useMemo(() => getStyles(colors), [colors]); // Memoize styles
  const defaultUnit = preferences.defaultWeightUnit; // Get default unit

  const [workoutName, setWorkoutName] = useState("");
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [duration, setDuration] = useState("");
  const [addedExercises, setAddedExercises] = useState<WorkoutExercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false); // No longer needed for BottomSheet
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const savedRef = useRef(false);
  const addExerciseModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    addExerciseModalRef.current?.present();
  }, []);

  // useEffect for unsaved changes (no change needed)
  useEffect(() => {
    if (!isInitialLoad) {
      setHasUnsavedChanges(true);
    }
  }, [workoutName, workoutType, duration, addedExercises, isInitialLoad]);

  // useEffect for loading draft (no change needed for unit logic here)
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
              // Map draft exercises, ensuring sets have IDs and default unit if missing
              const exercisesWithSetIdsAndUnits = draft.exercises.map(ex => ({
                ...ex,
                sets: ex.sets.map(set => ({
                  ...set,
                  id: set.id || (uuid.v4() as string),
                  weight: (set.weight || 0).toString(),
                  unit: (set as any).unit || defaultUnit, // Add unit from draft or default
                })),
              }));
              setAddedExercises(exercisesWithSetIdsAndUnits);
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
  }, [defaultUnit]); // Add defaultUnit dependency

  // useEffect for saving draft on navigation (no change needed for unit logic here)
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", e => {
      if (!hasUnsavedChanges || savedRef.current || isInitialLoad) return;
      e.preventDefault();
      const currentDraft: WorkoutDraft = {
        templateId: null,
        name: workoutName,
        type: workoutType,
        durationEstimate: duration ? parseInt(duration, 10) : undefined,
        // Map state back to draft structure (omitting unit)
        exercises: addedExercises.map(ex => ({
          instanceId: ex.instanceId,
          id: ex.id,
          name: ex.name,
          sets: ex.sets.map(set => ({
            id: set.id,
            reps: set.reps,
            weight: set.weight,
            // unit is NOT saved in the draft/template structure
          })),
        })),
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

  // --- Create Default Sets (with default unit) ---
  const createDefaultSets = useCallback((): WorkoutSet[] => {
    const sets: WorkoutSet[] = [];
    for (let i = 0; i < defaultSetCount; i++) {
      sets.push({
        id: uuid.v4() as string,
        reps: defaultReps,
        weight: defaultWeight.toString(),
        unit: defaultUnit, // Use default unit from theme context
      });
    }
    return sets;
  }, [defaultUnit]); // Depend on defaultUnit

  // --- Handle Adding Exercises from Modal (uses createDefaultSets) ---
  const handleAddExercisesFromModal = useCallback(
    (selectedExercises: Exercise[]) => {
      const newWorkoutExercises: WorkoutExercise[] = selectedExercises.map(
        ex => ({
          ...ex,
          instanceId: uuid.v4() as string,
          sets: createDefaultSets(), // This now includes the default unit
        })
      );
      setAddedExercises(prevExercises => [
        ...prevExercises,
        ...newWorkoutExercises,
      ]);
      // Modal closing is handled by the component itself now
    },
    [createDefaultSets]
  ); // Depend on createDefaultSets

  // --- Remove Exercise (no change needed) ---
  const removeExercise = (instanceIdToRemove: string) => {
    setAddedExercises(prev =>
      prev.filter(ex => ex.instanceId !== instanceIdToRemove)
    );
  };

  // --- Add Set (with default unit) ---
  const handleAddSet = (instanceId: string) => {
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.instanceId === instanceId) {
          const newSet: WorkoutSet = {
            id: uuid.v4() as string,
            reps: defaultReps,
            weight: defaultWeight,
            unit: defaultUnit, // Add default unit
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      })
    );
  };

  // --- Remove Set (no change needed) ---
  const handleRemoveSet = (instanceId: string, setIdToRemove: string) => {
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
          const updatedSets = ex.sets.filter(set => set.id !== setIdToRemove);
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  // --- Update Reps (no change needed) ---
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
  };

  // --- Update Weight (no change needed) ---
  const handleWeightChange = (
    instanceId: string,
    setId: string,
    newWeight: string
  ) => {
    const cleanedWeight = newWeight.replace(/[^0-9.]/g, ""); // Remove non-numeric/non-dot chars
    const parts = cleanedWeight.split(".");
    const validatedWeight =
      parts.length > 1
        ? `${parts[0]}.${parts.slice(1).join("")}`
        : cleanedWeight; // Ensure only one dot
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.instanceId === instanceId) {
          const updatedSets = ex.sets.map(set => {
            if (set.id === setId) {
              return { ...set, weight: validatedWeight };
            }
            return set;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      })
    );
  };

  // --- NEW: Update Unit ---
  const handleUnitChange = (
    instanceId: string,
    setId: string,
    newUnit: WeightUnit
  ) => {
    setAddedExercises(prevExercises =>
      prevExercises.map(ex => {
        if (ex.instanceId === instanceId) {
          const updatedSets = ex.sets.map(set => {
            if (set.id === setId) {
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

  // --- Save Workout Logic (Omitting unit from saved template) ---
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

    // Map to the structure expected by storage (WorkoutTemplateExercise)
    // This structure currently does NOT include 'unit'
    const exercisesToSave: WorkoutTemplateExercise[] = addedExercises.map(
      ex => ({
        instanceId: ex.instanceId,
        id: ex.id,
        name: ex.name,
        sets: ex.sets.map(set => ({
          id: set.id,
          reps: Number(set.reps) || 0,
          weight: parseFloat(set.weight) || 0,
          // unit: set.unit, // <-- DO NOT SAVE UNIT TO TEMPLATE
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
      "Saving Workout Template (unit omitted):",
      JSON.stringify(templateToSave, null, 2)
    );
    saveWorkoutTemplate(templateToSave);
    savedRef.current = true;
    clearWorkoutDraft(null);
    Alert.alert("Success", "Workout template saved!");
    navigation.goBack();
  }, [workoutName, workoutType, duration, addedExercises, navigation]);

  // --- Render Item for DraggableFlatList (Updated with Unit Toggles) ---
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
            {/* Exercise Header (no change) */}
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
                  <View style={styles.repsInputContainer}>
                    <TextInput
                      style={styles.setInput}
                      value={set.reps.toString()}
                      onChangeText={text =>
                        handleRepChange(ex.instanceId, set.id, text)
                      }
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />
                  </View>
                  {/* Weight Input & Unit Toggle */}
                  <WeightUnitInput
                    weightValue={set.weight}
                    unitValue={set.unit}
                    onWeightChange={text =>
                      handleWeightChange(ex.instanceId, set.id, text)
                    }
                    onUnitChange={unit =>
                      handleUnitChange(ex.instanceId, set.id, unit)
                    }
                    // containerStyle can be used to override default flex if needed
                  />
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

            {/* Add Set Button (no change) */}
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
    [
      styles,
      removeExercise,
      handleRepChange,
      handleWeightChange,
      handleUnitChange,
      handleRemoveSet,
      handleAddSet,
    ] // Add handlers
  );

  // --- Add Save Button to Header (no change needed) ---
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
  }, [navigation, handleSaveWorkout, styles]); // Add styles dependency

  // --- Main Render ---
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
        keyboardShouldPersistTaps="handled" // Keep this
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>Workout Details</Text>
            <Card style={{ marginHorizontal: 0, padding: 15 }}>
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
            {addedExercises.length === 0 && !isInitialLoad ? (
              <View style={styles.placeholderContainer}>
                <Icon name="dumbbell" size={40} color={colors.textSecondary} />
                <Text style={styles.placeholderText}>
                  No exercises added yet
                </Text>
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={handlePresentModalPress}
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
              onPress={handlePresentModalPress}
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
        ref={addExerciseModalRef}
        onClose={() => {}} // onClose is handled internally by dismiss
        onAddExercises={handleAddExercisesFromModal}
        allExercises={DUMMY_EXERCISES}
      />
    </>
  );
};

export default CreateWorkoutScreen;
