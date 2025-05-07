import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

interface Props {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  disabled: boolean; // e.g., disable during rest
}

const ExerciseNavigator: React.FC<Props> = ({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  disabled,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.navSection}>
      <TouchableOpacity
        style={[
          styles.navButton,
          (!canGoPrevious || disabled) && styles.navButtonDisabled,
        ]}
        onPress={onPrevious}
        disabled={!canGoPrevious || disabled}
      >
        <Text style={styles.navButtonText}>Previous</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.navButton,
          (!canGoNext || disabled) && styles.navButtonDisabled,
        ]}
        onPress={onNext}
        disabled={!canGoNext || disabled}
      >
        <Text style={styles.navButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    navSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    navButton: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      backgroundColor: colors.card,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    navButtonDisabled: {
      backgroundColor: colors.background,
      opacity: 0.5,
    },
  });

export default React.memo(ExerciseNavigator);
