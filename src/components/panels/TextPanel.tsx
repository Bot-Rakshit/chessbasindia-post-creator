"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TextConfig, TextGradient, GradientDirection, FONTS } from "@/lib/types";

interface Props {
  textCount: number;
  selectedIdx: number;
  ct: TextConfig | null;
  curTg: TextGradient | undefined;
  onSelectIdx: (i: number) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (idx: number, updates: Partial<TextConfig>) => void;
  onSetGradient: (idx: number, tg: TextGradient | undefined) => void;
}

const DIRS: GradientDirection[] = ["left", "right", "top", "bottom"];
const WEIGHTS = [
  { value: "normal", label: "Regular" },
  { value: "bold", label: "Bold" },
  { value: "100", label: "Thin" },
  { value: "300", label: "Light" },
  { value: "500", label: "Medium" },
  { value: "600", label: "SemiBold" },
  { value: "800", label: "ExtraBold" },
  { value: "900", label: "Black" },
];

export default function TextPanel({
  textCount, selectedIdx, ct, curTg,
  onSelectIdx, onAdd, onRemove, onUpdate, onSetGradient,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Text</Label>
        <div className="flex gap-2">
          {textCount > 1 && <button className="text-[10px] text-destructive hover:underline" onClick={() => onRemove(selectedIdx)}>Remove</button>}
          <button className="text-[10px] text-primary hover:underline" onClick={onAdd}>+ Add</button>
        </div>
      </div>

      {textCount > 1 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {Array.from({ length: textCount }, (_, i) => (
            <button key={i} className={`px-2 py-0.5 rounded text-[10px] ${selectedIdx === i ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              onClick={() => onSelectIdx(i)}>{i + 1}</button>
          ))}
        </div>
      )}

      {ct && (
        <div className="space-y-1.5 mt-1">
          <Input value={ct.content} onChange={e => onUpdate(selectedIdx, { content: e.target.value })} placeholder="Text..." className="h-7 text-xs" />

          {/* Font + Weight */}
          <div className="grid grid-cols-2 gap-1">
            <Select value={ct.fontFamily} onValueChange={v => onUpdate(selectedIdx, { fontFamily: v })}>
              <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {FONTS.map(f => <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={ct.fontWeight} onValueChange={v => onUpdate(selectedIdx, { fontWeight: v })}>
              <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEIGHTS.map(w => <SelectItem key={w.value} value={w.value} className="text-xs">{w.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-6 shrink-0">Size</span>
            <Slider value={[ct.fontSize]} onValueChange={([v]) => onUpdate(selectedIdx, { fontSize: v })} min={10} max={200} step={1} className="flex-1" />
            <span className="text-[10px] text-muted-foreground w-7 text-right">{ct.fontSize}</span>
          </div>

          {/* Style row: italic + transform */}
          <div className="flex gap-1">
            <button className={`px-2 py-1 rounded text-[10px] italic ${ct.fontStyle === "italic" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              onClick={() => onUpdate(selectedIdx, { fontStyle: ct.fontStyle === "italic" ? "normal" : "italic" })}>I</button>
            {(["none", "uppercase", "lowercase", "capitalize"] as const).map(t => (
              <button key={t} className={`flex-1 py-1 rounded text-[10px] ${ct.textTransform === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                onClick={() => onUpdate(selectedIdx, { textTransform: t })}>
                {t === "none" ? "Aa" : t === "uppercase" ? "AB" : t === "lowercase" ? "ab" : "Ab"}
              </button>
            ))}
          </div>

          {/* Colors */}
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex items-center gap-1">
              <input type="color" value={ct.fill}
                onChange={e => { onUpdate(selectedIdx, { fill: e.target.value }); if (curTg?.enabled) onSetGradient(selectedIdx, undefined); }}
                className="w-6 h-6 rounded border cursor-pointer p-0" />
              <span className="text-[10px] text-muted-foreground">Fill</span>
            </div>
            <div className="flex items-center gap-1">
              <input type="color" value={ct.backgroundColor || "#000000"}
                onChange={e => onUpdate(selectedIdx, { backgroundColor: e.target.value })}
                className="w-6 h-6 rounded border cursor-pointer p-0" />
              <span className="text-[10px] text-muted-foreground">BG</span>
              {ct.backgroundColor && <button className="text-[10px] text-muted-foreground underline" onClick={() => onUpdate(selectedIdx, { backgroundColor: "" })}>x</button>}
            </div>
            <div className="flex items-center gap-1">
              <input type="color" value={ct.strokeColor || "#000000"}
                onChange={e => onUpdate(selectedIdx, { strokeColor: e.target.value, strokeWidth: ct.strokeWidth || 1 })}
                className="w-6 h-6 rounded border cursor-pointer p-0" />
              <span className="text-[10px] text-muted-foreground">Stroke</span>
              {ct.strokeColor && <button className="text-[10px] text-muted-foreground underline" onClick={() => onUpdate(selectedIdx, { strokeColor: "", strokeWidth: 0 })}>x</button>}
            </div>
          </div>

          {/* Text gradient fill */}
          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={!!curTg?.enabled}
                onChange={e => {
                  if (e.target.checked) onSetGradient(selectedIdx, { enabled: true, color1: ct.fill || "#ffffff", color2: "#ff6600", direction: "right" });
                  else onSetGradient(selectedIdx, undefined);
                }} className="accent-primary" />
              <span className="text-[10px] text-muted-foreground">Gradient Fill</span>
            </label>
            {curTg?.enabled && (
              <>
                <input type="color" value={curTg.color1} onChange={e => onSetGradient(selectedIdx, { ...curTg, color1: e.target.value })} className="w-5 h-5 rounded border cursor-pointer p-0" />
                <input type="color" value={curTg.color2} onChange={e => onSetGradient(selectedIdx, { ...curTg, color2: e.target.value })} className="w-5 h-5 rounded border cursor-pointer p-0" />
                <div className="flex gap-0.5 ml-auto">
                  {DIRS.map(d => (
                    <button key={d} className={`px-1 py-0.5 rounded text-[9px] ${curTg.direction === d ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      onClick={() => onSetGradient(selectedIdx, { ...curTg, direction: d })}>{d[0].toUpperCase()}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Align */}
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map(a => (
              <button key={a} className={`flex-1 py-1 rounded text-[10px] ${ct.textAlign === a ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                onClick={() => onUpdate(selectedIdx, { textAlign: a })}>{a[0].toUpperCase() + a.slice(1)}</button>
            ))}
          </div>

          {/* Sliders */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">Opacity</span>
            <Slider value={[ct.opacity * 100]} onValueChange={([v]) => onUpdate(selectedIdx, { opacity: v / 100 })} min={10} max={100} step={5} className="flex-1" />
            <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.round(ct.opacity * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">Line H</span>
            <Slider value={[ct.lineHeight * 10]} onValueChange={([v]) => onUpdate(selectedIdx, { lineHeight: v / 10 })} min={8} max={30} step={1} className="flex-1" />
            <span className="text-[10px] text-muted-foreground w-7 text-right">{ct.lineHeight.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">Spacing</span>
            <Slider value={[ct.charSpacing]} onValueChange={([v]) => onUpdate(selectedIdx, { charSpacing: v })} min={-100} max={800} step={10} className="flex-1" />
            <span className="text-[10px] text-muted-foreground w-7 text-right">{ct.charSpacing}</span>
          </div>
          {ct.strokeColor && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-10 shrink-0">Stroke W</span>
              <Slider value={[ct.strokeWidth]} onValueChange={([v]) => onUpdate(selectedIdx, { strokeWidth: v })} min={0} max={5} step={0.5} className="flex-1" />
              <span className="text-[10px] text-muted-foreground w-7 text-right">{ct.strokeWidth}</span>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ct.shadow} onChange={e => onUpdate(selectedIdx, { shadow: e.target.checked })} className="accent-primary" />
            <span className="text-[10px] text-muted-foreground">Drop Shadow</span>
          </label>
        </div>
      )}
    </div>
  );
}
