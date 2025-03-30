// src/theme/ThemeContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { useColorScheme, Appearance } from "react-native";
import { lightColors, darkColors } from "./colors";
import {
  getUserPreferences,
  saveUserPreferences,
  UserPreferences,
  WeightUnit, // Import type
} from "@/services/storage"; // Import storage functions

// Define the shape of the context value
interface ThemeContextType {
  isDarkMode: boolean;
  colors: typeof lightColors;
  toggleTheme: () => void;
  setScheme: (scheme: "light" | "dark") => void;
  // --- Add preferences state and setter ---
  preferences: UserPreferences;
  setDefaultWeightUnit: (unit: WeightUnit) => void;
}

// Create the context with a default value
export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: lightColors,
  toggleTheme: () => console.warn("ThemeProvider not found"),
  setScheme: () => console.warn("ThemeProvider not found"),
  // --- Default preference values ---
  preferences: { defaultWeightUnit: "kg" },
  setDefaultWeightUnit: () => console.warn("ThemeProvider not found"),
});

// Create the provider component
interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === "dark");
  // --- State for preferences ---
  const [preferences, setPreferences] = useState<UserPreferences>(
    getUserPreferences() // Load initial preferences
  );

  // --- Theme Functions ---
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const setScheme = (scheme: "light" | "dark") => {
    setIsDarkMode(scheme === "dark");
  };

  // --- Preference Functions ---
  const setDefaultWeightUnit = useCallback((unit: WeightUnit) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, defaultWeightUnit: unit };
      saveUserPreferences(newPrefs); // Save to storage
      return newPrefs;
    });
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      // Optional: Auto-update based on system changes
      // if (colorScheme) {
      //   setIsDarkMode(colorScheme === 'dark');
      // }
    });
    return () => listener.remove();
  }, []);

  // Determine colors based on the current mode
  const currentColors = isDarkMode ? darkColors : lightColors;

  // Memoize the context value
  const contextValue = useMemo(
    () => ({
      isDarkMode,
      colors: currentColors,
      toggleTheme,
      setScheme,
      preferences, // <-- Provide preferences
      setDefaultWeightUnit, // <-- Provide setter
    }),
    [isDarkMode, currentColors, preferences, setDefaultWeightUnit] // <-- Add dependencies
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easy consumption
export const useTheme = () => useContext(ThemeContext);
