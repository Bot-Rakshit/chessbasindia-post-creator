export type GradientDirection = "bottom" | "top" | "left" | "right";

export interface TextGradient {
  enabled: boolean;
  color1: string;
  color2: string;
  direction: GradientDirection;
}

export interface TextConfig {
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fillGradient?: TextGradient;
  backgroundColor: string;
  fontWeight: string;
  fontStyle: "normal" | "italic";
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  textAlign: string;
  width: number;
  opacity: number;
  lineHeight: number;
  charSpacing: number;
  strokeColor: string;
  strokeWidth: number;
  shadow: boolean;
}

export interface LogoConfig {
  enabled: boolean;
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

export interface FadeConfig {
  enabled: boolean;
  direction: GradientDirection;
  opacity: number;
  color: string;
  coverage: number;
}

export interface VignetteConfig {
  enabled: boolean;
  strength: number;
  size: number;
  color: string;
}

export interface BgGradientConfig {
  enabled: boolean;
  color1: string;
  color2: string;
  direction: GradientDirection;
}

export interface Template {
  id: string;
  name: string;
  textConfigs: TextConfig[];
  logoConfig: LogoConfig;
  fadeConfig?: FadeConfig;
  vignetteConfig?: VignetteConfig;
  bgGradientConfig?: BgGradientConfig;
  canvasWidth: number;
  canvasHeight: number;
  bgColor: string;
  imagePadding: number;
}

export const DEFAULT_TEXT: TextConfig = {
  content: "Your text here",
  x: 290, y: 900, fontSize: 36, fontFamily: "Inter",
  fill: "#ffffff", backgroundColor: "", fontWeight: "bold",
  fontStyle: "normal", textTransform: "none",
  textAlign: "center", width: 500, opacity: 1, lineHeight: 1.3,
  charSpacing: 0, strokeColor: "", strokeWidth: 0, shadow: false,
};

export const DEFAULT_LOGO: LogoConfig = { enabled: true, x: 880, y: 880, scale: 0.15, opacity: 1 };

export const DEFAULT_FADE: FadeConfig = {
  enabled: false, direction: "bottom", opacity: 0.7, color: "#000000", coverage: 60,
};

export const DEFAULT_VIGNETTE: VignetteConfig = {
  enabled: false, strength: 0.6, size: 70, color: "#000000",
};

export const DEFAULT_BG_GRADIENT: BgGradientConfig = {
  enabled: false, color1: "#1a1a1a", color2: "#4a4a4a", direction: "bottom",
};

export const FONTS = [
  // Sans-serif (modern/clean)
  "Inter", "Montserrat", "Poppins", "Raleway", "Oswald",
  "Roboto", "Open Sans", "Lato", "Nunito", "Rubik",
  "Work Sans", "DM Sans", "Space Grotesk", "Outfit",
  // Display / Impact
  "Bebas Neue", "Anton", "Teko", "Archivo Black", "Black Ops One",
  "Passion One", "Bungee", "Righteous",
  // Serif (editorial)
  "Playfair Display", "Merriweather", "Lora", "Crimson Text",
  "Source Serif 4", "Noto Serif",
  // Handwritten / Script
  "Caveat", "Dancing Script", "Permanent Marker", "Pacifico",
  // Monospace
  "JetBrains Mono", "Fira Code", "Space Mono",
  // System fallbacks
  "Arial", "Georgia", "Impact", "Verdana", "Times New Roman",
];

export const CANVAS_PRESETS = [
  { label: "IG Post", short: "IG", width: 1080, height: 1080 },
  { label: "IG Story", short: "Story", width: 1080, height: 1920 },
  { label: "Twitter", short: "X", width: 1200, height: 675 },
  { label: "Facebook", short: "FB", width: 1200, height: 630 },
];

/* ── Text Style Presets ── */

export interface TextPreset {
  name: string;
  label: string;
  config: Partial<TextConfig>;
}

export const TEXT_PRESETS: TextPreset[] = [
  {
    name: "Title", label: "Title",
    config: {
      fontSize: 72, fontFamily: "Bebas Neue", fontWeight: "normal",
      fill: "#ffffff", textTransform: "uppercase", charSpacing: 50,
      shadow: true, textAlign: "center", width: 900,
    },
  },
  {
    name: "Subtitle", label: "Subtitle",
    config: {
      fontSize: 32, fontFamily: "Montserrat", fontWeight: "600",
      fill: "#ffffff", textTransform: "none", textAlign: "center", width: 800,
    },
  },
  {
    name: "Score", label: "Score",
    config: {
      fontSize: 96, fontFamily: "JetBrains Mono", fontWeight: "bold",
      fill: "#ffffff", textTransform: "none", textAlign: "center",
      charSpacing: 100, shadow: true, width: 600,
    },
  },
  {
    name: "Caption", label: "Caption",
    config: {
      fontSize: 24, fontFamily: "DM Sans", fontWeight: "normal",
      fill: "#ffffff", textTransform: "none", textAlign: "center",
      lineHeight: 1.6, width: 800, opacity: 0.9,
    },
  },
  {
    name: "Quote", label: "Quote",
    config: {
      fontSize: 42, fontFamily: "Playfair Display", fontWeight: "normal",
      fill: "#ffffff", fontStyle: "italic" as const, textTransform: "none",
      textAlign: "center", lineHeight: 1.5, width: 800,
    },
  },
  {
    name: "Highlight", label: "Highlight",
    config: {
      fontSize: 48, fontFamily: "Anton", fontWeight: "normal",
      fill: "#FFD700", textTransform: "uppercase", textAlign: "center",
      charSpacing: 30, shadow: true, width: 800,
    },
  },
  {
    name: "Breaking", label: "Breaking",
    config: {
      fontSize: 64, fontFamily: "Oswald", fontWeight: "bold",
      fill: "#ff3333", textTransform: "uppercase", textAlign: "center",
      charSpacing: 80, shadow: true, width: 900,
      strokeColor: "#ffffff", strokeWidth: 2,
    },
  },
  {
    name: "Minimal", label: "Minimal",
    config: {
      fontSize: 28, fontFamily: "Space Grotesk", fontWeight: "300",
      fill: "#ffffff", textTransform: "none", textAlign: "left",
      lineHeight: 1.5, width: 600, charSpacing: 20,
    },
  },
];

/* ── Brand Colors ── */

export const BRAND_COLORS = [
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#000000" },
  { name: "CB Red", hex: "#E31E24" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Blue", hex: "#1E88E5" },
  { name: "Green", hex: "#43A047" },
  { name: "Orange", hex: "#FF6D00" },
  { name: "Silver", hex: "#B0BEC5" },
];

/* ── Font Size Quick Presets ── */

export const FONT_SIZE_PRESETS = [
  { label: "S", size: 24 },
  { label: "M", size: 36 },
  { label: "L", size: 56 },
  { label: "XL", size: 80 },
  { label: "2XL", size: 120 },
];
