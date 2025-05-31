import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import AnimatedTimer from "@/components/AnimatedTimer"; // Keep existing
import { useTheme } from "@/theme/ThemeContext";

interface Props {
  elapsedSeconds: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}

const WorkoutTimerDisplay: React.FC<Props> = ({
  elapsedSeconds,
  isRunning,
  onToggle,
  onReset,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors, isRunning);

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
          ]}
          onPress={onToggle}
        >
          <Icon
            name={isRunning ? "pause" : "play"}
            size={18}
            color={isRunning ? colors.text : colors.buttonText}
          />
          <Text
            style={[
              styles.timerButtonText,
              isRunning
                ? styles.timerButtonTextSecondary
                : styles.timerButtonTextPrimary,
            ]}
          >
            {isRunning ? "Pause" : "Start"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timerButton, styles.timerButtonSecondary]}
          onPress={onReset}
        >
          <Icon name="backup-restore" size={18} color={colors.text} />
          <Text
            style={[styles.timerButtonText, styles.timerButtonTextSecondary]}
          >
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any, isRunning: boolean) =>
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
  });

export default React.memo(WorkoutTimerDisplay); // Memoize if props don't change often
