"use client";

import { Label } from "@/components/ui/label";
import { CANVAS_PRESETS } from "@/lib/types";

const EXTRA_PRESETS = [
  { label: "YouTube", short: "YT", width: 1280, height: 720 },
];
const ALL_PRESETS = [...CANVAS_PRESETS, ...EXTRA_PRESETS];

interface Props {
  canvasSize: { width: number; height: number };
  changeCanvasSize: (w: number, h: number) => void;
}

export default function SizePanel({ canvasSize, changeCanvasSize }: Props) {
  const active = ALL_PRESETS.find(p => p.width === canvasSize.width && p.height === canvasSize.height);

  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Size</Label>
      <div className="grid grid-cols-5 gap-1 mt-1">
        {ALL_PRESETS.map(p => (
          <button key={p.label}
            className={`py-1.5 rounded text-xs font-medium transition-colors ${active?.label === p.label ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
            onClick={() => changeCanvasSize(p.width, p.height)}>
            {p.short}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">{canvasSize.width} x {canvasSize.height}</p>
    </div>
  );
}
