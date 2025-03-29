// src/navigation/AppNavigator.tsx
import React from "react";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import BottomTabNavigator, { BottomTabParamList } from "./BottomTabNavigator";
import NewWorkoutScreen from "@/screens/NewWorkoutScreen";
import WorkoutDetailsScreen from "@/screens/WorkoutDetailsScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ProfileTopTabNavigator from "./ProfileTopTabNavigator";
import CreateWorkoutScreen from "@/screens/CreateWorkoutScreen"; // <-- Import new screen
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/theme/ThemeContext";
import { NavigatorScreenParams } from "@react-navigation/native";
import ActiveWorkoutScreen from "@/screens/ActiveWorkoutScreen";

// Define ParamList for the Stack Navigator
export type RootStackParamList = {
  Main: NavigatorScreenParams<BottomTabParamList>;
  Profile: undefined;
  NewWorkout: undefined;
  CreateWorkout: undefined; // <-- Add CreateWorkout route
  WorkoutDetails: { workoutId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { colors } = useTheme();

  // Styles remain the same...
  const styles = StyleSheet.create({
    newWorkoutButton: {
      flexDirection: "row",
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: "center",
    },
    newWorkoutButtonText: {
      color: colors.buttonText,
      fontWeight: "bold",
      fontSize: 14,
    },
    headerIcon: {
      color: colors.navText, // Use navText for header icons
    },
    headerIconTouchable: {
      padding: 5,
    },
  });

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.navCard },
        headerTintColor: colors.navText,
        headerTitleStyle: { fontWeight: "bold" },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      {/* Main, Profile, NewWorkout, WorkoutDetails, Settings screens remain the same... */}
      <Stack.Screen
        name="Main"
        component={BottomTabNavigator}
        options={({
          navigation,
        }: NativeStackScreenProps<RootStackParamList, "Main">) => ({
          title: "Dashboard",
          headerLeft: () => (
            <Icon
              name="dumbbell"
              size={26}
              color={colors.primary}
              style={{ marginLeft: 10 }}
            />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => navigation.navigate("NewWorkout")} // Or maybe CreateWorkout directly?
                style={styles.newWorkoutButton}
              >
                <Icon
                  name="plus"
                  size={16}
                  color={colors.buttonText}
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.newWorkoutButtonText}>New Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("Profile")}
                style={[
                  styles.headerIconTouchable,
                  { marginLeft: 15, marginRight: 5 },
                ]}
              >
                <Icon
                  name="account-circle-outline"
                  size={26}
                  style={styles.headerIcon}
                />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileTopTabNavigator}
        options={({
          navigation,
        }: NativeStackScreenProps<RootStackParamList, "Profile">) => ({
          title: "Profile",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Settings")}
              style={[styles.headerIconTouchable, { marginRight: 10 }]}
            >
              <Icon name="cog-outline" size={24} style={styles.headerIcon} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="NewWorkout"
        component={NewWorkoutScreen}
        options={{ title: "Start New Workout" }}
      />

      {/* Add CreateWorkout Screen Configuration */}
      <Stack.Screen
        name="CreateWorkout"
        component={CreateWorkoutScreen}
        options={{
          title: "Create Workout",
          // Header right button is set dynamically within the screen component
        }}
      />

      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{
          title: "Workout Session",
          gestureEnabled: false,
          headerLeft: () => null,
        }}
      />

      <Stack.Screen
        name="WorkoutDetails"
        component={WorkoutDetailsScreen}
        options={{ title: "Workout Details" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
