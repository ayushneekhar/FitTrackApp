// src/components/UnitToggleButtonGroup.tsx
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { WeightUnit } from "@/services/storage";
import { lightColors } from "@/theme/colors"; // For style function type

type ComponentColors = typeof lightColors;

// Styles function
const getStyles = (colors: ComponentColors) =>
  StyleSheet.create({
    unitToggleContainer: {
      flexDirection: "row",
    },
    unitToggleButton: {
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 4,
      marginLeft: 3,
      borderWidth: 1,
      borderColor: "transparent", // Default no border unless selected
    },
    unitToggleButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    unitToggleText: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.textSecondary,
    },
    unitToggleTextSelected: {
      color: colors.buttonText,
    },
  });

interface UnitToggleButtonGroupProps {
  selectedUnit: WeightUnit;
  onUnitChange: (unit: WeightUnit) => void;
  disabled?: boolean;
}

const UnitToggleButtonGroup: React.FC<UnitToggleButtonGroupProps> = ({
  selectedUnit,
  onUnitChange,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.unitToggleContainer}>
      <TouchableOpacity
        style={[
          styles.unitToggleButton,
          selectedUnit === "kg" && styles.unitToggleButtonSelected,
        ]}
        onPress={() => !disabled && onUnitChange("kg")}
        disabled={disabled}
      >
        <Text
          style={[
            styles.unitToggleText,
            selectedUnit === "kg" && styles.unitToggleTextSelected,
          ]}
        >
          kg
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.unitToggleButton,
          selectedUnit === "lbs" && styles.unitToggleButtonSelected,
        ]}
        onPress={() => !disabled && onUnitChange("lbs")}
        disabled={disabled}
      >
        <Text
          style={[
            styles.unitToggleText,
            selectedUnit === "lbs" && styles.unitToggleTextSelected,
          ]}
        >
          lbs
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default UnitToggleButtonGroup;
