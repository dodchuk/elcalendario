// Bright acid glow colors mapped to emojis
const EMOJI_COLOR_MAP: Record<string, string> = {
  // Hearts & love
  "❤️": "#ff0055", "💛": "#ffee00", "💚": "#00ff88", "💙": "#00ccff",
  "💜": "#cc00ff", "🖤": "#aabbcc", "🤍": "#ffffff", "🧡": "#ff6600",
  "💗": "#ff00aa", "💕": "#ff44cc", "💖": "#ff0088",
  // Fire & energy
  "🔥": "#ff4400", "⚡": "#ffff00", "💥": "#ff0000", "✨": "#ffee00",
  "🌟": "#ffdd00", "⭐": "#ffcc00", "💫": "#dd66ff",
  // Nature
  "🌸": "#ff66cc", "🌺": "#ff0066", "🌻": "#ffdd00", "🌹": "#ff0033",
  "🍀": "#00ff66", "🌿": "#00ee55", "🌊": "#00ddff", "☀️": "#ffee00",
  "🌙": "#aa77ff", "❄️": "#00eeff", "🌈": "#ff3366",
  // Food
  "🍎": "#ff0033", "🍊": "#ff7700", "🍋": "#ffff00", "🍇": "#aa00ff",
  "🍓": "#ff0044", "🥑": "#66ff00", "🍕": "#ffaa00",
  // Activities
  "🎯": "#ff0000", "🏆": "#ffdd00", "💪": "#ff5500", "🎉": "#ff00cc",
  "🎮": "#7700ff", "🎵": "#ee00ff", "📚": "#4444ff", "✈️": "#00aaff",
  // Emotions
  "😊": "#ffee00", "😂": "#ffee00", "🥰": "#ff44aa", "😎": "#00ccff",
  "🤔": "#ffaa00", "😴": "#6666ff", "😤": "#ff0000", "🥳": "#ff00dd",
  // Misc
  "💎": "#00ffcc", "🎨": "#ff4400", "💡": "#ffff00", "🚀": "#ff0044",
  "🧘": "#00ffaa", "🏃": "#00ff44", "🍺": "#ffcc00", "☕": "#cc6600",
  "📅": "#00aaff", "💻": "#00ddff", "🎬": "#bb00ff",
};

// Fallback acid colors
const FALLBACK_COLORS = [
  "#ff0055", "#ffee00", "#00ffcc", "#ff00cc", "#00ccff",
  "#aa00ff", "#00ff66", "#ff4400", "#00eeff", "#ff00aa",
  "#66ff00", "#ff7700", "#00ff88", "#ff0000", "#00aaff",
  "#ffff00", "#ff0066", "#7700ff", "#00ff44", "#ff6600",
];

export function getEmojiGlowColor(emoji: string, index: number): string {
  return EMOJI_COLOR_MAP[emoji] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}
