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
import EditWorkoutScreen from "@/screens/EditWokoutScreen";
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOutRight,
} from "react-native-reanimated";

// Define ParamList for the Stack Navigator
export type RootStackParamList = {
  Main: NavigatorScreenParams<BottomTabParamList>;
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
      marginLeft: 10,
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
              style={{ marginHorizontal: 10 }}
            />
          ),
          headerRight: props => {
            const isProfilesTab =
              navigation.getState().routes[0].state?.index === 4;

            return (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingRight: 10,
                }}
              >
                <TouchableOpacity
                  onPressIn={() => navigation.navigate("NewWorkout")} // Or maybe CreateWorkout directly?
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
                {isProfilesTab && (
                  <Animated.View entering={FadeInRight} exiting={FadeOutRight}>
                    <TouchableOpacity
                      onPressIn={() => navigation.navigate("Settings")}
                      style={styles.headerIconTouchable}
                    >
                      <Icon
                        name="cog-outline"
                        size={24}
                        style={styles.headerIcon}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            );
          },
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
        name="EditWorkout"
        component={EditWorkoutScreen}
        options={{
          title: "Edit Workout",
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
