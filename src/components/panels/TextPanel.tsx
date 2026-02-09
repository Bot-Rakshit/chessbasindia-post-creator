"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TextConfig, TextGradient, GradientDirection, FONTS, TEXT_PRESETS } from "@/lib/types";

interface Props {
  textCount: number;
  selectedIdx: number;
  ct: TextConfig | null;
  curTg: TextGradient | undefined;
  textConfigs: TextConfig[];
  onSelectIdx: (i: number) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (idx: number, updates: Partial<TextConfig>) => void;
  onSetGradient: (idx: number, tg: TextGradient | undefined) => void;
  onDuplicate?: () => void;
  onApplyPreset?: (preset: Partial<TextConfig>) => void;
  onAlign?: (alignment: string) => void;
}

const DIRS: GradientDirection[] = ["left", "right", "top", "bottom"];
const WEIGHTS = [
  { value: "normal", label: "Regular" },
  { value: "bold", label: "Bold" },
  { value: "300", label: "Light" },
  { value: "500", label: "Medium" },
  { value: "600", label: "SemiBold" },
  { value: "800", label: "ExtraBold" },
  { value: "900", label: "Black" },
];

export default function TextPanel({
  textCount, selectedIdx, ct, curTg, textConfigs,
  onSelectIdx, onAdd, onRemove, onUpdate, onSetGradient,
  onDuplicate, onApplyPreset, onAlign,
}: Props) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Text</Label>
        <div className="flex gap-2">
          {textCount > 1 && <button className="text-[10px] text-destructive hover:underline" onClick={() => onRemove(selectedIdx)}>Remove</button>}
          {onDuplicate && <button className="text-[10px] text-muted-foreground hover:underline" onClick={onDuplicate}>Clone</button>}
          <button className="text-[10px] text-primary hover:underline" onClick={onAdd}>+ Add</button>
        </div>
      </div>

      {/* Layer tabs */}
      {textCount > 1 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {Array.from({ length: textCount }, (_, i) => {
            const preview = textConfigs[i]?.content?.slice(0, 12) || `Layer ${i+1}`;
            return (
              <button key={i} className={`px-2 py-1 rounded text-[10px] truncate max-w-[100px] ${selectedIdx === i ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                onClick={() => onSelectIdx(i)} title={textConfigs[i]?.content}>
                {i + 1}. {preview}{preview.length >= 12 ? '...' : ''}
              </button>
            );
          })}
        </div>
      )}

      {/* Style presets */}
      {onApplyPreset && (
        <div className="flex gap-1 flex-wrap mt-1.5">
          {TEXT_PRESETS.map(p => (
            <button key={p.name}
              className="px-2 py-0.5 rounded-full text-[9px] bg-muted hover:bg-accent transition-colors border border-transparent hover:border-border"
              onClick={() => onApplyPreset(p.config)}
              title={`Apply ${p.name} style`}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      {ct && (
        <div className="space-y-1.5 mt-1.5">
          {/* Text input */}
          <Input value={ct.content} onChange={e => onUpdate(selectedIdx, { content: e.target.value })} placeholder="Text..." className="h-7 text-xs" />

          {/* Font + Size on one row */}
          <div className="grid grid-cols-[1fr_64px] gap-1">
            <Select value={ct.fontFamily} onValueChange={v => onUpdate(selectedIdx, { fontFamily: v })}>
              <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {FONTS.map(f => <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" value={ct.fontSize} onChange={e => onUpdate(selectedIdx, { fontSize: Number(e.target.value) || 10 })}
              className="h-7 text-[11px] text-center px-1" min={10} max={300} />
          </div>

          {/* Color + Text align */}
          <div className="flex items-center gap-1.5">
            <input type="color" value={ct.fill}
              onChange={e => { onUpdate(selectedIdx, { fill: e.target.value }); if (curTg?.enabled) onSetGradient(selectedIdx, undefined); }}
              className="w-6 h-6 rounded border cursor-pointer p-0" title="Text color" />
            <div className="flex gap-0.5 flex-1">
              {(["left", "center", "right"] as const).map(a => (
                <button key={a} className={`flex-1 py-1 rounded text-[10px] ${ct.textAlign === a ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  onClick={() => onUpdate(selectedIdx, { textAlign: a })}>{a[0].toUpperCase() + a.slice(1)}</button>
              ))}
            </div>
          </div>

          {/* More options (collapsible) */}
          <button className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 w-full" onClick={() => setShowMore(!showMore)}>
            <span className={`transition-transform text-[8px] ${showMore ? 'rotate-90' : ''}`}>&#x25B6;</span>
            More options
          </button>
          {showMore && (
            <div className="space-y-1.5 pl-2 border-l border-border">
              {/* Weight */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-12 shrink-0">Weight</span>
                <Select value={ct.fontWeight} onValueChange={v => onUpdate(selectedIdx, { fontWeight: v })}>
                  <SelectTrigger className="h-6 text-[10px] flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEIGHTS.map(w => <SelectItem key={w.value} value={w.value} className="text-xs">{w.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Italic + Transform */}
              <div className="flex gap-0.5">
                <button className={`px-2 py-1 rounded text-[10px] italic ${ct.fontStyle === "italic" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  onClick={() => onUpdate(selectedIdx, { fontStyle: ct.fontStyle === "italic" ? "normal" : "italic" })}>I</button>
                {(["none", "uppercase", "lowercase", "capitalize"] as const).map(t => (
                  <button key={t} className={`flex-1 py-1 rounded text-[10px] ${ct.textTransform === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    onClick={() => onUpdate(selectedIdx, { textTransform: t })}>
                    {t === "none" ? "Aa" : t === "uppercase" ? "AB" : t === "lowercase" ? "ab" : "Ab"}
                  </button>
                ))}
              </div>

              {/* Stroke + BG color */}
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-1">
                  <input type="color" value={ct.backgroundColor || "#000000"}
                    onChange={e => onUpdate(selectedIdx, { backgroundColor: e.target.value })}
                    className="w-5 h-5 rounded border cursor-pointer p-0" />
                  <span className="text-[10px] text-muted-foreground">BG</span>
                  {ct.backgroundColor && <button className="text-[10px] text-muted-foreground" onClick={() => onUpdate(selectedIdx, { backgroundColor: "" })}>x</button>}
                </div>
                <div className="flex items-center gap-1">
                  <input type="color" value={ct.strokeColor || "#000000"}
                    onChange={e => onUpdate(selectedIdx, { strokeColor: e.target.value, strokeWidth: ct.strokeWidth || 1 })}
                    className="w-5 h-5 rounded border cursor-pointer p-0" />
                  <span className="text-[10px] text-muted-foreground">Stroke</span>
                  {ct.strokeColor && <button className="text-[10px] text-muted-foreground" onClick={() => onUpdate(selectedIdx, { strokeColor: "", strokeWidth: 0 })}>x</button>}
                </div>
              </div>

              {/* Text gradient fill */}
              <div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={!!curTg?.enabled}
                    onChange={e => {
                      if (e.target.checked) onSetGradient(selectedIdx, { enabled: true, color1: ct.fill || "#ffffff", color2: "#ff6600", direction: "right" });
                      else onSetGradient(selectedIdx, undefined);
                    }} className="accent-primary" />
                  <span className="text-[10px] text-muted-foreground">Gradient Fill</span>
                  {curTg?.enabled && (
                    <>
                      <input type="color" value={curTg.color1} onChange={e => onSetGradient(selectedIdx, { ...curTg, color1: e.target.value })} className="w-4 h-4 rounded border cursor-pointer p-0 ml-auto" />
                      <input type="color" value={curTg.color2} onChange={e => onSetGradient(selectedIdx, { ...curTg, color2: e.target.value })} className="w-4 h-4 rounded border cursor-pointer p-0" />
                    </>
                  )}
                </label>
                {curTg?.enabled && (
                  <div className="flex gap-0.5 mt-1">
                    {DIRS.map(d => (
                      <button key={d} className={`flex-1 py-0.5 rounded text-[9px] ${curTg.direction === d ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                        onClick={() => onSetGradient(selectedIdx, { ...curTg, direction: d })}>{d[0].toUpperCase() + d.slice(1)}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stroke width (if stroke active) */}
              {ct.strokeColor && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12 shrink-0">Stroke W</span>
                  <Slider value={[ct.strokeWidth]} onValueChange={([v]) => onUpdate(selectedIdx, { strokeWidth: v })} min={0} max={5} step={0.5} className="flex-1" />
                  <span className="text-[10px] text-muted-foreground w-5 text-right">{ct.strokeWidth}</span>
                </div>
              )}

              {/* Opacity */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-12 shrink-0">Opacity</span>
                <Slider value={[ct.opacity * 100]} onValueChange={([v]) => onUpdate(selectedIdx, { opacity: v / 100 })} min={10} max={100} step={5} className="flex-1" />
                <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.round(ct.opacity * 100)}%</span>
              </div>

              {/* Line Height */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-12 shrink-0">Line H</span>
                <Slider value={[ct.lineHeight * 10]} onValueChange={([v]) => onUpdate(selectedIdx, { lineHeight: v / 10 })} min={8} max={30} step={1} className="flex-1" />
                <span className="text-[10px] text-muted-foreground w-7 text-right">{ct.lineHeight.toFixed(1)}</span>
              </div>

              {/* Char Spacing */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-12 shrink-0">Spacing</span>
                <Slider value={[ct.charSpacing]} onValueChange={([v]) => onUpdate(selectedIdx, { charSpacing: v })} min={-100} max={800} step={10} className="flex-1" />
                <span className="text-[10px] text-muted-foreground w-7 text-right">{ct.charSpacing}</span>
              </div>

              {/* Shadow */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ct.shadow} onChange={e => onUpdate(selectedIdx, { shadow: e.target.checked })} className="accent-primary" />
                <span className="text-[10px] text-muted-foreground">Drop Shadow</span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
