export type StrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

export interface StrengthResult {
  level: StrengthLevel;
  score: number; // 0-100
  label: string;
  color: string;
  suggestions: string[];
}

const COMMON = [
  "password", "123456", "qwerty", "111111", "abc123", "letmein",
  "welcome", "admin", "monkey", "iloveyou", "azerty", "motdepasse",
];

/**
 * Estimate password strength with live, contextual suggestions.
 * Pure function — safe to call on every keystroke.
 */
export function evaluatePassword(pw: string): StrengthResult {
  if (!pw) {
    return { level: "empty", score: 0, label: "", color: "#d1d5db", suggestions: [] };
  }

  const suggestions: string[] = [];
  let score = 0;

  const len = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const words = pw.trim().split(/\s+/).filter(Boolean);
  const isPassphrase = words.length >= 3 && pw.includes(" ");

  // Length scoring
  if (len >= 16) score += 40;
  else if (len >= 12) score += 30;
  else if (len >= 8) score += 18;
  else score += len * 2;

  // Character variety
  if (hasLower) score += 10;
  if (hasUpper) score += 12;
  if (hasDigit) score += 12;
  if (hasSymbol) score += 16;

  // Passphrase bonus (long, memorable, multiple words)
  if (isPassphrase && len >= 16) score += 20;

  // Penalties
  const lower = pw.toLowerCase();
  if (COMMON.some((c) => lower.includes(c))) {
    score -= 35;
    suggestions.push("Avoid common words like \u201cpassword\u201d or \u201c123456\u201d.");
  }
  if (/(.)\1\1/.test(pw)) {
    score -= 10;
    suggestions.push("Avoid repeating the same character 3+ times.");
  }
  if (/^[0-9]+$/.test(pw)) {
    score -= 10;
    suggestions.push("Use more than just numbers.");
  }

  // Contextual improvement tips
  if (len < 12) suggestions.push("Make it at least 12 characters long.");
  if (!hasUpper) suggestions.push("Add an uppercase letter.");
  if (!hasLower) suggestions.push("Add a lowercase letter.");
  if (!hasDigit) suggestions.push("Add a number.");
  if (!hasSymbol) suggestions.push("Add a symbol (e.g. ! ? # $).");
  if (!isPassphrase && len < 16) {
    suggestions.push("Tip: a 4-word phrase with spaces (e.g. \u201cbrave maple river stone\u201d) is strong and easy to remember.");
  }

  score = Math.max(0, Math.min(100, score));

  let level: StrengthLevel;
  let label: string;
  let color: string;
  if (score >= 80) { level = "strong"; label = "Strong"; color = "#16a34a"; }
  else if (score >= 60) { level = "good"; label = "Good"; color = "#65a30d"; }
  else if (score >= 35) { level = "fair"; label = "Fair"; color = "#eab308"; }
  else { level = "weak"; label = "Weak"; color = "#ef4444"; }

  // Keep the 3 most relevant suggestions
  return { level, score, label, color, suggestions: suggestions.slice(0, 3) };
}

/** Generate a strong random passphrase suggestion. */
const WORDS = [
  "brave", "maple", "river", "stone", "amber", "cedar", "quartz", "harbor",
  "violet", "comet", "willow", "ember", "marble", "thistle", "falcon", "lunar",
  "copper", "meadow", "pebble", "saffron", "tundra", "zephyr", "orchid", "basalt",
];
export function generatePassphrase(): string {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${pick()} ${pick()} ${pick()} ${pick()}${num}`;
}
