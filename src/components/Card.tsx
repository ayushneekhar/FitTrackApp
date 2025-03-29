// src/components/Card.tsx
import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "@/theme/ThemeContext"; // Import useTheme

// Define props interface
interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>; // Allow passing custom styles
}

const Card: React.FC<CardProps> = ({ children, style }) => {
  const { colors } = useTheme(); // Get colors from theme

  // Create dynamic styles based on theme
  const themedStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.card, // Use theme color
      borderRadius: 8,
      padding: 15,
      marginVertical: 8,
      marginHorizontal: 16,
      shadowColor: "#000", // Shadow color might remain black or adapt
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3, // for Android
    },
  });

  return <View style={[themedStyles.card, style]}>{children}</View>;
};

export default Card;
