// src/navigation/BottomTabNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import DashboardTopTabNavigator from "./DashboardTopTabNavigator";
import HistoryScreen from "@/screens/HistoryScreen";
import AddWorkoutScreen from "@/screens/AddWorkoutScreen";
import ProfileTopTabNavigator from "./ProfileTopTabNavigator";
import DashboardAnalyticsScreen from "@/screens/Dashboard/DashboardAnalyticsScreen";
import Icon from "@expo/vector-icons/MaterialCommunityIcons"; // Use Expo's version
import { useTheme } from "@/theme/ThemeContext"; // Import useTheme

// Define ParamList for type safety (adjust screen names if needed)
export type BottomTabParamList = {
  DashboardTab: undefined; // Assuming DashboardTopTabNavigator handles its own params
  HistoryTab: undefined;
  AddWorkoutTab: undefined; // This screen might not actually render content
  AnalyticsTab: undefined;
  ProfileTab: undefined; // Assuming ProfileTopTabNavigator handles its own params
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Custom component for the center Add button
interface CustomTabBarButtonProps {
  children: React.ReactNode;
  onPress?: () => void; // Make onPress optional or handle appropriately
}

const CustomTabBarButton: React.FC<CustomTabBarButtonProps> = ({
  children,
  onPress,
}) => {
  const { colors } = useTheme(); // Get colors from theme

  return (
    <TouchableOpacity
      style={[
        styles.customButtonContainer,
        {
          // Add shadow based on theme if desired
          shadowColor: colors.primary, // Use theme color for shadow
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.customButton,
          {
            backgroundColor: colors.primary, // Use theme color
          },
        ]}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

const BottomTabNavigator = () => {
  const { colors } = useTheme(); // Get colors from theme

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive, // Use theme color
        tabBarInactiveTintColor: colors.tabInactive, // Use theme color
        tabBarStyle: {
          backgroundColor: colors.card, // Use card or background color
          borderTopColor: colors.border, // Use theme border color
          height: Platform.OS === "ios" ? 80 : 60, // Adjust height
          paddingBottom: Platform.OS === "ios" ? 20 : 5,
          paddingTop: 5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Icon>["name"] = "help"; // Default icon
          size = focused ? 26 : 22;

          switch (route.name) {
            case "DashboardTab":
              iconName = focused ? "view-dashboard" : "view-dashboard-outline";
              break;
            case "HistoryTab":
              iconName = "history"; // Same icon for focused/unfocused
              break;
            case "AddWorkoutTab":
              iconName = "plus";
              color = colors.buttonText; // Use button text color from theme
              size = 30;
              break;
            case "AnalyticsTab":
              iconName = focused ? "chart-line" : "chart-line";
              break;
            case "ProfileTab":
              iconName = focused ? "account-circle" : "account-circle-outline";
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarLabel: () => null, // Keep labels hidden
      })}
    >
      {/* Define Screens */}
      <Tab.Screen name="DashboardTab" component={DashboardTopTabNavigator} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />
      <Tab.Screen
        name="AddWorkoutTab"
        component={AddWorkoutScreen} // Still needs a component, even if placeholder
        options={{
          tabBarButton: props => (
            <CustomTabBarButton {...props}>
              {/* Render the icon inside the custom button */}
              <Icon name="plus" size={30} color={colors.buttonText} />
            </CustomTabBarButton>
          ),
        }}
      />
      <Tab.Screen name="AnalyticsTab" component={DashboardAnalyticsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileTopTabNavigator} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  customButtonContainer: {
    top: -20,
    justifyContent: "center",
    alignItems: "center",
    // Shadow properties (consider platform differences)
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5, // for Android
  },
  customButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center", // Center icon inside
    alignItems: "center", // Center icon inside
  },
});

export default BottomTabNavigator;
