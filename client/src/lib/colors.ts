
// Updated color palette
export const colors = {
  // Primary Colors
  dark: {
    base: '#1C2526',    // Dark Gray/Black - Base color for sidebar only
    darker: '#0D1214',  // Black - Used for sidebar gradient only
  },
  // Secondary/Accent Colors
  orange: {
    base: '#F28C38',    // Bright Orange - Primary accent color
    light: '#F5A461',   // Light Orange - Used for gradients and hover effects
    dimmed: '#F28C38',  // Using same color for backward compatibility
  },
  // Supporting Colors
  text: {
    dark: '#1A1A1A',    // Jet Black - Primary text for right pane
    white: '#FFFFFF',   // White - Primary text on dark backgrounds (sidebar)
    secondary: '#333333', // Dark Gray - Secondary text for better visibility (was #E8ECEF)
  },
  background: {
    white: '#FFFFFF',   // Pure White - Primary background for right-hand pane
    light: '#FCFCFC',   // Very Light Gray - Secondary background for card contrast
  },
  accent: {
    purple: '#4A3C7A',  // Deep Violet - Tech accent for data visualizations
    red: '#D32F2F',     // Crimson Red - Alert/indicator color
  },
  // Status Colors
  green: {
    base: '#4CAF50',    // Success green
    light: '#81C784',   // Light green for backgrounds
  },
  amber: {
    base: '#FFC107',    // Warning amber
    light: '#FFD54F',   // Light amber for backgrounds
  },
  blue: {
    base: '#2196F3',    // Info blue
    light: '#64B5F6',   // Light blue for backgrounds
  }
};

// Helper functions for common color combinations
export const gradients = {
  // Only used for sidebar
  darkBackground: `linear-gradient(to bottom, ${colors.dark.base}, ${colors.dark.darker})`,
  // Used for buttons and interactive elements
  orangeButton: `linear-gradient(to right, ${colors.orange.base}, ${colors.orange.light})`,
  // Light gradient for card backgrounds
  lightCard: `linear-gradient(to bottom, ${colors.background.white}, ${colors.background.light})`,
};

// Rankings color coding based on position
export const rankingColors = {
  top3: colors.orange.base,        // Positions 1-3
  top10: colors.orange.light,      // Positions 4-7
  average: colors.accent.purple,   // Positions 8-10
  below20: colors.text.secondary,  // Positions 11-20
  poor: colors.accent.red,         // Below position 20
};

// For backward compatibility
export const oldColors = {
  primary: colors.orange.base,
  secondary: colors.text.secondary,
  bg: {
    dark: colors.dark.base,
    light: colors.background.white
  },
  text: {
    light: colors.text.white,
    dark: colors.text.dark
  }
};
