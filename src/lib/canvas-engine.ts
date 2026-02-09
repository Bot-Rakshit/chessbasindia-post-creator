import * as fabric from "fabric";
import {
  TextConfig, TextGradient, LogoConfig, FadeConfig, VignetteConfig,
  GradientDirection, DEFAULT_TEXT,
} from "./types";

type FabricTextAlign = "left" | "center" | "right" | "justify";
const TEXT_SHADOW = new fabric.Shadow({ color: "rgba(0,0,0,0.6)", blur: 6, offsetX: 2, offsetY: 2 });

export const hexToRgba = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

export function makeLinearGradient(
  color1: string, color2: string, dir: GradientDirection,
  w: number, h: number,
): fabric.Gradient<"linear"> {
  let coords: { x1: number; y1: number; x2: number; y2: number };
  switch (dir) {
    case "bottom": coords = { x1: 0, y1: 0, x2: 0, y2: h }; break;
    case "top":    coords = { x1: 0, y1: h, x2: 0, y2: 0 }; break;
    case "left":   coords = { x1: w, y1: 0, x2: 0, y2: 0 }; break;
    case "right":  coords = { x1: 0, y1: 0, x2: w, y2: 0 }; break;
  }
  return new fabric.Gradient({
    type: "linear", gradientUnits: "pixels", coords,
    colorStops: [{ offset: 0, color: color1 }, { offset: 1, color: color2 }],
  });
}

function applyTextTransform(text: string, transform: string): string {
  switch (transform) {
    case "uppercase": return text.toUpperCase();
    case "lowercase": return text.toLowerCase();
    case "capitalize": return text.replace(/\b\w/g, (c) => c.toUpperCase());
    default: return text;
  }
}

export function applyTextGradient(obj: fabric.Textbox, tg: TextGradient) {
  const w = obj.width ?? 500;
  const h = (obj.fontSize ?? 36) * (obj.lineHeight ?? 1.3);
  obj.set("fill", makeLinearGradient(tg.color1, tg.color2, tg.direction, w, h));
}

export function makeTextbox(tc: TextConfig): fabric.Textbox {
  const displayText = applyTextTransform(tc.content, tc.textTransform);
  const tb = new fabric.Textbox(displayText, {
    left: tc.x, top: tc.y, fontSize: tc.fontSize, fontFamily: tc.fontFamily,
    fill: tc.fill, backgroundColor: tc.backgroundColor || undefined,
    fontWeight: tc.fontWeight as "" | "bold" | "normal",
    fontStyle: tc.fontStyle || "normal",
    textAlign: tc.textAlign as FabricTextAlign,
    width: tc.width, editable: true, selectable: true, scaleX: 1, scaleY: 1,
    opacity: tc.opacity, lineHeight: tc.lineHeight, charSpacing: tc.charSpacing,
    stroke: tc.strokeColor || undefined, strokeWidth: tc.strokeWidth,
    shadow: tc.shadow ? TEXT_SHADOW : undefined,
    cornerStyle: "circle", cornerColor: "#4f8ef7", borderColor: "#4f8ef7",
    transparentCorners: false, padding: 6,
  });
  if (tc.fillGradient?.enabled) applyTextGradient(tb, tc.fillGradient);
  tb.initDimensions(); tb.setCoords();
  return tb;
}

export function readTextConfig(obj: fabric.Textbox, base: TextConfig, textGradient?: TextGradient): TextConfig {
  const sx = obj.scaleX ?? 1, sy = obj.scaleY ?? 1;
  return {
    content: obj.text || base.content, x: obj.left ?? base.x, y: obj.top ?? base.y,
    fontSize: Math.round((obj.fontSize ?? base.fontSize) * sy),
    fontFamily: obj.fontFamily || base.fontFamily,
    fill: typeof obj.fill === "string" ? obj.fill : base.fill,
    fillGradient: textGradient,
    backgroundColor: (obj.backgroundColor as string) || "",
    fontWeight: (obj.fontWeight as string) || base.fontWeight,
    fontStyle: (obj.fontStyle as "normal" | "italic") || "normal",
    textTransform: base.textTransform || "none",
    textAlign: (obj.textAlign as string) || base.textAlign,
    width: Math.round((obj.width ?? base.width) * sx),
    opacity: obj.opacity ?? 1, lineHeight: obj.lineHeight ?? 1.3,
    charSpacing: obj.charSpacing ?? 0,
    strokeColor: (obj.stroke as string) || "",
    strokeWidth: Math.round((obj.strokeWidth ?? 0) * sy * 10) / 10,
    shadow: !!obj.shadow,
  };
}

