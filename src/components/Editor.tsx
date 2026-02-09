"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TextConfig, LogoConfig, GradientConfig, GradientDirection, Template,
  DEFAULT_TEXT, DEFAULT_LOGO, DEFAULT_GRADIENT, FONTS, CANVAS_PRESETS,
} from "@/lib/types";
import {
  loadTemplates, saveTemplate, deleteTemplate,
  exportTemplateAsJSON, exportAllTemplatesAsJSON, importTemplatesFromJSON,
} from "@/lib/templates";

type FabricTextAlign = "left" | "center" | "right" | "justify";
const TEXT_SHADOW = new fabric.Shadow({ color: "rgba(0,0,0,0.6)", blur: 6, offsetX: 2, offsetY: 2 });

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const [selectedTextIdx, setSelectedTextIdx] = useState(0);
  const [logoEnabled, setLogoEnabled] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [bulkImages, setBulkImages] = useState<File[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("design");
  const [bgColor, setBgColor] = useState("#1a1a1a");
  const [imagePadding, setImagePadding] = useState(0);
  const [gradientConfig, setGradientConfig] = useState<GradientConfig>({ ...DEFAULT_GRADIENT });

  const [, setRenderTick] = useState(0);
  const tick = () => setRenderTick((n) => n + 1);

  const textConfigsRef = useRef<TextConfig[]>([{ ...DEFAULT_TEXT }]);
  const logoConfigRef = useRef<LogoConfig>({ ...DEFAULT_LOGO });
  const textObjectsRef = useRef<fabric.Textbox[]>([]);
  const logoObjectRef = useRef<fabric.FabricImage | null>(null);
  const imageObjectRef = useRef<fabric.FabricImage | null>(null);
  const imageFileRef = useRef<string | null>(null);
  const gradientObjectRef = useRef<fabric.Rect | null>(null);
  const gradientConfigRef = useRef<GradientConfig>({ ...DEFAULT_GRADIENT });
  // Store padding/bgColor in refs so async callbacks always see latest
  const imagePaddingRef = useRef(0);
  const bgColorRef = useRef("#1a1a1a");
  const canvasSizeRef = useRef({ width: 1080, height: 1080 });

  imagePaddingRef.current = imagePadding;
  bgColorRef.current = bgColor;
  canvasSizeRef.current = canvasSize;
  gradientConfigRef.current = gradientConfig;

  useEffect(() => { setTemplates(loadTemplates()); }, []);

  const fitCanvasToContainer = useCallback(() => {
    const canvas = fabricRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const maxW = container.clientWidth;
    const maxH = window.innerHeight - 16;
    const scale = Math.min(maxW / canvasSize.width, maxH / canvasSize.height, 1);
    canvas.setDimensions(
      { width: canvasSize.width * scale + "px", height: canvasSize.height * scale + "px" },
      { cssOnly: true }
    );
  }, [canvasSize]);

  const readTextConfigs = (): TextConfig[] =>
    textObjectsRef.current.map((obj, i) => {
      const base = textConfigsRef.current[i] || DEFAULT_TEXT;
      // Account for Fabric scaling: when user resizes via handles,
      // Fabric changes scaleX/scaleY instead of width/fontSize.
      const sx = obj.scaleX ?? 1;
      const sy = obj.scaleY ?? 1;
      return {
        content: obj.text || base.content, x: obj.left ?? base.x, y: obj.top ?? base.y,
        fontSize: Math.round((obj.fontSize ?? base.fontSize) * sy),
        fontFamily: obj.fontFamily || base.fontFamily,
        fill: (obj.fill as string) || base.fill, backgroundColor: (obj.backgroundColor as string) || "",
        fontWeight: (obj.fontWeight as string) || base.fontWeight,
        textAlign: (obj.textAlign as string) || base.textAlign,
        width: Math.round((obj.width ?? base.width) * sx),
        opacity: obj.opacity ?? 1, lineHeight: obj.lineHeight ?? 1.3,
        charSpacing: obj.charSpacing ?? 0,
        strokeColor: (obj.stroke as string) || "",
        strokeWidth: Math.round((obj.strokeWidth ?? 0) * sy * 10) / 10,
        shadow: !!obj.shadow,
      };
    });

  const readLogoConfig = (): LogoConfig => {
    const logo = logoObjectRef.current;
    if (!logo) return logoConfigRef.current;
    return {
      enabled: logoEnabled, x: logo.left ?? logoConfigRef.current.x,
      y: logo.top ?? logoConfigRef.current.y, scale: logo.scaleX ?? logoConfigRef.current.scale,
      opacity: logo.opacity ?? 1,
    };
  };

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
      canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.backgroundColor = bgColor;
    canvas.renderAll();
  }, [bgColor]);

  useEffect(() => {
    const img = imageObjectRef.current;
    const canvas = fabricRef.current;
    if (!img || !canvas) return;
    applyImagePadding(img);
    canvas.renderAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePadding]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    syncGradient(canvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradientConfig]);

  useEffect(() => {
    window.addEventListener("resize", fitCanvasToContainer);
    return () => window.removeEventListener("resize", fitCanvasToContainer);
  }, [fitCanvasToContainer]);

  function handleSelection() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    const idx = textObjectsRef.current.indexOf(active as fabric.Textbox);
    if (idx >= 0) setSelectedTextIdx(idx);
    tick();
  }

  function rebuildCanvas(canvas: fabric.Canvas) {
    textObjectsRef.current = [];
    gradientObjectRef.current = null;
    textConfigsRef.current.forEach((tc, i) => addTextToCanvas(canvas, tc, i));
    if (logoEnabled) addLogoToCanvas(canvas, logoConfigRef.current);
    if (imageFileRef.current) {
      const url = imageFileRef.current;
      fabric.FabricImage.fromURL(url).then((img) => {
        if (fabricRef.current !== canvas) return;
        applyImagePadding(img);
        canvas.add(img);
        canvas.sendObjectToBack(img);
        imageObjectRef.current = img;
        syncGradient(canvas);
        canvas.renderAll();
      });
    } else {
      syncGradient(canvas);
    }
    canvas.renderAll();
  }

  function applyImagePadding(img: fabric.FabricImage) {
    const sz = canvasSizeRef.current;
    const pad = imagePaddingRef.current;
    const availW = sz.width - pad * 2;
    const availH = sz.height - pad * 2;
    const scale = Math.max(availW / img.width!, availH / img.height!);
    img.set({
      left: sz.width / 2, top: sz.height / 2,
      originX: "center", originY: "center",
      scaleX: scale, scaleY: scale, selectable: true,
      cornerStyle: "circle", cornerColor: "#4f8ef7", borderColor: "#4f8ef7", transparentCorners: false,
    });
    if (pad > 0) {
      img.set({
        clipPath: new fabric.Rect({
          width: availW / scale, height: availH / scale,
          originX: "center", originY: "center",
        }),
      });
    } else {
      img.set({ clipPath: undefined });
    }
  }

  function makeGradientRect(gc: GradientConfig, w: number, h: number): fabric.Rect {
    const rect = new fabric.Rect({
      left: 0, top: 0, width: w, height: h,
      selectable: false, evented: false, excludeFromExport: false,
    });

    // Calculate gradient coordinates based on direction and coverage
    const coverageFraction = gc.coverage / 100;
    let coords: { x1: number; y1: number; x2: number; y2: number };
    switch (gc.direction) {
      case "bottom":
        coords = { x1: 0, y1: h, x2: 0, y2: h * (1 - coverageFraction) };
        break;
      case "top":
        coords = { x1: 0, y1: 0, x2: 0, y2: h * coverageFraction };
        break;
      case "left":
        coords = { x1: 0, y1: 0, x2: w * coverageFraction, y2: 0 };
        break;
      case "right":
        coords = { x1: w, y1: 0, x2: w * (1 - coverageFraction), y2: 0 };
        break;
    }

    // Convert hex color to rgba with opacity
    const hexToRgba = (hex: string, a: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    };

    const gradient = new fabric.Gradient({
      type: "linear",
      gradientUnits: "pixels",
      coords,
      colorStops: [
        { offset: 0, color: hexToRgba(gc.color, gc.opacity) },
        { offset: 1, color: hexToRgba(gc.color, 0) },
      ],
    });

    rect.set("fill", gradient);
    return rect;
  }

  function syncGradient(canvas: fabric.Canvas) {
    // Remove old gradient
    if (gradientObjectRef.current) {
      canvas.remove(gradientObjectRef.current);
      gradientObjectRef.current = null;
    }

    const gc = gradientConfigRef.current;
    if (!gc.enabled) return;

    const sz = canvasSizeRef.current;
    const rect = makeGradientRect(gc, sz.width, sz.height);
    canvas.add(rect);

    // Position gradient above image but below text/logo
    // Send to back first, then move above image if present
    canvas.sendObjectToBack(rect);
    if (imageObjectRef.current) {
      // Gradient should be just above the image
      const objects = canvas.getObjects();
      const imgIdx = objects.indexOf(imageObjectRef.current);
      const gradIdx = objects.indexOf(rect);
      if (imgIdx >= 0 && gradIdx < imgIdx) {
        // Move gradient up to be right after image
        for (let j = gradIdx; j < imgIdx; j++) {
          canvas.bringObjectForward(rect);
        }
      }
    }

    gradientObjectRef.current = rect;
    canvas.renderAll();
  }

  function makeTextbox(tc: TextConfig): fabric.Textbox {
    const tb = new fabric.Textbox(tc.content, {
      left: tc.x, top: tc.y, fontSize: tc.fontSize, fontFamily: tc.fontFamily,
      fill: tc.fill, backgroundColor: tc.backgroundColor || undefined,
      fontWeight: tc.fontWeight as "" | "bold" | "normal",
      textAlign: tc.textAlign as FabricTextAlign,
      width: tc.width, editable: true, selectable: true,
      scaleX: 1, scaleY: 1,
      opacity: tc.opacity, lineHeight: tc.lineHeight, charSpacing: tc.charSpacing,
      stroke: tc.strokeColor || undefined, strokeWidth: tc.strokeWidth,
      shadow: tc.shadow ? TEXT_SHADOW : undefined,
      cornerStyle: "circle", cornerColor: "#4f8ef7", borderColor: "#4f8ef7",
      transparentCorners: false, padding: 6,
    });
    tb.initDimensions();
    tb.setCoords();
    return tb;
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
      canvas.add(img);
      logoObjectRef.current = img;
      canvas.renderAll();
    });
  }

  const handleImageUpload = useCallback((file: File) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      imageFileRef.current = url;
      fabric.FabricImage.fromURL(url).then((img) => {
        if (fabricRef.current !== canvas) return;
        if (imageObjectRef.current) canvas.remove(imageObjectRef.current);
        applyImagePadding(img);
        canvas.add(img);
        canvas.sendObjectToBack(img);
        imageObjectRef.current = img;
        syncGradient(canvas);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const updateTextStyle = (idx: number, updates: Partial<TextConfig>) => {
    const obj = textObjectsRef.current[idx];
    if (!obj) return;
    const sx = obj.scaleX ?? 1;
    const sy = obj.scaleY ?? 1;

    // When setting fontSize or strokeWidth from sidebar, the value is already
    // the "visual" value (accounting for scale). We need to set the raw value.
    if (updates.fontSize !== undefined) {
      obj.set("fontSize", updates.fontSize / sy);
    }
    if (updates.strokeWidth !== undefined) {
      obj.set("strokeWidth", updates.strokeWidth / sy);
    }
    if (updates.content !== undefined) obj.set("text", updates.content);
    if (updates.fontFamily !== undefined) obj.set("fontFamily", updates.fontFamily);
    if (updates.fill !== undefined) obj.set("fill", updates.fill);
    if (updates.backgroundColor !== undefined) obj.set("backgroundColor", updates.backgroundColor || undefined);
    if (updates.fontWeight !== undefined) obj.set("fontWeight", updates.fontWeight as "bold" | "normal" | "");
    if (updates.textAlign !== undefined) obj.set("textAlign", updates.textAlign as FabricTextAlign);
    if (updates.opacity !== undefined) obj.set("opacity", updates.opacity);
    if (updates.lineHeight !== undefined) obj.set("lineHeight", updates.lineHeight);
    if (updates.charSpacing !== undefined) obj.set("charSpacing", updates.charSpacing);
    if (updates.strokeColor !== undefined) {
      obj.set("stroke", updates.strokeColor || undefined);
      if (updates.strokeWidth === undefined && updates.strokeColor) {
        // If adding stroke for first time, set default width accounting for scale
        if (!obj.strokeWidth) obj.set("strokeWidth", 1 / sy);
      }
    }
    if (updates.shadow !== undefined) obj.set("shadow", updates.shadow ? TEXT_SHADOW : undefined);

    obj.initDimensions();
    obj.setCoords();
    fabricRef.current?.requestRenderAll();
    tick();
  };

  const addTextLayer = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const nc: TextConfig = { ...DEFAULT_TEXT, y: 50 + textObjectsRef.current.length * 80 };
    textConfigsRef.current.push(nc);
    addTextToCanvas(canvas, nc, textObjectsRef.current.length);
    setSelectedTextIdx(textObjectsRef.current.length - 1);
    canvas.renderAll(); tick();
  };

  const removeTextLayer = (idx: number) => {
    const canvas = fabricRef.current;
    if (!canvas || textObjectsRef.current.length <= 1) return;
    canvas.remove(textObjectsRef.current[idx]);
    textObjectsRef.current.splice(idx, 1);
    textConfigsRef.current.splice(idx, 1);
    setSelectedTextIdx(Math.max(0, idx - 1));
    canvas.renderAll(); tick();
  };

  const toggleLogo = (enabled: boolean) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setLogoEnabled(enabled);
    if (!enabled && logoObjectRef.current) {
      logoConfigRef.current = readLogoConfig();
      canvas.remove(logoObjectRef.current);
      logoObjectRef.current = null;
    } else if (enabled && !logoObjectRef.current) {
      addLogoToCanvas(canvas, logoConfigRef.current);
    }
    canvas.renderAll();
  };

  const updateLogoScale = (scale: number) => {
    const logo = logoObjectRef.current;
    if (!logo) return;
    logo.set({ scaleX: scale, scaleY: scale });
    fabricRef.current?.renderAll(); tick();
  };

  const updateLogoOpacity = (opacity: number) => {
    const logo = logoObjectRef.current;
    if (!logo) return;
    logo.set({ opacity });
    fabricRef.current?.renderAll(); tick();
  };

  const getSelectedText = (): TextConfig | null => {
    const obj = textObjectsRef.current[selectedTextIdx];
    if (!obj) return null;
    const sx = obj.scaleX ?? 1;
    const sy = obj.scaleY ?? 1;
    return {
      content: obj.text || "", x: obj.left ?? 0, y: obj.top ?? 0,
      fontSize: Math.round((obj.fontSize ?? 32) * sy),
      fontFamily: obj.fontFamily || "Arial",
      fill: (obj.fill as string) || "#ffffff", backgroundColor: (obj.backgroundColor as string) || "",
      fontWeight: (obj.fontWeight as string) || "bold", textAlign: (obj.textAlign as string) || "center",
      width: Math.round((obj.width ?? 500) * sx), opacity: obj.opacity ?? 1,
      lineHeight: obj.lineHeight ?? 1.3,
      charSpacing: obj.charSpacing ?? 0, strokeColor: (obj.stroke as string) || "",
      strokeWidth: Math.round((obj.strokeWidth ?? 0) * sy * 10) / 10, shadow: !!obj.shadow,
    };
  };

  const getLogoScale = (): number => logoObjectRef.current?.scaleX ?? logoConfigRef.current.scale;
  const getLogoOpacity = (): number => logoObjectRef.current?.opacity ?? logoConfigRef.current.opacity;

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    saveTemplate({
      id: Date.now().toString(), name: templateName,
      textConfigs: readTextConfigs(), logoConfig: readLogoConfig(),
      gradientConfig: { ...gradientConfig },
      canvasWidth: canvasSize.width, canvasHeight: canvasSize.height,
      bgColor, imagePadding,
    });
    setTemplates(loadTemplates());
    setTemplateName("");
  };

  const handleApplyTemplate = (template: Template) => {
    textConfigsRef.current = template.textConfigs.map((t) => ({ ...t }));
    logoConfigRef.current = { ...template.logoConfig };
    setLogoEnabled(template.logoConfig.enabled);
    setBgColor(template.bgColor || "#1a1a1a");
    setImagePadding(template.imagePadding || 0);
    setGradientConfig(template.gradientConfig ? { ...template.gradientConfig } : { ...DEFAULT_GRADIENT });
    if (canvasSize.width === template.canvasWidth && canvasSize.height === template.canvasHeight) {
      const canvas = fabricRef.current;
      if (canvas) {
        canvas.getObjects().slice().forEach((o) => { if (o !== imageObjectRef.current) canvas.remove(o); });
        textObjectsRef.current = [];
        logoObjectRef.current = null;
        // Rebuild text/logo but keep image
        textConfigsRef.current.forEach((tc, i) => addTextToCanvas(canvas, tc, i));
        if (template.logoConfig.enabled) addLogoToCanvas(canvas, logoConfigRef.current);
        canvas.renderAll();
      }
    } else {
      setCanvasSize({ width: template.canvasWidth, height: template.canvasHeight });
    }
    tick();
  };

  const handleDeleteTemplate = (id: string) => { deleteTemplate(id); setTemplates(loadTemplates()); };

  const changeCanvasSize = (w: number, h: number) => {
    textConfigsRef.current = readTextConfigs();
    logoConfigRef.current = readLogoConfig();
    setCanvasSize({ width: w, height: h });
  };

  const exportImage = (format: "png" | "jpeg" = "png") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.discardActiveObject(); canvas.renderAll();
    const dataURL = canvas.toDataURL({ format, quality: 1, multiplier: 1, width: canvasSize.width, height: canvasSize.height });
    const link = document.createElement("a");
    link.download = `chessbase-post.${format}`;
    link.href = dataURL; link.click();
  };

  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve) => { const r = new FileReader(); r.onload = (e) => resolve(e.target?.result as string); r.readAsDataURL(file); });

  const handleBulkExport = async () => {
    if (bulkImages.length === 0) return;
    setIsBulkProcessing(true);
    const txts = readTextConfigs();
    const logo = readLogoConfig();
    const zip = new JSZip();
    const off = document.createElement("canvas");
    off.width = canvasSize.width; off.height = canvasSize.height;
    const oc = new fabric.Canvas(off, { width: canvasSize.width, height: canvasSize.height, backgroundColor: bgColor });
    for (let i = 0; i < bulkImages.length; i++) {
      const url = await readFileAsDataURL(bulkImages[i]);
      const img = await fabric.FabricImage.fromURL(url);
      oc.clear(); oc.backgroundColor = bgColor;
      const pad = imagePadding;
      const availW = canvasSize.width - pad * 2;
      const availH = canvasSize.height - pad * 2;
      const s = Math.max(availW / img.width!, availH / img.height!);
      img.set({ left: canvasSize.width / 2, top: canvasSize.height / 2, originX: "center", originY: "center", scaleX: s, scaleY: s });
      if (pad > 0) {
        img.set({ clipPath: new fabric.Rect({ width: availW / s, height: availH / s, originX: "center", originY: "center" }) });
      }
      oc.add(img);
      if (gradientConfig.enabled) {
        oc.add(makeGradientRect(gradientConfig, canvasSize.width, canvasSize.height));
      }
      for (const tc of txts) { oc.add(makeTextbox(tc)); }
      if (logo.enabled) {
        const li = await fabric.FabricImage.fromURL("/chessbase-logo.svg");
        li.set({ left: logo.x, top: logo.y, scaleX: logo.scale, scaleY: logo.scale, opacity: logo.opacity });
        oc.add(li);
      }
      oc.renderAll();
      zip.file(`post-${i + 1}.png`, oc.toDataURL({ format: "png", quality: 1, multiplier: 1 }).split(",")[1], { base64: true });
    }
    oc.dispose();
    saveAs(await zip.generateAsync({ type: "blob" }), "chessbase-posts.zip");
    setIsBulkProcessing(false);
  };

  const ct = getSelectedText();
  const logoScale = getLogoScale();
  const logoOpacity = getLogoOpacity();
  const activePreset = CANVAS_PRESETS.find((p) => p.width === canvasSize.width && p.height === canvasSize.height);
  const hasImage = !!imageFileRef.current;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-[300px] shrink-0 border-r border-border flex flex-col h-screen">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/chessbase-logo.svg" alt="CB" className="h-6" />
          <span className="font-semibold text-sm">Post Creator</span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-2 mt-2 w-auto shrink-0">
            <TabsTrigger value="design" className="flex-1 text-xs">Design</TabsTrigger>
            <TabsTrigger value="templates" className="flex-1 text-xs">Templates</TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1 text-xs">Bulk</TabsTrigger>
          </TabsList>

          {/* DESIGN */}
          <TabsContent value="design" className="flex-1 overflow-y-auto px-3 pb-3 mt-0 pt-2">
            <div className="space-y-3">

            {/* Canvas size quick buttons */}
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Size</Label>
              <div className="grid grid-cols-4 gap-1 mt-1">
                {CANVAS_PRESETS.map((p) => (
                  <button key={p.label}
                    className={`py-1.5 rounded text-xs font-medium transition-colors ${activePreset?.label === p.label ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
                    onClick={() => changeCanvasSize(p.width, p.height)}>
                    {p.short}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{canvasSize.width} x {canvasSize.height}</p>
            </div>

            {/* Photo + background */}
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Photo & Background</Label>
              <div className="space-y-1.5 mt-1">
                <label className="flex items-center justify-center gap-1.5 border border-dashed rounded h-8 cursor-pointer hover:border-primary transition-colors text-xs text-muted-foreground">
                  {hasImage ? "Change Photo" : "Upload Photo"}
                  <Input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                </label>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-1">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-6 h-6 rounded border cursor-pointer p-0" />
                    <span className="text-[10px] text-muted-foreground">BG</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground"><span>Padding</span><span>{imagePadding}</span></div>
                    <Slider value={[imagePadding]} onValueChange={([v]) => setImagePadding(v)} min={0} max={200} step={5} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gradient overlay */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Gradient Overlay</Label>
                <input type="checkbox" checked={gradientConfig.enabled}
                  onChange={(e) => setGradientConfig((g) => ({ ...g, enabled: e.target.checked }))} className="accent-primary" />
              </div>
              {gradientConfig.enabled && (
                <div className="space-y-1.5 mt-1">
                  <div className="flex gap-1">
                    {(["bottom", "top", "left", "right"] as const).map((d) => (
                      <button key={d}
                        className={`flex-1 py-1 rounded text-[10px] ${gradientConfig.direction === d ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                        onClick={() => setGradientConfig((g) => ({ ...g, direction: d as GradientDirection }))}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={gradientConfig.color}
                      onChange={(e) => setGradientConfig((g) => ({ ...g, color: e.target.value }))}
                      className="w-6 h-6 rounded border cursor-pointer p-0" />
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground"><span>Opacity</span><span>{Math.round(gradientConfig.opacity * 100)}%</span></div>
                      <Slider value={[gradientConfig.opacity * 100]}
                        onValueChange={([v]) => setGradientConfig((g) => ({ ...g, opacity: v / 100 }))}
                        min={10} max={100} step={5} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-12 shrink-0">Coverage</span>
                    <Slider value={[gradientConfig.coverage]}
                      onValueChange={([v]) => setGradientConfig((g) => ({ ...g, coverage: v }))}
                      min={10} max={100} step={5} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{gradientConfig.coverage}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Text */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Text</Label>
                <div className="flex gap-2">
                  {textObjectsRef.current.length > 1 && (
                    <button className="text-[10px] text-destructive hover:underline" onClick={() => removeTextLayer(selectedTextIdx)}>Remove</button>
                  )}
                  <button className="text-[10px] text-primary hover:underline" onClick={addTextLayer}>+ Add</button>
                </div>
              </div>

              {textObjectsRef.current.length > 1 && (
                <div className="flex gap-1 mt-1">
                  {textObjectsRef.current.map((_, i) => (
                    <button key={i} className={`px-2 py-0.5 rounded text-[10px] ${selectedTextIdx === i ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      onClick={() => { setSelectedTextIdx(i); fabricRef.current?.setActiveObject(textObjectsRef.current[i]); fabricRef.current?.renderAll(); }}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {ct && (
                <div className="space-y-1.5 mt-1">
                  <Input value={ct.content} onChange={(e) => updateTextStyle(selectedTextIdx, { content: e.target.value })} placeholder="Text..." className="h-7 text-xs" />

                  <div className="grid grid-cols-2 gap-1">
                    <Select value={ct.fontFamily} onValueChange={(v) => updateTextStyle(selectedTextIdx, { fontFamily: v })}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{FONTS.map((f) => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={ct.fontWeight} onValueChange={(v) => updateTextStyle(selectedTextIdx, { fontWeight: v })}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                        <SelectItem value="bold" className="text-xs">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Size */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-6 shrink-0">Size</span>
                    <Slider value={[ct.fontSize]} onValueChange={([v]) => updateTextStyle(selectedTextIdx, { fontSize: v })} min={12} max={120} step={1} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{ct.fontSize}</span>
                  </div>

                  {/* Colors */}
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-1">
                      <input type="color" value={ct.fill} onChange={(e) => updateTextStyle(selectedTextIdx, { fill: e.target.value })} className="w-6 h-6 rounded border cursor-pointer p-0" />
                      <span className="text-[10px] text-muted-foreground">Fill</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="color" value={ct.backgroundColor || "#000000"} onChange={(e) => updateTextStyle(selectedTextIdx, { backgroundColor: e.target.value })} className="w-6 h-6 rounded border cursor-pointer p-0" />
                      <span className="text-[10px] text-muted-foreground">BG</span>
                      {ct.backgroundColor && <button className="text-[10px] text-muted-foreground underline" onClick={() => updateTextStyle(selectedTextIdx, { backgroundColor: "" })}>x</button>}
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="color" value={ct.strokeColor || "#000000"} onChange={(e) => updateTextStyle(selectedTextIdx, { strokeColor: e.target.value, strokeWidth: ct.strokeWidth || 1 })} className="w-6 h-6 rounded border cursor-pointer p-0" />
                      <span className="text-[10px] text-muted-foreground">Stroke</span>
                      {ct.strokeColor && <button className="text-[10px] text-muted-foreground underline" onClick={() => updateTextStyle(selectedTextIdx, { strokeColor: "", strokeWidth: 0 })}>x</button>}
                    </div>
                  </div>

                  {/* Align */}
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as const).map((a) => (
                      <button key={a} className={`flex-1 py-1 rounded text-[10px] ${ct.textAlign === a ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                        onClick={() => updateTextStyle(selectedTextIdx, { textAlign: a })}>
                        {a.charAt(0).toUpperCase() + a.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Opacity / Line Height / Spacing */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10 shrink-0">Opacity</span>
                    <Slider value={[ct.opacity * 100]} onValueChange={([v]) => updateTextStyle(selectedTextIdx, { opacity: v / 100 })} min={10} max={100} step={5} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.round(ct.opacity * 100)}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10 shrink-0">Line H</span>
                    <Slider value={[ct.lineHeight * 10]} onValueChange={([v]) => updateTextStyle(selectedTextIdx, { lineHeight: v / 10 })} min={8} max={30} step={1} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{ct.lineHeight.toFixed(1)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10 shrink-0">Spacing</span>
                    <Slider value={[ct.charSpacing]} onValueChange={([v]) => updateTextStyle(selectedTextIdx, { charSpacing: v })} min={-100} max={800} step={10} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{ct.charSpacing}</span>
                  </div>

                  {ct.strokeColor && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-10 shrink-0">Stroke W</span>
                      <Slider value={[ct.strokeWidth]} onValueChange={([v]) => updateTextStyle(selectedTextIdx, { strokeWidth: v })} min={0} max={5} step={0.5} className="flex-1" />
                      <span className="text-[10px] text-muted-foreground w-7 text-right">{ct.strokeWidth}</span>
                    </div>
                  )}

                  {/* Shadow toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={ct.shadow} onChange={(e) => updateTextStyle(selectedTextIdx, { shadow: e.target.checked })} className="accent-primary" />
                    <span className="text-[10px] text-muted-foreground">Drop Shadow</span>
                  </label>
                </div>
              )}
            </div>

            {/* Logo */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Logo</Label>
                <input type="checkbox" checked={logoEnabled} onChange={(e) => toggleLogo(e.target.checked)} className="accent-primary" />
              </div>
              {logoEnabled && (
                <div className="space-y-1 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10 shrink-0">Scale</span>
                    <Slider value={[logoScale * 100]} onValueChange={([v]) => updateLogoScale(v / 100)} min={3} max={60} step={1} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.round(logoScale * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10 shrink-0">Opacity</span>
                    <Slider value={[logoOpacity * 100]} onValueChange={([v]) => updateLogoOpacity(v / 100)} min={10} max={100} step={5} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.round(logoOpacity * 100)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Save template inline */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-[10px] text-muted-foreground hover:text-foreground underline">Save as template...</button>
              </DialogTrigger>
              <DialogContent className="max-w-xs">
                <DialogHeader><DialogTitle className="text-sm">Save Template</DialogTitle></DialogHeader>
                <Input placeholder="Template name..." value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="h-8 text-xs" autoFocus />
                <DialogClose asChild>
                  <Button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="h-8 text-xs w-full">Save</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>

            </div>
          </TabsContent>

          {/* TEMPLATES */}
          <TabsContent value="templates" className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 mt-0 pt-2">
            <div className="flex gap-1.5">
              <Input placeholder="Name..." value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="h-8 text-xs" />
              <Button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="h-8 text-xs px-3 shrink-0">Save</Button>
            </div>

            {/* Import / Export all */}
            <div className="flex gap-1.5">
              <label className="flex-1">
                <div className="flex items-center justify-center gap-1 border border-dashed rounded h-7 cursor-pointer hover:border-primary transition-colors text-[10px] text-muted-foreground">
                  Import .json
                </div>
                <Input type="file" accept=".json" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    await importTemplatesFromJSON(f);
                    setTemplates(loadTemplates());
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Import failed");
                  }
                  e.target.value = "";
                }} />
              </label>
              {templates.length > 0 && (
                <Button variant="outline" className="h-7 text-[10px] px-2" onClick={exportAllTemplatesAsJSON}>
                  Export All
                </Button>
              )}
            </div>

            {templates.length === 0 && <p className="text-xs text-muted-foreground">No templates yet.</p>}
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between border rounded px-2 py-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.canvasWidth}x{t.canvasHeight}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-6 px-1 text-[10px]" onClick={() => exportTemplateAsJSON(t)} title="Share">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => handleApplyTemplate(t)}>Apply</Button>
                  <Button size="sm" variant="ghost" className="h-6 px-1 text-xs" onClick={() => handleDeleteTemplate(t.id)}>x</Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* BULK */}
          <TabsContent value="bulk" className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 mt-0 pt-2">
            <p className="text-xs text-muted-foreground">Upload photos, current layout applied to all, download as ZIP.</p>
            <Input type="file" accept="image/*" multiple className="h-8 text-xs"
              onChange={(e) => setBulkImages(Array.from(e.target.files || []))} />
            {bulkImages.length > 0 && <p className="text-xs">{bulkImages.length} photo{bulkImages.length > 1 ? "s" : ""}</p>}
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={bulkImages.length === 0} className="w-full h-8 text-xs">Generate ZIP</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Bulk Export</DialogTitle></DialogHeader>
                <p className="text-sm">Apply layout to {bulkImages.length} photo{bulkImages.length > 1 ? "s" : ""}?</p>
                <Button onClick={handleBulkExport} disabled={isBulkProcessing}>
                  {isBulkProcessing ? "Processing..." : "Generate"}
                </Button>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* DOWNLOAD - always visible at bottom */}
        <div className="shrink-0 border-t border-border p-3 space-y-1.5 bg-background">
          <Button onClick={() => exportImage("png")} className="w-full h-9 text-sm font-semibold gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Download PNG
          </Button>
          <Button onClick={() => exportImage("jpeg")} variant="outline" className="w-full h-7 text-xs">
            Download JPEG
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 overflow-auto p-2">
        <div ref={containerRef} className="max-w-full">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
