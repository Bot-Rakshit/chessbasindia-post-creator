"use client";

import { useEffect, useState, useCallback } from "react";
import * as fabric from "fabric";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Template, DEFAULT_FADE, DEFAULT_VIGNETTE } from "@/lib/types";
import { loadTemplates, saveTemplate, deleteTemplate } from "@/lib/templates";
import { useCanvas } from "@/hooks/use-canvas";
import { makeFadeRect, makeVignetteRect, makeTextbox, applyImagePadding } from "@/lib/canvas-engine";

import SizePanel from "./panels/SizePanel";
import PhotoBgPanel from "./panels/PhotoBgPanel";
import TextPanel from "./panels/TextPanel";
import LogoPanel from "./panels/LogoPanel";
import TemplatesPanel from "./panels/TemplatesPanel";
import BulkPanel from "./panels/BulkPanel";
import KeyboardShortcutsDialog from "./KeyboardShortcutsDialog";

export default function Editor() {
  const engine = useCanvas();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [activeTab, setActiveTab] = useState("design");
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => { setTemplates(loadTemplates()); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "?" && !isInput && !meta) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // Non-meta shortcuts (only when not in text input)
      if (!meta && !isInput) {
        // Delete / Backspace – remove selected text layer
        if (e.key === "Delete" || e.key === "Backspace") {
          const canvas = engine.fabricRef.current;
          const active = canvas?.getActiveObject();
          if (active && !(active as fabric.Textbox).isEditing) {
            e.preventDefault();
            const idx = engine.textObjectsRef.current.indexOf(active as fabric.Textbox);
            if (idx >= 0) engine.removeTextLayer(idx);
          }
          return;
        }
        // Escape – deselect all
        if (e.key === "Escape") {
          e.preventDefault();
          engine.deselectAll();
          return;
        }
        // Arrow keys – nudge selected object (1px, or 10px with Shift)
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          const canvas = engine.fabricRef.current;
          const active = canvas?.getActiveObject();
          if (active && !(active as fabric.Textbox).isEditing) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
            const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
            engine.nudgeSelected(dx, dy);
          }
          return;
        }
      }

      if (!meta) return;
      if (e.key === "z" || e.key === "Z") {
        if (isInput) return;
        e.preventDefault();
        if (e.shiftKey) engine.redo(); else engine.undo();
        return;
      }
      if (e.key === "d") {
        if (isInput) return;
        e.preventDefault();
        engine.duplicateTextLayer();
        return;
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        engine.exportImage(e.shiftKey ? "jpeg" : "png");
        return;
      }
    };

    const pasteHandler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) engine.handleImageUpload(file);
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    window.addEventListener("paste", pasteHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("paste", pasteHandler);
    };
  }, [engine]);

  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim()) return;
    saveTemplate({
      id: Date.now().toString(), name: templateName,
      textConfigs: engine.readTextConfigs(), logoConfig: engine.readLogoConfig(),
      fadeConfig: { ...engine.fadeConfig },
      vignetteConfig: { ...engine.vignetteConfig },
      bgGradientConfig: { ...engine.bgGradient },
      canvasWidth: engine.canvasSize.width, canvasHeight: engine.canvasSize.height,
      bgColor: engine.bgColor, imagePadding: engine.imagePadding,
    });
    setTemplates(loadTemplates()); setTemplateName("");
  }, [templateName, engine]);

  const handleDeleteTemplate = useCallback((id: string) => {
    deleteTemplate(id); setTemplates(loadTemplates());
  }, []);

  const handleBulkExport = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const txts = engine.readTextConfigs();
    const logo = engine.readLogoConfig();
    const zip = new JSZip();
    const off = document.createElement("canvas");
    off.width = engine.canvasSize.width; off.height = engine.canvasSize.height;
    const oc = new fabric.Canvas(off, {
      width: engine.canvasSize.width, height: engine.canvasSize.height,
      backgroundColor: engine.bgColor,
    });

    const readFile = (f: File): Promise<string> =>
      new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target?.result as string); fr.readAsDataURL(f); });

    for (let i = 0; i < files.length; i++) {
      const url = await readFile(files[i]);
      const img = await fabric.FabricImage.fromURL(url);
      oc.clear(); oc.backgroundColor = engine.bgColor;
      applyImagePadding(img, engine.canvasSize.width, engine.canvasSize.height, engine.imagePadding);
      oc.add(img);
      if (engine.fadeConfig.enabled) oc.add(makeFadeRect(engine.fadeConfig, engine.canvasSize.width, engine.canvasSize.height));
      if (engine.vignetteConfig.enabled) oc.add(makeVignetteRect(engine.vignetteConfig, engine.canvasSize.width, engine.canvasSize.height));
      for (const tc of txts) oc.add(makeTextbox(tc));
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
  }, [engine]);

  const ct = engine.getSelectedText();
  const curTg = engine.textGradients[engine.selectedTextIdx];
  const hasImage = !!engine.imageFileRef.current;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <div className="w-[320px] shrink-0 border-r border-border flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/chessbase-logo.svg" alt="CB" className="h-6" />
          <span className="font-semibold text-sm">Post Creator</span>
          <div className="ml-auto flex items-center gap-0.5">
            <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" onClick={engine.undo} title="Undo (Cmd+Z)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
            </button>
            <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" onClick={engine.redo} title="Redo (Cmd+Shift+Z)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
            </button>
            <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (?)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10"/></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-3 mt-2 w-auto shrink-0">
            <TabsTrigger value="design" className="flex-1 text-xs">Design</TabsTrigger>
            <TabsTrigger value="templates" className="flex-1 text-xs">Templates</TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1 text-xs">Bulk</TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="flex-1 overflow-y-auto px-3 pb-4 mt-0 pt-3">
            <div className="space-y-4">
              <SizePanel canvasSize={engine.canvasSize} changeCanvasSize={engine.changeCanvasSize} />

              <div className="h-px bg-border" />

              <PhotoBgPanel
                hasImage={hasImage}
                bgColor={engine.bgColor} setBgColor={engine.setBgColor}
                imagePadding={engine.imagePadding} setImagePadding={engine.setImagePadding}
                fadeConfig={engine.fadeConfig} setFadeConfig={engine.setFadeConfig}
                vignetteConfig={engine.vignetteConfig} setVignetteConfig={engine.setVignetteConfig}
                bgGradient={engine.bgGradient} setBgGradient={engine.setBgGradient}
                onImageUpload={engine.handleImageUpload}
              />

              <div className="h-px bg-border" />

              <TextPanel
                textCount={engine.textObjectsRef.current.length}
                selectedIdx={engine.selectedTextIdx}
                ct={ct}
                curTg={curTg}
                textConfigs={engine.textConfigsRef.current}
                onSelectIdx={engine.selectTextObject}
                onAdd={engine.addTextLayer}
                onRemove={engine.removeTextLayer}
                onUpdate={engine.updateTextStyle}
                onSetGradient={engine.setTextGradient}
                onDuplicate={engine.duplicateTextLayer}
                onApplyPreset={(preset) => engine.updateTextStyle(engine.selectedTextIdx, preset)}
                onAlign={engine.alignTextToCanvas}
                onSelectionColor={engine.setSelectionColor}
              />

              <div className="h-px bg-border" />

              <LogoPanel
                logoEnabled={engine.logoEnabled}
                logoScale={engine.getLogoScale()}
                logoOpacity={engine.getLogoOpacity()}
                onToggle={engine.toggleLogo}
                onScale={engine.updateLogoScale}
                onOpacity={engine.updateLogoOpacity}
              />

              <div className="h-px bg-border" />

              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-[11px] text-muted-foreground hover:text-foreground underline">Save as template...</button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader><DialogTitle className="text-sm">Save Template</DialogTitle></DialogHeader>
                  <Input placeholder="Template name..." value={templateName} onChange={e => setTemplateName(e.target.value)} className="h-8 text-xs" autoFocus />
                  <DialogClose asChild>
                    <Button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="h-8 text-xs w-full">Save</Button>
                  </DialogClose>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-y-auto px-3 pb-4 mt-0 pt-3">
            <TemplatesPanel
              templates={templates}
              templateName={templateName}
              setTemplateName={setTemplateName}
              onSave={handleSaveTemplate}
              onApply={engine.applyTemplate}
              onDelete={handleDeleteTemplate}
              onRefresh={() => setTemplates(loadTemplates())}
            />
          </TabsContent>

          <TabsContent value="bulk" className="flex-1 overflow-y-auto px-3 pb-4 mt-0 pt-3">
            <BulkPanel onBulkExport={handleBulkExport} />
          </TabsContent>
        </Tabs>

        {/* Export buttons */}
        <div className="shrink-0 border-t border-border p-3 flex gap-2 bg-background">
          <Button onClick={() => engine.exportImage("png")} className="flex-1 h-9 text-sm font-semibold gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            PNG
          </Button>
          <Button onClick={() => engine.exportImage("jpeg")} variant="outline" className="h-9 px-4 text-sm">JPEG</Button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 overflow-auto p-4">
        <div ref={engine.containerRef} className="max-w-full">
          <canvas ref={engine.canvasRef} />
        </div>
      </div>

      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  );
}
