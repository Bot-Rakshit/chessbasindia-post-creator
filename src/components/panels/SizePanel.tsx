"use client";

import { Label } from "@/components/ui/label";
import { CANVAS_PRESETS } from "@/lib/types";

interface Props {
  canvasSize: { width: number; height: number };
  changeCanvasSize: (w: number, h: number) => void;
}

export default function SizePanel({ canvasSize, changeCanvasSize }: Props) {
  const active = CANVAS_PRESETS.find(p => p.width === canvasSize.width && p.height === canvasSize.height);

  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Size</Label>
      <div className="grid grid-cols-4 gap-1 mt-1">
        {CANVAS_PRESETS.map(p => (
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
