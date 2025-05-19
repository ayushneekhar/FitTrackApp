import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { WorkoutExercise, WeightUnit } from "@/services/storage"; // WorkoutSet is implicitly from WorkoutExercise
import SetRow from "./SetRow";
import { ColorPalette } from "@/theme/colors";
import { ActiveWorkoutSet } from "@/hooks/useWorkoutState"; // Import ActiveWorkoutSet

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onRemove: () => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onRepsChange: (setId: string, reps: string) => void;
  onWeightChange: (setId: string, weight: string) => void;
  onUnitChange: (setId: string, unit: WeightUnit) => void;
  onRestChange: (rest: string) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onRemove,
  onAddSet,
  onRemoveSet,
  onRepsChange,
  onWeightChange,
  onUnitChange,
  onRestChange,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseDetail}>
            {exercise.type} • {exercise.category}
          </Text>
        </View>
        <View style={styles.restInputContainer}>
          <Text style={styles.restInputLabel}>Default Rest:</Text>
          <TextInput
            style={styles.restTextInput}
            value={(exercise.defaultRestSeconds ?? "").toString()}
            onChangeText={onRestChange}
            placeholder="60"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            selectTextOnFocus
          />
          <Text style={styles.restInputUnit}>sec</Text>
        </View>
        <TouchableOpacity
          style={styles.removeExerciseButton}
          onPress={onRemove}
        >
          <Icon
            name="close-circle-outline"
            size={22}
            color={colors.destructive}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.setsContainer}>
        {exercise.sets.map((set, index) => {
          // Adapt WorkoutSet from storage to ActiveWorkoutSet for SetRow
          const activeSetForEdit: ActiveWorkoutSet = {
            ...set, // id, reps, weight, unit
            completed: false, // Not relevant for edit mode display logic in SetRow
            // restTakenSeconds: undefined, // Not relevant for edit mode
          };
          return (
            <SetRow
              mode="edit"
              key={set.id}
              set={activeSetForEdit}
              setIndex={index}
              onRepsChange={reps => onRepsChange(set.id, reps)}
              onWeightChange={weight => onWeightChange(set.id, weight)}
              onUnitChange={unit => onUnitChange(set.id, unit)}
              onRemove={() => onRemoveSet(set.id)}
              canRemove={exercise.sets.length > 1}
            />
          );
        })}
      </View>

      <TouchableOpacity style={styles.addSetButton} onPress={onAddSet}>
        <Icon name="plus-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.addSetButtonText}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ExerciseCard;

const getStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    exerciseCard: {
      flex: 1,
      borderRadius: 8,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      backgroundColor: colors.card,
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
      flex: 1,
      paddingHorizontal: 15,
      paddingTop: 10,
      paddingBottom: 5,
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
  });
