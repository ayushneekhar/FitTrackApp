import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import AnimatedTimer from "@/components/AnimatedTimer"; // Keep existing
import { useTheme } from "@/theme/ThemeContext";

interface Props {
  elapsedSeconds: number;
  isRunning: boolean;
  isResting: boolean; // To disable controls
  onToggle: () => void;
  onReset: () => void;
}

const WorkoutTimerDisplay: React.FC<Props> = ({
  elapsedSeconds,
  isRunning,
  isResting,
  onToggle,
  onReset,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors, isRunning, isResting);

  return (
    <View style={styles.timerSection}>
      <Text style={styles.timerLabel}>Workout Time</Text>
      <View style={styles.timerDisplayContainer}>
        <AnimatedTimer elapsedSeconds={elapsedSeconds} />
      </View>
      <View style={styles.timerControls}>
        <TouchableOpacity
          style={[
            styles.timerButton,
            isRunning ? styles.timerButtonSecondary : styles.timerButtonPrimary,
            isResting && styles.disabledButton, // Style for disabled state
          ]}
          onPress={onToggle}
          disabled={isResting}
        >
          <Icon
            name={isRunning ? "pause" : "play"}
            size={18}
            color={
              isResting
                ? colors.border
                : isRunning
                  ? colors.text
                  : colors.buttonText
            }
          />
          <Text
            style={[
              styles.timerButtonText,
              isResting
                ? styles.disabledButtonText
                : isRunning
                  ? styles.timerButtonTextSecondary
                  : styles.timerButtonTextPrimary,
            ]}
          >
            {isRunning ? "Pause" : "Start"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timerButton,
            styles.timerButtonSecondary,
            isResting && styles.disabledButton, // Style for disabled state
          ]}
          onPress={onReset}
          disabled={isResting}
        >
          <Icon
            name="backup-restore"
            size={18}
            color={isResting ? colors.border : colors.text}
          />
          <Text
            style={[
              styles.timerButtonText,
              styles.timerButtonTextSecondary,
              isResting ? styles.disabledButtonText : {},
            ]}
          >
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any, isRunning: boolean, isResting: boolean) =>
  StyleSheet.create({
    timerSection: {
      padding: 16,
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    timerLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    timerDisplayContainer: {
      flexDirection: "row",
      minHeight: 55,
    },
    timerControls: {
      flexDirection: "row",
      marginTop: 10,
    },
    timerButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      marginHorizontal: 5,
    },
    timerButtonPrimary: {
      backgroundColor: colors.primary,
    },
    timerButtonSecondary: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timerButtonText: {
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 5,
    },
    timerButtonTextPrimary: {
      color: colors.buttonText,
    },
    timerButtonTextSecondary: {
      color: colors.text,
    },
    disabledButton: {
      // Add specific styles for disabled state if needed
      opacity: 0.5,
      // backgroundColor: colors.background, // Example
    },
    disabledButtonText: {
      // Add specific styles for disabled text if needed
      color: colors.border, // Example
    },
  });

export default React.memo(WorkoutTimerDisplay); // Memoize if props don't change often
