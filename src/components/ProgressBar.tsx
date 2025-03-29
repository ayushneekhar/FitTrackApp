import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

interface ProgressBarProps {
  progress?: number; // Value between 0 and 1
  style?: StyleProp<ViewStyle>;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress = 0, style }) => {
  const { colors } = useTheme();
  const clampedProgress = Math.max(0, Math.min(1, progress));

  const themedStyles = StyleSheet.create({
    background: {
      height: 8,
      backgroundColor: colors.progressBarBackground,
      borderRadius: 4,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      backgroundColor: colors.progressBarFill,
      borderRadius: 4,
    },
  });

  return (
    <View style={[themedStyles.background, style]}>
      <View
        style={[themedStyles.fill, { width: `${clampedProgress * 100}%` }]}
      />
    </View>
  );
};

export default ProgressBar;
