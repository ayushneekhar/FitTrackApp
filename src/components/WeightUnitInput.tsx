// src/components/WeightUnitInput.tsx
import React, { useMemo } from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { WeightUnit } from "@/services/storage";
import UnitToggleButtonGroup from "./UnitToggleButtonGroup";
import { lightColors } from "@/theme/colors"; // For style function type

type ComponentColors = typeof lightColors;

// Styles function
const getStyles = (colors: ComponentColors) =>
  StyleSheet.create({
    weightInputContainer: {
      flex: 1.5, // Default flex, can be overridden by style prop
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      paddingLeft: 8,
      marginHorizontal: 5,
      minHeight: 40,
    },
    weightTextInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
      paddingVertical: 8,
    },
    unitContainer: {
      marginLeft: 5,
      paddingRight: 5,
    },
  });

// Extend TextInputProps to allow passing standard TextInput props
interface WeightUnitInputProps
  extends Omit<TextInputProps, "onChangeText" | "value"> {
  weightValue: string; // Use string for direct input handling
  unitValue: WeightUnit;
  onWeightChange: (value: string) => void;
  onUnitChange: (unit: WeightUnit) => void;
  editable?: boolean;
  containerStyle?: View["props"]["style"];
}

const WeightUnitInput: React.FC<WeightUnitInputProps> = ({
  weightValue,
  unitValue,
  onWeightChange,
  onUnitChange,
  editable = true,
  containerStyle,
  ...textInputProps // Pass remaining props to TextInput
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={[styles.weightInputContainer, containerStyle]}>
      <TextInput
        style={styles.weightTextInput}
        value={weightValue}
        onChangeText={onWeightChange}
        keyboardType="decimal-pad"
        selectTextOnFocus
        editable={editable}
        placeholder="0" // Optional placeholder
        placeholderTextColor={colors.textSecondary}
        {...textInputProps} // Spread other TextInput props
      />
      <View style={styles.unitContainer}>
        <UnitToggleButtonGroup
          selectedUnit={unitValue}
          onUnitChange={onUnitChange}
          disabled={!editable}
        />
      </View>
    </View>
  );
};

export default WeightUnitInput;
