import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeContext";

const REST_ADJUST_INCREMENT = 15;

interface Props {
  isVisible: boolean; // Controls overall visibility with animation
  isResting: boolean; // Controls which view (prompt vs countdown)
  displaySeconds: number;
  overtickSeconds: number;
  targetDuration: number; // For display when over ticking
  nextDuration: number; // For prompt display
  formattedDisplayTime: string; // Pre-formatted from hook
  formattedNextRestDuration: string; // Pre-formatted from hook
  onStartRest: () => void;
  onStopRest: () => void; // Renamed from handleStartNextSet
  onAdjustDuration: (increment: number) => void;
}

const RestTimerUI: React.FC<Props> = ({
  isVisible,
  isResting,
  displaySeconds,
  overtickSeconds,
  targetDuration,
  nextDuration,
  formattedDisplayTime,
  formattedNextRestDuration,
  onStartRest,
  onStopRest,
  onAdjustDuration,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors, isResting, overtickSeconds);

  if (!isVisible) {
    return null; // Don't render anything if not visible
  }

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutUp}
      style={[
        styles.restTimerContainer,
        isResting && styles.restTimerActiveContainer,
      ]}
    >
      {isResting ? (
        // Timer Running View
        <>
          <View style={styles.restTimerTextContainer}>
            <Text
              style={[
                styles.restTimerText,
                overtickSeconds > 0 && styles.restTimerTextOvertick,
              ]}
            >
              {formattedDisplayTime}
            </Text>
            {overtickSeconds > 0 && (
              <Text style={styles.restTimerOvertickValue}>
                +{overtickSeconds}s
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.restActionButton, styles.startNextSetButton]}
            onPress={onStopRest} // Use new handler name
          >
            <Icon name="play" size={18} color={colors.text} />
            <Text
              style={[
                styles.restActionButtonText,
                styles.startNextSetButtonText,
              ]}
            >
              Start Next Set
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        // Timer Ready View (Prompt)
        <View style={styles.restControlsContainer}>
          <TouchableOpacity
            style={styles.restAdjustButton}
            onPress={() => onAdjustDuration(-REST_ADJUST_INCREMENT)}
          >
            <Icon name="minus" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.restActionButton, styles.startRestButton]}
            onPress={onStartRest}
          >
            <Icon name="timer-outline" size={18} color={colors.buttonText} />
            <Text
              style={[styles.restActionButtonText, styles.startRestButtonText]}
            >
              Start Rest
            </Text>
          </TouchableOpacity>
          {/* Display formatted duration */}
          <Text style={styles.nextRestDurationText}>
            ({formattedNextRestDuration})
          </Text>
          <TouchableOpacity
            style={styles.restAdjustButton}
            onPress={() => onAdjustDuration(REST_ADJUST_INCREMENT)}
          >
            <Icon name="plus" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

// Styles (similar to original, adapted)
const createStyles = (
  colors: any,
  isResting: boolean,
  overtickSeconds: number
) =>
  StyleSheet.create({
    restTimerContainer: {
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 5,
      backgroundColor: colors.progressBarBackground,
      borderRadius: 6,
      alignItems: "center",
    },
    restTimerActiveContainer: {
      paddingBottom: 15,
    },
    restTimerTextContainer: {
      flexDirection: "row",
      alignItems: "baseline",
      marginBottom: 10,
    },
    restTimerText: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.primary,
      fontVariant: ["tabular-nums"],
    },
    restTimerTextOvertick: {
      color: colors.destructive,
    },
    restTimerOvertickValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.destructive,
      marginLeft: 5,
      fontVariant: ["tabular-nums"],
    },
    restControlsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    restAdjustButton: {
      padding: 8,
      marginHorizontal: 15,
      borderRadius: 20,
      backgroundColor: colors.card,
    },
    restActionButton: {
      paddingVertical: 10,
      paddingHorizontal: 25,
      borderRadius: 6,
      marginHorizontal: 5,
      flexDirection: "row",
      alignItems: "center",
    },
    startRestButton: {
      backgroundColor: colors.primary,
    },
    startNextSetButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    restActionButtonText: {
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 5,
    },
    startRestButtonText: {
      color: colors.buttonText,
    },
    startNextSetButtonText: {
      color: colors.text,
    },
    nextRestDurationText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
      minWidth: 60,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
  });

export default React.memo(RestTimerUI);
