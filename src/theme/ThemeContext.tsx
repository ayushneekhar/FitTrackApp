// src/theme/ThemeContext.tsx
import React, { createContext, useState, useContext, useMemo } from "react";
import { useColorScheme, Appearance } from "react-native";
import { lightColors, darkColors } from "./colors";

// Define the shape of the context value
interface ThemeContextType {
  isDarkMode: boolean;
  colors: typeof lightColors; // Use one palette shape as the type
  toggleTheme: () => void;
  setScheme: (scheme: "light" | "dark") => void;
}

// Create the context with a default value (can be minimal)
export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: lightColors,
  toggleTheme: () => console.warn("ThemeProvider not found"),
  setScheme: () => console.warn("ThemeProvider not found"),
});

// Create the provider component
interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemScheme = useColorScheme(); // 'light', 'dark', or null/undefined
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === "dark");

  // Function to toggle theme
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Function to explicitly set theme
  const setScheme = (scheme: "light" | "dark") => {
    setIsDarkMode(scheme === "dark");
  };

  // Listen for system changes (optional but good practice)
  React.useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      // You might want to automatically update based on system changes,
      // or just use the initial value. For explicit control, we might
      // not automatically change it here, but you could:
      // if (colorScheme) {
      //   setIsDarkMode(colorScheme === 'dark');
      // }
    });
    return () => listener.remove();
  }, []);

  // Determine colors based on the current mode
  const currentColors = isDarkMode ? darkColors : lightColors;

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      isDarkMode,
      colors: currentColors,
      toggleTheme,
      setScheme,
    }),
    [isDarkMode, currentColors] // Add currentColors dependency
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easy consumption
export const useTheme = () => useContext(ThemeContext);
