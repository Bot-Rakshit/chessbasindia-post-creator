"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Props {
  logoEnabled: boolean;
  logoScale: number;
  logoOpacity: number;
  onToggle: (enabled: boolean) => void;
  onScale: (s: number) => void;
  onOpacity: (o: number) => void;
}

export default function LogoPanel({ logoEnabled, logoScale, logoOpacity, onToggle, onScale, onOpacity }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Logo</Label>
        <input type="checkbox" checked={logoEnabled} onChange={e => onToggle(e.target.checked)} className="accent-primary" />
      </div>
      {logoEnabled && (
        <div className="space-y-1 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">Scale</span>
            <Slider value={[logoScale * 100]} onValueChange={([v]) => onScale(v / 100)} min={3} max={60} step={1} className="flex-1" />
            <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.round(logoScale * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-10 shrink-0">Opacity</span>
            <Slider value={[logoOpacity * 100]} onValueChange={([v]) => onOpacity(v / 100)} min={10} max={100} step={5} className="flex-1" />
            <span className="text-[10px] text-muted-foreground w-7 text-right">{Math.round(logoOpacity * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
