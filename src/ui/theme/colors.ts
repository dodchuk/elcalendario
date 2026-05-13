export const theme = {
  // Backgrounds — dark grays with depth
  bg: "#1c1c1e",
  bgElevated: "#2c2c2e",
  // Foreground
  fg: "#f5f5f7",
  fgMuted: "#98989d",
  fgSubtle: "#636366",
  // Surfaces — translucent layers
  surface: "rgba(44,44,46,0.72)",
  surfaceHover: "rgba(58,58,60,0.65)",
  surfaceInset: "rgba(28,28,30,0.8)",
  // Accent — warm amber
  accent: "#fbbf24",
  accentLight: "#fcd34d",
  accentSubtle: "rgba(251,191,36,0.12)",
  // Borders — subtle glass edges
  border: "rgba(255,255,255,0.08)",
  borderMuted: "rgba(255,255,255,0.04)",
  borderLight: "rgba(255,255,255,0.15)",
  // Semantic
  danger: "#ff453a",
  success: "#30d158",
  // Gradients (as arrays for LinearGradient)
  gradientDark: ["#1c1c1e", "#0d0d0f"] as const,
  gradientSurface: ["rgba(58,58,60,0.5)", "rgba(44,44,46,0.3)"] as const,
  gradientAccent: ["#fbbf24", "#f59e0b"] as const,
  // Blur/glass
  blur: "rgba(30,30,32,0.7)",
} as const;
