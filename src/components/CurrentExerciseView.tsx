import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { Layout, SequencedTransition } from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeContext";
import SetRow from "./SetRow";
import RestTimerUI from "./RestTimerUI";
import {
  ActiveWorkoutExercise,
  ActiveWorkoutSet,
} from "@/hooks/useWorkoutState";
import { ColorPalette } from "@/theme/colors"; // For createStyles

interface Props {
  exercise: ActiveWorkoutExercise;
  exerciseIndex: number;
  isResting: boolean;
  restingSetIndex: number | null;
  isRestPromptVisible: boolean;
  restDisplaySeconds: number;
  restOvertickSeconds: number;
  restTargetDuration: number;
  restNextDuration: number;
  formattedRestDisplayTime: string;
  formattedNextRestDuration: string;
  onStartRest: () => void;
  onStopRest: () => void;
  onAdjustRestDuration: (increment: number) => void;
  onUpdateSetField: (
    exIndex: number,
    sIndex: number,
    field: keyof ActiveWorkoutSet,
    value: any
  ) => void;
  onToggleSetComplete: (setIndex: number) => void;
}

const CurrentExerciseView: React.FC<Props> = ({
  exercise,
  exerciseIndex,
  isResting,
  restingSetIndex,
  isRestPromptVisible,
  restDisplaySeconds,
  restOvertickSeconds,
  restTargetDuration,
  restNextDuration,
  formattedRestDisplayTime,
  formattedNextRestDuration,
  onStartRest,
  onStopRest,
  onAdjustRestDuration,
  onUpdateSetField,
  onToggleSetComplete,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Animated.View
      layout={SequencedTransition.duration(200)}
      style={styles.currentExerciseSection}
    >
      <Text style={styles.currentExerciseTitle}>{exercise.name}</Text>
      <View style={styles.setTableHeader}>
        <Text style={[styles.setHeaderText, styles.setCol]}>Set</Text>
        <Text style={[styles.setHeaderText, styles.repsCol]}>Reps</Text>
        <Text style={[styles.setHeaderText, styles.weightCol]}>Weight</Text>
        <Text style={[styles.setHeaderText, styles.doneCol]}>Done</Text>
      </View>
      {exercise.sets.map((set, index) => (
        <Animated.View
          key={set.id}
          layout={Layout.springify()}
          style={styles.setRowContainer}
        >
          <SetRow
            mode="view"
            set={set} // Already ActiveWorkoutSet
            setIndex={index}
            exerciseIndex={exerciseIndex}
            isResting={isResting}
            onUpdateField={onUpdateSetField}
            onToggleComplete={onToggleSetComplete}
            // No onRemove or canRemove needed for view mode as per SetRow changes
          />
          <RestTimerUI
            isVisible={restingSetIndex === index}
            isResting={isResting && restingSetIndex === index}
            displaySeconds={restDisplaySeconds}
            overtickSeconds={restOvertickSeconds}
            targetDuration={restTargetDuration}
            nextDuration={restNextDuration}
            formattedDisplayTime={formattedRestDisplayTime}
            formattedNextRestDuration={formattedNextRestDuration}
            onStartRest={onStartRest}
            onStopRest={onStopRest}
            onAdjustDuration={onAdjustRestDuration}
          />
        </Animated.View>
      ))}
    </Animated.View>
  );
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    currentExerciseSection: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    currentExerciseTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
    },
    setTableHeader: {
      flexDirection: "row",
      marginBottom: 8,
      paddingHorizontal: 5,
    },
    setHeaderText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "bold",
      textAlign: "center",
    },
    setCol: { width: 40 },
    repsCol: { flex: 1, marginHorizontal: 5 },
    weightCol: { flex: 1.5, marginHorizontal: 5 },
    doneCol: { width: 50 },
    setRowContainer: {
      marginBottom: 10,
    },
  });

export default React.memo(CurrentExerciseView);
