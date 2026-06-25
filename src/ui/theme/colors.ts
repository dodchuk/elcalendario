export const theme = {
  // Backgrounds — deep black for liquid glass contrast
  bg: "#000000",
  bgElevated: "#1c1c1e",
  // Foreground
  fg: "#f5f5f7",
  fgMuted: "#98989d",
  fgSubtle: "#48484a",
  // Glass surfaces — translucent with frosted depth
  surface: "rgba(255,255,255,0.06)",
  surfaceHover: "rgba(255,255,255,0.10)",
  surfaceInset: "rgba(255,255,255,0.03)",
  surfaceGlass: "rgba(255,255,255,0.08)",
  // Accent — lime yellow green
  accent: "#a3e635",
  accentLight: "#bef264",
  accentSubtle: "rgba(163,230,53,0.12)",
  // Borders — liquid glass edges (subtle specular highlights)
  border: "rgba(255,255,255,0.12)",
  borderMuted: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.20)",
  // Semantic
  danger: "#ff453a",
  success: "#30d158",
  // Gradients (glass-inspired)
  gradientDark: ["#000000", "#0a0a0a"] as const,
  gradientSurface: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"] as const,
  gradientAccent: ["#a3e635", "#84cc16"] as const,
  // Glass
  glass: "rgba(255,255,255,0.05)",
  glassBorder: "rgba(255,255,255,0.15)",
  glassHighlight: "rgba(255,255,255,0.25)",
} as const;