export function makeFadeRect(fc: FadeConfig, w: number, h: number): fabric.Rect {
  const rect = new fabric.Rect({
    left: 0, top: 0, width: w, height: h,
    originX: "left", originY: "top",
    selectable: false, evented: false,
  });
  const cf = fc.coverage / 100;
  let coords: { x1: number; y1: number; x2: number; y2: number };
  switch (fc.direction) {
    case "bottom": coords = { x1: 0, y1: h, x2: 0, y2: h * (1 - cf) }; break;
    case "top":    coords = { x1: 0, y1: 0, x2: 0, y2: h * cf }; break;
    case "left":   coords = { x1: 0, y1: 0, x2: w * cf, y2: 0 }; break;
    case "right":  coords = { x1: w, y1: 0, x2: w * (1 - cf), y2: 0 }; break;
  }
  rect.set("fill", new fabric.Gradient({
    type: "linear", gradientUnits: "pixels", coords,
    colorStops: [
      { offset: 0, color: hexToRgba(fc.color, fc.opacity) },
      { offset: 1, color: hexToRgba(fc.color, 0) },
    ],
  }));
  return rect;
}

export function makeVignetteRect(vc: VignetteConfig, w: number, h: number): fabric.Rect {
  const rect = new fabric.Rect({
    left: 0, top: 0, width: w, height: h,
    originX: "left", originY: "top",
    selectable: false, evented: false,
  });
  const sizeFraction = vc.size / 100;
  const radius = Math.max(w, h) * sizeFraction;
  rect.set("fill", new fabric.Gradient({
    type: "radial",
    gradientUnits: "pixels",
    coords: { x1: w / 2, y1: h / 2, r1: radius * 0.3, x2: w / 2, y2: h / 2, r2: radius },
    colorStops: [
      { offset: 0, color: "rgba(0,0,0,0)" },
      { offset: 0.5, color: hexToRgba(vc.color, vc.strength * 0.3) },
      { offset: 1, color: hexToRgba(vc.color, vc.strength) },
    ],
  }));
  return rect;
}

export function applyImagePadding(
  img: fabric.FabricImage,
  canvasW: number, canvasH: number, padding: number,
) {
  const aW = canvasW - padding * 2, aH = canvasH - padding * 2;
  const s = Math.max(aW / img.width!, aH / img.height!);
  img.set({
    left: canvasW / 2, top: canvasH / 2, originX: "center", originY: "center",
    scaleX: s, scaleY: s, selectable: true,
    cornerStyle: "circle", cornerColor: "#4f8ef7", borderColor: "#4f8ef7", transparentCorners: false,
  });
  img.set(padding > 0
    ? { clipPath: new fabric.Rect({ width: aW / s, height: aH / s, originX: "center", originY: "center" }) }
    : { clipPath: undefined }
  );
}

export function updateTextProps(
  obj: fabric.Textbox, updates: Partial<TextConfig>, base: TextConfig,
) {
  const sy = obj.scaleY ?? 1;
  if (updates.fontSize !== undefined) obj.set("fontSize", updates.fontSize / sy);
  if (updates.strokeWidth !== undefined) obj.set("strokeWidth", updates.strokeWidth / sy);
  if (updates.content !== undefined) {
    const transform = updates.textTransform ?? base.textTransform ?? "none";
    obj.set("text", applyTextTransform(updates.content, transform));
  }
  if (updates.textTransform !== undefined) {
    const raw = updates.content ?? obj.text ?? "";
    obj.set("text", applyTextTransform(raw, updates.textTransform));
  }
  if (updates.fontFamily !== undefined) obj.set("fontFamily", updates.fontFamily);
  if (updates.fill !== undefined) obj.set("fill", updates.fill);
  if (updates.backgroundColor !== undefined) obj.set("backgroundColor", updates.backgroundColor || undefined);
  if (updates.fontWeight !== undefined) obj.set("fontWeight", updates.fontWeight as "bold" | "normal" | "");
  if (updates.fontStyle !== undefined) obj.set("fontStyle", updates.fontStyle);
  if (updates.textAlign !== undefined) obj.set("textAlign", updates.textAlign as FabricTextAlign);
  if (updates.opacity !== undefined) obj.set("opacity", updates.opacity);
  if (updates.lineHeight !== undefined) obj.set("lineHeight", updates.lineHeight);
  if (updates.charSpacing !== undefined) obj.set("charSpacing", updates.charSpacing);
  if (updates.strokeColor !== undefined) {
    obj.set("stroke", updates.strokeColor || undefined);
    if (updates.strokeWidth === undefined && updates.strokeColor && !obj.strokeWidth)
      obj.set("strokeWidth", 1 / sy);
  }
  if (updates.shadow !== undefined) obj.set("shadow", updates.shadow ? TEXT_SHADOW : undefined);
  obj.initDimensions(); obj.setCoords();
}

export { DEFAULT_TEXT };
