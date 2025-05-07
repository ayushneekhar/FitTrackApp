import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/theme/ThemeContext";
import WeightUnitInput from "@/components/WeightUnitInput"; // Assuming this exists
import { ActiveWorkoutSet } from "@/hooks/useWorkoutState"; // Import type
import { WeightUnit } from "@/services/storage";

interface SetRowProps {
  set: ActiveWorkoutSet;
  setIndex: number;
  exerciseIndex: number; // Needed for update callback
  isResting: boolean; // Disable inputs during rest
  onUpdateField: (
    exIndex: number,
    sIndex: number,
    field: keyof ActiveWorkoutSet,
    value: any
  ) => void;
  onToggleComplete: (setIndex: number) => void;
  onRemove: () => void;
  canRemove: boolean;
  mode: "edit" | "view";
}

const SetRow: React.FC<SetRowProps> = ({
  set,
  setIndex,
  exerciseIndex,
  isResting,
  onUpdateField,
  onToggleComplete,
  onRemove,
  canRemove,
  mode,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors, set.completed, isResting);
  const isDisabled = set.completed || isResting;

  const handleRepsChange = (value: string) => {
    onUpdateField(exerciseIndex, setIndex, "reps", value);
  };

  const handleWeightChange = (value: string) => {
    onUpdateField(exerciseIndex, setIndex, "weight", value);
  };

  const handleUnitChange = (newUnit: WeightUnit) => {
    onUpdateField(exerciseIndex, setIndex, "unit", newUnit);
  };

  const incrementReps = () => {
    handleRepsChange((Number(set.reps || 0) + 1).toString());
  };

  const decrementReps = () => {
    handleRepsChange(Math.max(0, Number(set.reps || 0) - 1).toString());
  };

  return (
    <View style={[styles.setRow, set.completed && styles.setRowCompleted]}>
      <Text style={styles.setNumberText}>{setIndex + 1}</Text>

      {/* Reps Input */}
      <View style={styles.repsInputContainer}>
        <TextInput
          style={styles.setInput}
          value={set.reps?.toString() ?? "0"} // Handle potential undefined/null
          onChangeText={handleRepsChange}
          keyboardType="number-pad"
          selectTextOnFocus
          editable={!isDisabled}
        />
        <TouchableOpacity
          onPress={incrementReps}
          style={styles.decreaseReps} // Naming is confusing, this is UP/Increment
          disabled={isDisabled}
        >
          <Icon
            name="chevron-up"
            size={20}
            color={isDisabled ? colors.border : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={decrementReps}
          style={styles.increaseReps} // Naming is confusing, this is DOWN/Decrement
          disabled={isDisabled}
        >
          <Icon
            name="chevron-down"
            size={20}
            color={isDisabled ? colors.border : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Weight Input & Unit Toggle */}
      <WeightUnitInput
        weightValue={set.weight?.toString() ?? "0"} // Handle potential undefined/null
        unitValue={set.unit}
        onWeightChange={handleWeightChange}
        onUnitChange={handleUnitChange}
        editable={!isDisabled}
      />

      {/* Done Button */}
      {mode === "view" && (
        <TouchableOpacity
          style={[
            styles.setDoneButton,
            set.completed && styles.setDoneButtonCompleted,
            isResting && styles.disabledButton, // Add disabled style for rest
          ]}
          onPress={() => onToggleComplete(setIndex)}
          disabled={isResting} // Disable only during rest, not if completed
        >
          <Icon
            name={set.completed ? "check" : "checkbox-blank-outline"}
            size={20}
            color={
              isResting
                ? colors.border
                : set.completed
                  ? colors.buttonText
                  : colors.textSecondary
            }
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.removeSetButton}
        onPress={onRemove}
        disabled={!canRemove}
      >
        <Icon
          name="minus-circle-outline"
          size={20}
          color={canRemove ? colors.destructive : colors.border}
        />
      </TouchableOpacity>
    </View>
  );
};

// Styles (similar to original, adapted)
const createStyles = (colors: any, isCompleted: boolean, isResting: boolean) =>
  StyleSheet.create({
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 5,
    },
    setNumberText: {
      width: 40,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    repsInputContainer: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      marginHorizontal: 5,
      minHeight: 40,
      justifyContent: "center",
      position: "relative",
    },
    setInput: {
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
      paddingVertical: 8,
    },
    setDoneButton: {
      width: 50,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 5,
    },
    setDoneButtonCompleted: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    setRowCompleted: {
      opacity: 0.6,
    },
    decreaseReps: {
      position: "absolute",
      right: 5,
      top: -5,
      zIndex: 2,
      padding: 5,
    },
    increaseReps: {
      position: "absolute",
      right: 5,
      bottom: -5,
      zIndex: 2,
      padding: 5,
    },
    disabledButton: {
      opacity: 0.5,
    },
    removeSetButton: {
      paddingLeft: 10,
      paddingVertical: 5,
    },
    // Add other necessary styles (weight col, etc.) from original if needed
  });

export default React.memo(SetRow);
