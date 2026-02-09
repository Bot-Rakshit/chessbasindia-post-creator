"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { FadeConfig, VignetteConfig, BgGradientConfig, GradientDirection } from "@/lib/types";

interface Props {
  hasImage: boolean;
  bgColor: string;
  setBgColor: (c: string) => void;
  imagePadding: number;
  setImagePadding: (v: number) => void;
  fadeConfig: FadeConfig;
  setFadeConfig: (fn: (prev: FadeConfig) => FadeConfig) => void;
  vignetteConfig: VignetteConfig;
  setVignetteConfig: (fn: (prev: VignetteConfig) => VignetteConfig) => void;
  bgGradient: BgGradientConfig;
  setBgGradient: (fn: (prev: BgGradientConfig) => BgGradientConfig) => void;
  onImageUpload: (file: File) => void;
}

const DIRS: GradientDirection[] = ["bottom", "top", "left", "right"];

export default function PhotoBgPanel({
  hasImage, bgColor, setBgColor, imagePadding, setImagePadding,
  fadeConfig, setFadeConfig, vignetteConfig, setVignetteConfig,
  bgGradient, setBgGradient, onImageUpload,
}: Props) {
  const [showEffects, setShowEffects] = useState(false);

  const activeEffects = [
    fadeConfig.enabled && "Fade",
    vignetteConfig.enabled && "Vignette",
    bgGradient.enabled && "Gradient",
  ].filter(Boolean);

  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Photo & Background</Label>
      <div className="space-y-2 mt-1.5">
        {/* Upload */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-16 cursor-pointer hover:border-primary hover:bg-muted/50 transition-all text-xs text-muted-foreground gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          {hasImage ? "Change Photo" : "Upload Photo"}
          <Input type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onImageUpload(f); }} />
        </label>

        {/* Background color */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-12 shrink-0">BG Color</span>
          <input type="color" value={bgColor}
            onChange={e => { setBgColor(e.target.value); if (bgGradient.enabled) setBgGradient(g => ({ ...g, color1: e.target.value })); }}
            className="w-6 h-6 rounded border cursor-pointer p-0" />
        </div>

        {/* Padding */}
        {hasImage && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-12 shrink-0">Padding</span>
            <Slider value={[imagePadding]} onValueChange={([v]) => setImagePadding(v)} min={0} max={200} step={5} className="flex-1" />
            <span className="text-[10px] text-muted-foreground w-5 text-right">{imagePadding}</span>
          </div>
        )}

        {/* Effects toggle */}
        <button
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 w-full"
          onClick={() => setShowEffects(!showEffects)}
        >
          <span className={`transition-transform text-[8px] ${showEffects ? 'rotate-90' : ''}`}>&#x25B6;</span>
          Effects
          {activeEffects.length > 0 && (
            <span className="text-[9px] text-primary ml-auto">{activeEffects.join(", ")}</span>
          )}
        </button>

        {showEffects && (
          <div className="space-y-2 pl-2 border-l border-border">
            {/* Dark Fade */}
            <div>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={fadeConfig.enabled}
                  onChange={e => setFadeConfig(g => ({ ...g, enabled: e.target.checked }))}
                  className="accent-primary" />
                <span className="text-[10px] text-muted-foreground">Dark Fade</span>
                {fadeConfig.enabled && (
                  <input type="color" value={fadeConfig.color}
                    onChange={e => setFadeConfig(g => ({ ...g, color: e.target.value }))}
                    className="w-4 h-4 rounded border cursor-pointer p-0 ml-auto" />
                )}
              </label>
              {fadeConfig.enabled && (
                <div className="space-y-1 mt-1">
                  <div className="flex gap-0.5">
                    {DIRS.map(d => (
                      <button key={d} className={`flex-1 py-0.5 rounded text-[9px] ${fadeConfig.direction === d ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                        onClick={() => setFadeConfig(g => ({ ...g, direction: d }))}>{d[0].toUpperCase() + d.slice(1)}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-12 shrink-0">Strength</span>
                    <Slider value={[fadeConfig.opacity * 100]} onValueChange={([v]) => setFadeConfig(g => ({ ...g, opacity: v / 100 }))} min={10} max={100} step={5} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.round(fadeConfig.opacity * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-12 shrink-0">Size</span>
                    <Slider value={[fadeConfig.coverage]} onValueChange={([v]) => setFadeConfig(g => ({ ...g, coverage: v }))} min={10} max={100} step={5} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{fadeConfig.coverage}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Vignette */}
            <div>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={vignetteConfig.enabled}
                  onChange={e => setVignetteConfig(g => ({ ...g, enabled: e.target.checked }))}
                  className="accent-primary" />
                <span className="text-[10px] text-muted-foreground">Vignette</span>
                {vignetteConfig.enabled && (
                  <input type="color" value={vignetteConfig.color}
                    onChange={e => setVignetteConfig(g => ({ ...g, color: e.target.value }))}
                    className="w-4 h-4 rounded border cursor-pointer p-0 ml-auto" />
                )}
              </label>
              {vignetteConfig.enabled && (
                <div className="space-y-1 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-12 shrink-0">Strength</span>
                    <Slider value={[vignetteConfig.strength * 100]} onValueChange={([v]) => setVignetteConfig(g => ({ ...g, strength: v / 100 }))} min={10} max={100} step={5} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.round(vignetteConfig.strength * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-12 shrink-0">Size</span>
                    <Slider value={[vignetteConfig.size]} onValueChange={([v]) => setVignetteConfig(g => ({ ...g, size: v }))} min={20} max={100} step={5} className="flex-1" />
                    <span className="text-[10px] text-muted-foreground w-7 text-right">{vignetteConfig.size}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* BG Gradient */}
            <div>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={bgGradient.enabled}
                  onChange={e => setBgGradient(g => ({ ...g, enabled: e.target.checked, color1: bgColor }))}
                  className="accent-primary" />
                <span className="text-[10px] text-muted-foreground">BG Gradient</span>
                {bgGradient.enabled && (
                  <input type="color" value={bgGradient.color2}
                    onChange={e => setBgGradient(g => ({ ...g, color2: e.target.value }))}
                    className="w-4 h-4 rounded border cursor-pointer p-0 ml-auto" />
                )}
              </label>
              {bgGradient.enabled && (
                <div className="flex gap-0.5 mt-1">
                  {DIRS.map(d => (
                    <button key={d} className={`flex-1 py-0.5 rounded text-[9px] ${bgGradient.direction === d ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      onClick={() => setBgGradient(g => ({ ...g, direction: d }))}>{d[0].toUpperCase() + d.slice(1)}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
