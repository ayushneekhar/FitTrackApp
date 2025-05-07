import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/theme/ThemeContext";
import { ActiveWorkoutExercise } from "@/hooks/useWorkoutState"; // Import type
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { WorkoutExercise } from "@/services/storage";
import ExerciseCard from "./ExerciseCard";

type ExerciseStatus = "not-started" | "in-progress" | "completed";

interface Props {
  exercises: ActiveWorkoutExercise[];
  currentExerciseIndex: number;
  disabled: boolean; // e.g., disable during rest
  onSelectExercise: (index: number) => void;
  getExerciseStatus: (exercise: ActiveWorkoutExercise) => ExerciseStatus;
  isInitialLoad: boolean;
  onExercisesReorder: (exercises: ActiveWorkoutExercise[]) => void;
  onRemoveExercise: (instanceId: string) => void;
  onAddSet: (instanceId: string) => void;
  onRemoveSet: (instanceId: string, setId: string) => void;
  onRepsChange: (instanceId: string, setId: string, reps: string) => void;
  onWeightChange: (instanceId: string, setId: string, weight: string) => void;
  onUnitChange: (instanceId: string, setId: string, unit: WeightUnit) => void;
  onRestChange: (instanceId: string, rest: string) => void;
  onAddExercise: () => void;
}

const ExerciseList: React.FC<Props> = ({
  exercises,
  currentExerciseIndex,
  disabled,
  onSelectExercise,
  getExerciseStatus,
  isInitialLoad,
  onExercisesReorder,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onRepsChange,
  onWeightChange,
  onUnitChange,
  onRestChange,
  onAddExercise,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const renderExerciseItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ActiveWorkoutExercise>) => {
    const status = getExerciseStatus(item);
    let statusIconName: React.ComponentProps<typeof Icon>["name"] =
      "circle-outline";
    let statusIconColor = colors.textSecondary;
    let itemStyle = [styles.exerciseListItem]; // Start with base style

    if (status === "in-progress") {
      statusIconName = "circle-slice-5";
      statusIconColor = colors.primary;
      itemStyle.push(styles.exerciseListItemInProgress);
    } else if (status === "completed") {
      statusIconName = "check-circle";
      statusIconColor = colors.primary;
      itemStyle.push(styles.exerciseListItemCompleted);
    }

    if (isActive) {
      itemStyle.push(styles.exerciseListItemActive);
    }
    if (disabled) {
      itemStyle.push(styles.disabledItem); // Add disabled style
    }

    return (
      <ScaleDecorator activeScale={1.04}>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={itemStyle}
        >
          <ExerciseCard
            exercise={item}
            onRemove={() => onRemoveExercise(item.instanceId)}
            onAddSet={() => onAddSet(item.instanceId)}
            onRemoveSet={setId => onRemoveSet(item.instanceId, setId)}
            onRepsChange={(setId, reps) =>
              onRepsChange(item.instanceId, setId, reps)
            }
            onWeightChange={(setId, weight) =>
              onWeightChange(item.instanceId, setId, weight)
            }
            onUnitChange={(setId, unit) =>
              onUnitChange(item.instanceId, setId, unit)
            }
            onRestChange={rest => onRestChange(item.instanceId, rest)}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.allExercisesSection}>
      <Text style={styles.allExercisesTitle}>All Exercises</Text>
      {exercises.length === 0 && !isInitialLoad ? (
        <View style={styles.placeholderContainer}>
          <Icon name="dumbbell" size={40} color={colors.textSecondary} />
          <Text style={styles.placeholderText}>No exercises added yet</Text>
          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={onAddExercise}
          >
            <Icon name="plus" size={20} color={colors.primary} />
            <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <DraggableFlatList
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            data={exercises}
            renderItem={renderExerciseItem}
            keyExtractor={item => item.instanceId}
            onDragEnd={({ data }) => onExercisesReorder(data)}
            ListEmptyComponent={
              isInitialLoad ? (
                <ActivityIndicator
                  style={{ marginTop: 50 }}
                  color={colors.primary}
                />
              ) : null
            }
            ListFooterComponent={
              exercises.length > 0 ? (
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={onAddExercise}
                >
                  <Icon name="plus" size={20} color={colors.primary} />
                  <Text style={styles.addExerciseButtonText}>
                    Add More Exercises
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>
      )}
    </View>
  );
};

// Styles (similar to original, adapted)
const createStyles = (colors: any) =>
  StyleSheet.create({
    allExercisesSection: {
      flex: 1,
      paddingTop: 16,
      rowGap: 8,
      paddingBottom: 20,
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
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    exerciseListItemActive: {
      borderColor: colors.primary,
      backgroundColor: colors.progressBarBackground,
    },
    exerciseListItemContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    statusIcon: {
      marginRight: 12,
      width: 20,
      textAlign: "center",
    },
    exerciseListItemTextContainer: {
      flex: 1,
    },
    exerciseListName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    exerciseListSets: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    exerciseListItemInProgress: {}, // Keep for potential specific styles
    exerciseListItemCompleted: {
      opacity: 0.6,
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
    disabledItem: {
      opacity: 0.5, // General disabled style for the list item
    },
  });

export default React.memo(ExerciseList);
