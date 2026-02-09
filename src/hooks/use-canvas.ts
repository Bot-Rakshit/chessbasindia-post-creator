"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import {
  TextConfig, TextGradient, LogoConfig, FadeConfig, VignetteConfig,
  BgGradientConfig, Template,
  DEFAULT_TEXT, DEFAULT_LOGO, DEFAULT_FADE, DEFAULT_VIGNETTE, DEFAULT_BG_GRADIENT,
} from "@/lib/types";
import {
  makeTextbox, readTextConfig, makeFadeRect, makeVignetteRect,
  applyImagePadding, updateTextProps, applyTextGradient,
} from "@/lib/canvas-engine";

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const [selectedTextIdx, setSelectedTextIdx] = useState(0);
  const [logoEnabled, setLogoEnabled] = useState(true);
  const [bgColor, setBgColor] = useState("#1a1a1a");
  const [imagePadding, setImagePadding] = useState(0);
  const [fadeConfig, setFadeConfig] = useState<FadeConfig>({ ...DEFAULT_FADE });
  const [vignetteConfig, setVignetteConfig] = useState<VignetteConfig>({ ...DEFAULT_VIGNETTE });
  const [bgGradient, setBgGradient] = useState<BgGradientConfig>({ ...DEFAULT_BG_GRADIENT });
  const [textGradients, setTextGradients] = useState<(TextGradient | undefined)[]>([undefined]);

  const [, setRenderTick] = useState(0);
  const tick = useCallback(() => setRenderTick((n) => n + 1), []);

  const textConfigsRef = useRef<TextConfig[]>([{ ...DEFAULT_TEXT }]);
  const logoConfigRef = useRef<LogoConfig>({ ...DEFAULT_LOGO });
  const textObjectsRef = useRef<fabric.Textbox[]>([]);
  const logoObjectRef = useRef<fabric.FabricImage | null>(null);
  const imageObjectRef = useRef<fabric.FabricImage | null>(null);
  const imageFileRef = useRef<string | null>(null);
  const fadeObjectRef = useRef<fabric.Rect | null>(null);
  const vignetteObjectRef = useRef<fabric.Rect | null>(null);
  const fadeConfigRef = useRef<FadeConfig>({ ...DEFAULT_FADE });
  const vignetteConfigRef = useRef<VignetteConfig>({ ...DEFAULT_VIGNETTE });
  const imagePaddingRef = useRef(0);
  const bgColorRef = useRef("#1a1a1a");
  const canvasSizeRef = useRef({ width: 1080, height: 1080 });

  imagePaddingRef.current = imagePadding;
  bgColorRef.current = bgColor;
  canvasSizeRef.current = canvasSize;
  fadeConfigRef.current = fadeConfig;
  vignetteConfigRef.current = vignetteConfig;

  const fitCanvasToContainer = useCallback(() => {
    const c = fabricRef.current; const ct = containerRef.current;
    if (!c || !ct) return;
    const scale = Math.min(ct.clientWidth / canvasSize.width, (window.innerHeight - 16) / canvasSize.height, 1);
    c.setDimensions({ width: canvasSize.width * scale + "px", height: canvasSize.height * scale + "px" }, { cssOnly: true });
  }, [canvasSize]);

  const readTextConfigs = useCallback((): TextConfig[] =>
    textObjectsRef.current.map((obj, i) => {
      const base = textConfigsRef.current[i] || DEFAULT_TEXT;
      return readTextConfig(obj, base, textGradients[i]);
    }), [textGradients]);

  const readLogoConfig = useCallback((): LogoConfig => {
    const l = logoObjectRef.current;
    if (!l) return logoConfigRef.current;
    return { enabled: logoEnabled, x: l.left ?? 0, y: l.top ?? 0, scale: l.scaleX ?? 0.15, opacity: l.opacity ?? 1 };
  }, [logoEnabled]);

  function handleSelection() {
    const canvas = fabricRef.current; if (!canvas) return;
    const active = canvas.getActiveObject();
    const idx = textObjectsRef.current.indexOf(active as fabric.Textbox);
    if (idx >= 0) setSelectedTextIdx(idx);
    tick();
  }

  function addTextToCanvas(canvas: fabric.Canvas, tc: TextConfig, index: number) {
    const textbox = makeTextbox(tc);
    textbox.on("modified", () => tick());
    textbox.on("editing:exited", () => tick());
    textbox.on("changed", () => tick());
    textbox.on("selected", () => { setSelectedTextIdx(index); tick(); });
    canvas.add(textbox);
    textObjectsRef.current.push(textbox);
  }

  function addLogoToCanvas(canvas: fabric.Canvas, config: LogoConfig) {
    fabric.FabricImage.fromURL("/chessbase-logo.svg").then((img) => {
      if (fabricRef.current !== canvas) return;
      img.set({
        left: config.x, top: config.y, scaleX: config.scale, scaleY: config.scale,
        opacity: config.opacity, selectable: true, cornerStyle: "circle",
        cornerColor: "#4f8ef7", borderColor: "#4f8ef7", transparentCorners: false, padding: 6,
      });
      canvas.add(img); logoObjectRef.current = img; canvas.renderAll();
    });
  }

  function syncOverlays(canvas: fabric.Canvas) {
    // Remove existing overlays
    if (fadeObjectRef.current) { canvas.remove(fadeObjectRef.current); fadeObjectRef.current = null; }
    if (vignetteObjectRef.current) { canvas.remove(vignetteObjectRef.current); vignetteObjectRef.current = null; }

    const sz = canvasSizeRef.current;
    const fc = fadeConfigRef.current;
    const vc = vignetteConfigRef.current;

    // Add fade
    if (fc.enabled) {
      const rect = makeFadeRect(fc, sz.width, sz.height);
      canvas.add(rect); canvas.sendObjectToBack(rect);
      if (imageObjectRef.current) {
        const objs = canvas.getObjects();
        const imgIdx = objs.indexOf(imageObjectRef.current);
        const gradIdx = objs.indexOf(rect);
        if (imgIdx >= 0 && gradIdx < imgIdx) {
          for (let j = gradIdx; j < imgIdx; j++) canvas.bringObjectForward(rect);
        }
      }
      fadeObjectRef.current = rect;
    }

    // Add vignette
    if (vc.enabled) {
      const rect = makeVignetteRect(vc, sz.width, sz.height);
      canvas.add(rect); canvas.sendObjectToBack(rect);
      if (imageObjectRef.current) {
        const objs = canvas.getObjects();
        const imgIdx = objs.indexOf(imageObjectRef.current);
        const vigIdx = objs.indexOf(rect);
        if (imgIdx >= 0 && vigIdx < imgIdx) {
          for (let j = vigIdx; j < imgIdx; j++) canvas.bringObjectForward(rect);
        }
      }
      // Place vignette above fade if both exist
      if (fadeObjectRef.current) {
        const objs = canvas.getObjects();
        const fadeIdx = objs.indexOf(fadeObjectRef.current);
        const vigIdx = objs.indexOf(rect);
        if (fadeIdx >= 0 && vigIdx < fadeIdx) {
          for (let j = vigIdx; j < fadeIdx; j++) canvas.bringObjectForward(rect);
        }
      }
      vignetteObjectRef.current = rect;
    }

    canvas.renderAll();
  }

  function rebuildCanvas(canvas: fabric.Canvas) {
    textObjectsRef.current = [];
    fadeObjectRef.current = null;
    vignetteObjectRef.current = null;
    textConfigsRef.current.forEach((tc, i) => addTextToCanvas(canvas, tc, i));
    if (logoEnabled) addLogoToCanvas(canvas, logoConfigRef.current);
    if (imageFileRef.current) {
      const url = imageFileRef.current;
      fabric.FabricImage.fromURL(url).then((img) => {
        if (fabricRef.current !== canvas) return;
        applyImagePadding(img, canvasSizeRef.current.width, canvasSizeRef.current.height, imagePaddingRef.current);
        canvas.add(img); canvas.sendObjectToBack(img);
        imageObjectRef.current = img;
        syncOverlays(canvas);
      });
    } else {
      syncOverlays(canvas);
    }
    canvas.renderAll();
  }

  // Canvas init
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasSize.width, height: canvasSize.height,
      backgroundColor: bgColorRef.current, preserveObjectStacking: true,
    });
    fabricRef.current = canvas;
    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", () => tick());
    rebuildCanvas(canvas);
    fitCanvasToContainer();
    return () => {
      textConfigsRef.current = readTextConfigs();
      logoConfigRef.current = readLogoConfig();
      textObjectsRef.current = [];
      logoObjectRef.current = null;
      imageObjectRef.current = null;
      fadeObjectRef.current = null;
      vignetteObjectRef.current = null;
      canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize]);

  useEffect(() => {
    const canvas = fabricRef.current; if (!canvas) return;
    canvas.backgroundColor = bgColor;
    canvas.renderAll();
  }, [bgColor]);

  useEffect(() => {
    const img = imageObjectRef.current; const canvas = fabricRef.current;
    if (!img || !canvas) return;
    applyImagePadding(img, canvasSize.width, canvasSize.height, imagePadding);
    canvas.renderAll();
  }, [imagePadding, canvasSize]);

  useEffect(() => {
    const canvas = fabricRef.current; if (!canvas) return;
    syncOverlays(canvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fadeConfig, vignetteConfig]);

  useEffect(() => {
    window.addEventListener("resize", fitCanvasToContainer);
    return () => window.removeEventListener("resize", fitCanvasToContainer);
  }, [fitCanvasToContainer]);

  // Actions
  const handleImageUpload = useCallback((file: File) => {
    const canvas = fabricRef.current; if (!canvas) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      imageFileRef.current = url;
      fabric.FabricImage.fromURL(url).then((img) => {
        if (fabricRef.current !== canvas) return;
        if (imageObjectRef.current) canvas.remove(imageObjectRef.current);
        applyImagePadding(img, canvasSizeRef.current.width, canvasSizeRef.current.height, imagePaddingRef.current);
        canvas.add(img); canvas.sendObjectToBack(img);
        imageObjectRef.current = img;
        syncOverlays(canvas);
      });
    };
    reader.readAsDataURL(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateTextStyle = useCallback((idx: number, updates: Partial<TextConfig>) => {
    const obj = textObjectsRef.current[idx]; if (!obj) return;
    const base = textConfigsRef.current[idx] || DEFAULT_TEXT;
    updateTextProps(obj, updates, base);
    // Update base ref for textTransform tracking
    if (updates.textTransform !== undefined) {
      textConfigsRef.current[idx] = { ...base, textTransform: updates.textTransform };
    }
    if (updates.content !== undefined) {
      textConfigsRef.current[idx] = { ...textConfigsRef.current[idx], content: updates.content };
    }
    fabricRef.current?.requestRenderAll(); tick();
  }, [tick]);

  const setTextGradient = useCallback((idx: number, tg: TextGradient | undefined) => {
    setTextGradients(prev => { const n = [...prev]; n[idx] = tg; return n; });
    const obj = textObjectsRef.current[idx]; if (!obj) return;
    if (tg?.enabled) {
      applyTextGradient(obj, tg);
    } else {
      const tc = textConfigsRef.current[idx];
      obj.set("fill", tc?.fill || "#ffffff");
    }
    fabricRef.current?.requestRenderAll(); tick();
  }, [tick]);

  const addTextLayer = useCallback(() => {
    const canvas = fabricRef.current; if (!canvas) return;
    const nc: TextConfig = { ...DEFAULT_TEXT, y: 50 + textObjectsRef.current.length * 80 };
    textConfigsRef.current.push(nc);
    setTextGradients(prev => [...prev, undefined]);
    addTextToCanvas(canvas, nc, textObjectsRef.current.length);
    setSelectedTextIdx(textObjectsRef.current.length - 1);
    canvas.renderAll(); tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const removeTextLayer = useCallback((idx: number) => {
    const canvas = fabricRef.current;
    if (!canvas || textObjectsRef.current.length <= 1) return;
    canvas.remove(textObjectsRef.current[idx]);
    textObjectsRef.current.splice(idx, 1);
    textConfigsRef.current.splice(idx, 1);
    setTextGradients(prev => prev.filter((_, i) => i !== idx));
    setSelectedTextIdx(Math.max(0, idx - 1));
    canvas.renderAll(); tick();
  }, [tick]);

  const toggleLogo = useCallback((enabled: boolean) => {
    const canvas = fabricRef.current; if (!canvas) return;
    setLogoEnabled(enabled);
    if (!enabled && logoObjectRef.current) {
      logoConfigRef.current = {
        enabled: false,
        x: logoObjectRef.current.left ?? 0, y: logoObjectRef.current.top ?? 0,
        scale: logoObjectRef.current.scaleX ?? 0.15, opacity: logoObjectRef.current.opacity ?? 1,
      };
      canvas.remove(logoObjectRef.current); logoObjectRef.current = null;
    } else if (enabled && !logoObjectRef.current) {
      addLogoToCanvas(canvas, logoConfigRef.current);
    }
    canvas.renderAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLogoScale = useCallback((s: number) => {
    const l = logoObjectRef.current; if (!l) return;
    l.set({ scaleX: s, scaleY: s }); fabricRef.current?.renderAll(); tick();
  }, [tick]);

  const updateLogoOpacity = useCallback((o: number) => {
    const l = logoObjectRef.current; if (!l) return;
    l.set({ opacity: o }); fabricRef.current?.renderAll(); tick();
  }, [tick]);

  const changeCanvasSize = useCallback((w: number, h: number) => {
    textConfigsRef.current = readTextConfigs();
    logoConfigRef.current = readLogoConfig();
    setCanvasSize({ width: w, height: h });
  }, [readTextConfigs, readLogoConfig]);

  const getSelectedText = useCallback((): TextConfig | null => {
    const obj = textObjectsRef.current[selectedTextIdx]; if (!obj) return null;
    const base = textConfigsRef.current[selectedTextIdx] || DEFAULT_TEXT;
    return readTextConfig(obj, base, textGradients[selectedTextIdx]);
  }, [selectedTextIdx, textGradients]);

  const getLogoScale = useCallback((): number =>
    logoObjectRef.current?.scaleX ?? logoConfigRef.current.scale, []);
  const getLogoOpacity = useCallback((): number =>
    logoObjectRef.current?.opacity ?? logoConfigRef.current.opacity, []);

  const exportImage = useCallback((format: "png" | "jpeg" = "png") => {
    const canvas = fabricRef.current; if (!canvas) return;
    canvas.discardActiveObject(); canvas.renderAll();
    const dataURL = canvas.toDataURL({ format, quality: 1, multiplier: 1, width: canvasSize.width, height: canvasSize.height });
    const link = document.createElement("a");
    link.download = `chessbase-post.${format}`; link.href = dataURL; link.click();
  }, [canvasSize]);

  const applyTemplate = useCallback((template: Template) => {
    textConfigsRef.current = template.textConfigs.map(t => ({
      ...DEFAULT_TEXT, ...t,
      fontStyle: t.fontStyle || "normal",
      textTransform: t.textTransform || "none",
    }));
    logoConfigRef.current = { ...template.logoConfig };
    setLogoEnabled(template.logoConfig.enabled);
    setBgColor(template.bgColor || "#1a1a1a");
    setImagePadding(template.imagePadding || 0);
    setFadeConfig(template.fadeConfig ? { ...template.fadeConfig } : { ...DEFAULT_FADE });
    setVignetteConfig(template.vignetteConfig ? { ...template.vignetteConfig } : { ...DEFAULT_VIGNETTE });
    setBgGradient(template.bgGradientConfig ? { ...template.bgGradientConfig } : { ...DEFAULT_BG_GRADIENT });
    setTextGradients(template.textConfigs.map(t => t.fillGradient));
    if (canvasSize.width === template.canvasWidth && canvasSize.height === template.canvasHeight) {
      const canvas = fabricRef.current;
      if (canvas) {
        canvas.getObjects().slice().forEach(o => { if (o !== imageObjectRef.current) canvas.remove(o); });
        textObjectsRef.current = []; logoObjectRef.current = null;
        fadeObjectRef.current = null; vignetteObjectRef.current = null;
        textConfigsRef.current.forEach((tc, i) => addTextToCanvas(canvas, tc, i));
        if (template.logoConfig.enabled) addLogoToCanvas(canvas, logoConfigRef.current);
        syncOverlays(canvas);
      }
    } else setCanvasSize({ width: template.canvasWidth, height: template.canvasHeight });
    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize, tick]);

  const selectTextObject = useCallback((idx: number) => {
    setSelectedTextIdx(idx);
    const obj = textObjectsRef.current[idx];
    if (obj) { fabricRef.current?.setActiveObject(obj); fabricRef.current?.renderAll(); }
  }, []);

  return {
    canvasRef, containerRef, fabricRef,
    canvasSize, changeCanvasSize,
    selectedTextIdx, selectTextObject,
    logoEnabled, toggleLogo, updateLogoScale, updateLogoOpacity, getLogoScale, getLogoOpacity,
    bgColor, setBgColor,
    imagePadding, setImagePadding,
    fadeConfig, setFadeConfig,
    vignetteConfig, setVignetteConfig,
    bgGradient, setBgGradient,
    textGradients, setTextGradient,
    textObjectsRef, textConfigsRef, imageFileRef,
    handleImageUpload, updateTextStyle, addTextLayer, removeTextLayer,
    getSelectedText, readTextConfigs, readLogoConfig,
    exportImage, applyTemplate,
    tick,
    makeFadeRect: makeFadeRect,
    makeTextbox: makeTextbox,
  };
}
