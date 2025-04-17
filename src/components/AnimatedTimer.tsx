import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { useTheme } from "@/theme/ThemeContext";
import { formatDuration } from "@/utils/formatters";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

const AnimatedTimer = ({ elapsedSeconds }) => {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    timerDisplay: {
      fontSize: 48,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
      fontVariant: ["tabular-nums"],
    },
  });

  return (
    <>
      {formatDuration(elapsedSeconds)
        .split("")
        .map((part, index) => {
          if (part === ":" || isNaN(Number(part))) {
            return (
              <Text key={index} style={styles.timerDisplay}>
                {part}
              </Text>
            );
          }

          return (
            <Animated.View
              entering={FadeInDown}
              exiting={FadeOutUp}
              key={part + index}
            >
              <Text style={styles.timerDisplay}>{part}</Text>
            </Animated.View>
          );
        })}
    </>
  );
};

export default AnimatedTimer;
