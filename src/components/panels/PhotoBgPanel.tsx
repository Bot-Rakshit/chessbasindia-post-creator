"use client";

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
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Photo & Background</Label>
      <div className="space-y-1.5 mt-1">
        <label className="flex items-center justify-center border border-dashed rounded h-8 cursor-pointer hover:border-primary transition-colors text-xs text-muted-foreground">
          {hasImage ? "Change Photo" : "Upload Photo"}
          <Input type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onImageUpload(f); }} />
        </label>

        {/* BG color / gradient */}
        <div className="flex items-center gap-1.5">
          <input type="color" value={bgColor}
            onChange={e => { setBgColor(e.target.value); if (bgGradient.enabled) setBgGradient(g => ({ ...g, color1: e.target.value })); }}
            className="w-6 h-6 rounded border cursor-pointer p-0" />
          {bgGradient.enabled && (
            <input type="color" value={bgGradient.color2}
              onChange={e => setBgGradient(g => ({ ...g, color2: e.target.value }))}
              className="w-6 h-6 rounded border cursor-pointer p-0" />
          )}
          <label className="flex items-center gap-1 cursor-pointer ml-auto">
            <span className="text-[10px] text-muted-foreground">Gradient</span>
            <input type="checkbox" checked={bgGradient.enabled}
              onChange={e => setBgGradient(g => ({ ...g, enabled: e.target.checked, color1: bgColor }))}
              className="accent-primary" />
          </label>
        </div>
        {bgGradient.enabled && (
          <div className="flex gap-1">
            {DIRS.map(d => (
              <button key={d} className={`flex-1 py-0.5 rounded text-[10px] ${bgGradient.direction === d ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                onClick={() => setBgGradient(g => ({ ...g, direction: d }))}>{d[0].toUpperCase() + d.slice(1)}</button>
            ))}
          </div>
        )}

        {/* Padding */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-10 shrink-0">Padding</span>
          <Slider value={[imagePadding]} onValueChange={([v]) => setImagePadding(v)} min={0} max={200} step={5} className="flex-1" />
          <span className="text-[10px] text-muted-foreground w-5 text-right">{imagePadding}</span>
        </div>

        {/* Dark Fade */}
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={fadeConfig.enabled}
              onChange={e => setFadeConfig(g => ({ ...g, enabled: e.target.checked }))}
              className="accent-primary" />
            <span className="text-[10px] text-muted-foreground">Dark Fade</span>
          </label>
          {fadeConfig.enabled && (
            <>
              <input type="color" value={fadeConfig.color}
                onChange={e => setFadeConfig(g => ({ ...g, color: e.target.value }))}
                className="w-5 h-5 rounded border cursor-pointer p-0" />
              <div className="flex gap-0.5 ml-auto">
                {DIRS.map(d => (
                  <button key={d} className={`px-1.5 py-0.5 rounded text-[9px] ${fadeConfig.direction === d ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    onClick={() => setFadeConfig(g => ({ ...g, direction: d }))}>{d[0].toUpperCase()}</button>
                ))}
              </div>
            </>
          )}
        </div>
        {fadeConfig.enabled && (
          <>
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
          </>
        )}

        {/* Vignette */}
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={vignetteConfig.enabled}
              onChange={e => setVignetteConfig(g => ({ ...g, enabled: e.target.checked }))}
              className="accent-primary" />
            <span className="text-[10px] text-muted-foreground">Vignette</span>
          </label>
          {vignetteConfig.enabled && (
            <input type="color" value={vignetteConfig.color}
              onChange={e => setVignetteConfig(g => ({ ...g, color: e.target.value }))}
              className="w-5 h-5 rounded border cursor-pointer p-0 ml-1" />
          )}
        </div>
        {vignetteConfig.enabled && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
