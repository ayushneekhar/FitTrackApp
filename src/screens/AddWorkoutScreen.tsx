// src/screens/AddWorkoutScreen.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { BottomTabParamList } from "@/navigation/BottomTabNavigator";
import { CompositeScreenProps } from "@react-navigation/native"; // For combining navigators
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";

// Combine props from BottomTab and NativeStack
type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, "AddWorkoutTab">,
  NativeStackScreenProps<RootStackParamList> // Access to stack navigator
>;

// This screen might not render UI, but instead trigger navigation
// when the tab button is pressed.
const AddWorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();

  // Immediately navigate to the "NewWorkout" screen when this tab is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      navigation.navigate("NewWorkout"); // Navigate to the actual screen
    });

    return unsubscribe; // Clean up listener on unmount
  }, [navigation]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    text: {
      color: colors.textSecondary,
      marginTop: 10,
    },
  });

  // Render a loading indicator or nothing while navigating
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

export default AddWorkoutScreen;
