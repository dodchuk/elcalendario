const EMOJI_COLOR_MAP: Record<string, string> = {
  // Fitness & Sport
  "🏋️": "#ff5500", "🧘": "#00ffaa", "🏊": "#00bbff", "⚽": "#ffffff",
  "🏀": "#ff6600", "🎾": "#ccff00", "🥊": "#ff0000", "🏄": "#00ddff",
  "🏂": "#00ccff", "⛷️": "#aaeeff", "🧗": "#ff8800", "🤸": "#ff44aa",
  "💪": "#ff5500", "🤾": "#ff3300", "🏌️": "#44cc44", "🏇": "#884400",
  "🥋": "#ffffff", "🎳": "#ff2200", "🏓": "#ff0000", "⛸️": "#88ddff",
  // Transport
  "🚴": "#ffcc00", "🏍️": "#ff3300", "🏎️": "#ff0000", "🚕": "#ffdd00",
  "🛵": "#44cc88", "🛴": "#88ff00", "🚌": "#ffaa00", "✈️": "#00aaff",
  "⛵": "#ffffff", "🚶": "#ffcc44", "🏃": "#00ff44", "🛶": "#cc8844",
  "🚃": "#88aacc", "🚁": "#ff4400",
  // Nature & Outdoors
  "⛰️": "#88aacc", "🌲": "#00aa44", "🏖️": "#ffdd44", "🌊": "#00ddff",
  "☀️": "#ffee00", "🌤️": "#ffdd44", "🌅": "#ff6644", "🌄": "#ff8844", "🎣": "#4488cc",
  "🏜️": "#ddaa44", "🌿": "#00ee55", "🦋": "#6688ff",
  // Social & Love
  "❤️‍🔥": "#ff2200", "👫": "#ffaa66", "🥂": "#ffdd00", "🍷": "#880044",
  "🎉": "#ff00cc", "💌": "#ff66aa", "🎊": "#ff44dd", "🎂": "#ff88cc",
  "🎁": "#ff0066",
  // Food & Drink
  "☕": "#cc6600", "🍳": "#ffee00", "🥗": "#44cc00", "🍕": "#ffaa00",
  "🍔": "#cc7700", "🍰": "#ffaacc", "🍺": "#ffcc00", "🧋": "#aa6633",
  "🍽️": "#cccccc", "🥐": "#ddaa44", "🥤": "#ff4466",
  // Work & Study
  "💻": "#00cc66", "📚": "#4444ff", "✏️": "#ffcc00", "💼": "#885500",
  "🎓": "#222222", "🧠": "#ff88aa", "💡": "#ffff00", "⏰": "#ff3300",
  // Health & Wellness
  "😴": "#6666ff", "💊": "#ff4488", "🧹": "#88cc44", "🛁": "#88ddff",
  "💆": "#cc88ff", "🧖": "#ffaa88", "💉": "#00ccaa", "🦷": "#ffffff",
  "🧊": "#00eeff",
  // Creative & Hobbies
  "🎮": "#7700ff", "🎨": "#ff4400", "🎸": "#cc4400", "🎤": "#cccccc",
  "🎧": "#8866cc", "🪴": "#44aa00", "🎹": "#aa44ff", "🧶": "#ff4488",
  "✂️": "#cccccc", "🎭": "#ffaa00", "🍿": "#ffdd44",
  // Home & Daily
  "🏠": "#44aa88", "👕": "#4488ff", "🪥": "#44ddff", "🚿": "#00bbff",
  "🛏️": "#8866cc", "📦": "#aa8844", "🔑": "#ffcc00", "🧽": "#ffee44",
  // Finance & Admin
  "💰": "#00ff66", "🧾": "#eeeecc", "📬": "#4488ff",
  // Mood & Milestones
  "🔥": "#ff4400", "⭐": "#ffdd00", "🏆": "#ffcc00", "💎": "#00ffcc",
  // Pets & Animals
  "🐕": "#cc8844", "🐟": "#00aaff", "🦜": "#00ff44",
  // Spiritual
  "🕯️": "#ffaa44", "🌙": "#aa77ff", "🩸": "#cc0000", "💧": "#44bbff",
  // Education & Growth
  "🌱": "#00ff66",
};

const FALLBACK_COLORS = [
  "#ff0055", "#ffee00", "#00ffcc", "#ff00cc", "#00ccff",
  "#aa00ff", "#00ff66", "#ff4400", "#00eeff", "#ff00aa",
  "#66ff00", "#ff7700", "#00ff88", "#ff0000", "#00aaff",
  "#ffff00", "#ff0066", "#7700ff", "#00ff44", "#ff6600",
];

export function getEmojiGlowColor(emoji: string, index: number): string {
  return EMOJI_COLOR_MAP[emoji] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}
