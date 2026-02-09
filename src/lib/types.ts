export interface TextConfig {
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  backgroundColor: string;
  fontWeight: string;
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

export type GradientDirection = "bottom" | "top" | "left" | "right";

export interface GradientConfig {
  enabled: boolean;
  direction: GradientDirection;
  opacity: number;
  color: string;
  coverage: number; // 0-100, how much of the canvas the gradient covers
}

export const DEFAULT_GRADIENT: GradientConfig = {
  enabled: false,
  direction: "bottom",
  opacity: 0.7,
  color: "#000000",
  coverage: 60,
};

export interface Template {
  id: string;
  name: string;
  textConfigs: TextConfig[];
  logoConfig: LogoConfig;
  gradientConfig?: GradientConfig;
  canvasWidth: number;
  canvasHeight: number;
  bgColor: string;
  imagePadding: number;
}

export const DEFAULT_TEXT: TextConfig = {
  content: "Your text here",
  x: 290,
  y: 900,
  fontSize: 36,
  fontFamily: "Arial",
  fill: "#ffffff",
  backgroundColor: "",
  fontWeight: "bold",
  textAlign: "center",
  width: 500,
  opacity: 1,
  lineHeight: 1.3,
  charSpacing: 0,
  strokeColor: "",
  strokeWidth: 0,
  shadow: false,
};

export const DEFAULT_LOGO: LogoConfig = {
  enabled: true,
  x: 880,
  y: 880,
  scale: 0.15,
  opacity: 1,
};

export const FONTS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Impact",
  "Comic Sans MS",
  "Trebuchet MS",
  "Palatino",
  "Garamond",
];

export const CANVAS_PRESETS = [
  { label: "IG Post", short: "IG", width: 1080, height: 1080 },
  { label: "IG Story", short: "Story", width: 1080, height: 1920 },
  { label: "Twitter", short: "X", width: 1200, height: 675 },
  { label: "Facebook", short: "FB", width: 1200, height: 630 },
];
