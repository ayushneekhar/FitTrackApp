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
import WeightUnitInput from "@/components/WeightUnitInput";
import { ActiveWorkoutSet } from "@/hooks/useWorkoutState";
import { WeightUnit } from "@/services/storage";
import { ColorPalette } from "@/theme/colors";

// Define props using a discriminated union for clear mode-specific props
interface BaseSetRowProps {
  set: ActiveWorkoutSet;
  setIndex: number; // Index of the set within the exercise
}

interface EditModeSetRowProps extends BaseSetRowProps {
  mode: "edit";
  onRepsChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onUnitChange: (newUnit: WeightUnit) => void;
  onRemove: () => void;
  canRemove: boolean;
  // Props not used in edit mode, explicitly set to never
  exerciseIndex?: never;
  isResting?: never;
  onUpdateField?: never;
  onToggleComplete?: never;
}

interface ViewModeSetRowProps extends BaseSetRowProps {
  mode: "view";
  exerciseIndex: number; // Index of the exercise in the workout
  isResting: boolean;
  onUpdateField: (
    exIndex: number,
    sIndex: number,
    field: keyof ActiveWorkoutSet,
    value: any
  ) => void;
  onToggleComplete: (setIndex: number) => void;
  // Props not used in view mode, explicitly set to never
  onRepsChange?: never;
  onWeightChange?: never;
  onUnitChange?: never;
  onRemove?: never;
  canRemove?: never;
}

type SetRowProps = EditModeSetRowProps | ViewModeSetRowProps;

const SetRow: React.FC<SetRowProps> = props => {
  const { mode, set, setIndex } = props;
  const { colors } = useTheme();

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  // Determine if inputs should be disabled based on mode and state
  const viewModeIsDisabled =
    isViewMode && (set.completed || (props as ViewModeSetRowProps).isResting);
  const inputEditable = isEditMode || (isViewMode && !viewModeIsDisabled);

  // Pass relevant disabled state for styling
  const styles = createStyles(
    colors,
    set.completed,
    isViewMode && (props as ViewModeSetRowProps).isResting
  );

  const handleRepsChange = (value: string) => {
    if (isEditMode) {
      (props as EditModeSetRowProps).onRepsChange(value);
    } else if (isViewMode) {
      (props as ViewModeSetRowProps).onUpdateField(
        (props as ViewModeSetRowProps).exerciseIndex,
        setIndex,
        "reps",
        value
      );
    }
  };

  const handleWeightChange = (value: string) => {
    if (isEditMode) {
      (props as EditModeSetRowProps).onWeightChange(value);
    } else if (isViewMode) {
      (props as ViewModeSetRowProps).onUpdateField(
        (props as ViewModeSetRowProps).exerciseIndex,
        setIndex,
        "weight",
        value
      );
    }
  };

  const handleUnitChange = (newUnit: WeightUnit) => {
    if (isEditMode) {
      (props as EditModeSetRowProps).onUnitChange(newUnit);
    } else if (isViewMode) {
      (props as ViewModeSetRowProps).onUpdateField(
        (props as ViewModeSetRowProps).exerciseIndex,
        setIndex,
        "unit",
        newUnit
      );
    }
  };

  const incrementReps = () => {
    handleRepsChange((Number(set.reps || 0) + 1).toString());
  };

  const decrementReps = () => {
    handleRepsChange(Math.max(0, Number(set.reps || 0) - 1).toString());
  };

  return (
    <View
      style={[
        styles.setRow,
        isViewMode && set.completed && styles.setRowCompleted,
      ]}
    >
      <Text style={styles.setNumberText}>{setIndex + 1}</Text>

      {/* Reps Input */}
      <View style={styles.repsInputContainer}>
        <TextInput
          style={styles.setInput}
          value={set.reps?.toString() ?? "0"}
          onChangeText={handleRepsChange}
          keyboardType="number-pad"
          selectTextOnFocus
          editable={inputEditable}
        />
        <TouchableOpacity
          onPress={incrementReps}
          style={styles.decreaseReps}
          disabled={!inputEditable}
        >
          <Icon
            name="chevron-up"
            size={20}
            color={!inputEditable ? colors.border : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={decrementReps}
          style={styles.increaseReps}
          disabled={!inputEditable}
        >
          <Icon
            name="chevron-down"
            size={20}
            color={!inputEditable ? colors.border : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Weight Input & Unit Toggle */}
      <WeightUnitInput
        weightValue={set.weight?.toString() ?? "0"}
        unitValue={set.unit}
        onWeightChange={handleWeightChange}
        onUnitChange={handleUnitChange}
        editable={inputEditable}
      />

      {/* Done Button (View Mode Only) */}
      {isViewMode && (
        <TouchableOpacity
          style={[
            styles.setDoneButton,
            set.completed && styles.setDoneButtonCompleted,
            (props as ViewModeSetRowProps).isResting && styles.disabledButton,
          ]}
          onPress={() =>
            (props as ViewModeSetRowProps).onToggleComplete(setIndex)
          }
          disabled={(props as ViewModeSetRowProps).isResting}
        >
          <Icon
            name={set.completed ? "check" : "checkbox-blank-outline"}
            size={20}
            color={
              (props as ViewModeSetRowProps).isResting
                ? colors.border
                : set.completed
                  ? colors.buttonText
                  : colors.textSecondary
            }
          />
        </TouchableOpacity>
      )}

      {/* Remove Set Button (Edit Mode Only) */}
      {isEditMode && (
        <TouchableOpacity
          style={styles.removeSetButton}
          onPress={(props as EditModeSetRowProps).onRemove}
          disabled={!(props as EditModeSetRowProps).canRemove}
        >
          <Icon
            name="minus-circle-outline"
            size={20}
            color={
              (props as EditModeSetRowProps).canRemove
                ? colors.destructive
                : colors.border
            }
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (
  colors: ColorPalette,
  isCompleted: boolean,
  isRestingInViewMode: boolean
) =>
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
      // This style only makes sense in view mode
      opacity: isCompleted ? 0.6 : 1,
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
      // Applied to "Done" button when resting in view mode
      opacity: isRestingInViewMode ? 0.5 : 1,
    },
    removeSetButton: {
      paddingLeft: 10,
      paddingVertical: 5,
    },
  });

export default React.memo(SetRow);
