// src/navigation/BottomTabNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Platform, Pressable } from "react-native"; // Removed TouchableOpacity for now
import DashboardTopTabNavigator from "./DashboardTopTabNavigator";
import HistoryScreen from "@/screens/HistoryScreen";
// import AddWorkoutScreen from "@/screens/AddWorkoutScreen"; // We might not need this screen component anymore
import ProfileTopTabNavigator from "./ProfileTopTabNavigator";
import DashboardAnalyticsScreen from "@/screens/Dashboard/DashboardAnalyticsScreen";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/theme/ThemeContext";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs/lib/typescript/src/types"; // Import type

export type BottomTabParamList = {
  DashboardTab: undefined;
  HistoryTab: undefined;
  // AddWorkoutTab: undefined; // Keep for navigation target, but component might be dummy
  // --- OR --- Define a placeholder screen if needed, but navigation is handled by listener
  AddWorkoutPlaceholder: undefined;
  AnalyticsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Dummy component if AddWorkoutScreen is no longer needed
const DummyScreen = () => null;

const BottomTabNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        animation: "shift",
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 80 : 60,
          paddingBottom: Platform.OS === "ios" ? 20 : 5,
          paddingTop: 5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Icon>["name"] = "help";
          size = focused ? 26 : 22;

          // --- Adjust Icon Logic for the Center Button ---
          if (route.name === "AddWorkoutPlaceholder") {
            iconName = "plus";
            // Style the icon itself within tabBarButton options below
          } else if (route.name === "DashboardTab") {
            iconName = focused ? "view-dashboard" : "view-dashboard-outline";
          } else if (route.name === "HistoryTab") {
            iconName = "history";
          } else if (route.name === "AnalyticsTab") {
            iconName = "chart-line";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "account-circle" : "account-circle-outline";
          }

          // Don't render the icon here for the center button, it's handled in tabBarButton
          if (route.name === "AddWorkoutPlaceholder") {
            return null;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarLabel: () => null,
      })}
    >
      {/* Define Screens */}
      <Tab.Screen name="DashboardTab" component={DashboardTopTabNavigator} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />
      <Tab.Screen
        name="AddWorkoutPlaceholder" // Use a placeholder name
        component={DummyScreen} // Use a dummy component that renders nothing
        options={{
          // --- Style the Button Itself ---
          tabBarButton: (props: BottomTabBarButtonProps) => (
            <Pressable
              {...props} // Pass down props like onPress, accessibilityRole etc.
              style={[
                styles.customButtonContainer,
                { shadowColor: colors.primary },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.customButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                {/* Render the icon inside the custom button */}
                <Icon name="plus" size={30} color={colors.buttonText} />
              </View>
            </Pressable>
          ),
        }}
        // --- Add Listener to Handle Navigation ---
        listeners={({ navigation }) => ({
          tabPress: e => {
            // Prevent default action (which would navigate to DummyScreen)
            e.preventDefault();
            // Navigate to the actual screen you want
            navigation.navigate("NewWorkout"); // Or 'CreateWorkout' if preferred
          },
        })}
      />
      <Tab.Screen name="AnalyticsTab" component={DashboardAnalyticsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileTopTabNavigator} />
    </Tab.Navigator>
  );
};

// --- Keep Styles for the Custom Button ---
const styles = StyleSheet.create({
  customButtonContainer: {
    // Position it to overlap the tab bar
    position: "absolute",
    bottom: 15, // Adjust as needed based on tab bar height
    left: "50%",
    transform: [{ translateX: -30 }], // Center the 60-width button
    zIndex: 1, // Ensure it's above the tab bar visually
    // Shadow properties
    // shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
    borderRadius: 30,
  },
  customButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default BottomTabNavigator;
