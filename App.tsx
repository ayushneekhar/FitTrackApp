// App.tsx
import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "@/navigation/AppNavigator"; // Using path alias
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext"; // Using path alias
import { MMKV } from "react-native-mmkv";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export const mmkv = new MMKV();

// Component to bridge ThemeContext and NavigationContainer theme
const ThemedApp = () => {
  const { isDarkMode, colors } = useTheme();

  // Create React Navigation theme objects based on our custom colors
  const navigationTheme = isDarkMode
    ? {
        ...DarkTheme, // Use defaults and override
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          // notification: colors.notification // Add if needed
        },
      }
    : {
        ...DefaultTheme, // Use defaults and override
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          // notification: colors.notification // Add if needed
        },
      };

  return (
    <SafeAreaProvider>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <BottomSheetModalProvider>
        <NavigationContainer theme={navigationTheme}>
          <AppNavigator />
        </NavigationContainer>
      </BottomSheetModalProvider>
    </SafeAreaProvider>
  );
};

// Main App component wraps everything in the ThemeProvider
const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

export default App;
