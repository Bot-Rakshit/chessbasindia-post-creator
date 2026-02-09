"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: ["\u2318", "Z"], desc: "Undo" },
  { keys: ["\u2318", "\u21e7", "Z"], desc: "Redo" },
  { keys: ["\u2318", "D"], desc: "Duplicate text layer" },
  { keys: ["\u2318", "E"], desc: "Export as PNG" },
  { keys: ["\u2318", "\u21e7", "E"], desc: "Export as JPEG" },
  { keys: ["Delete"], desc: "Remove selected layer" },
  { keys: ["Esc"], desc: "Deselect all" },
  { keys: ["\u2190\u2191\u2192\u2193"], desc: "Nudge selected (1px)" },
  { keys: ["\u21e7", "\u2190\u2191\u2192\u2193"], desc: "Nudge selected (10px)" },
  { keys: ["\u2318", "V"], desc: "Paste image from clipboard" },
  { keys: ["?"], desc: "Show this help" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div key={s.desc} className="flex items-center justify-between py-1 px-1">
              <span className="text-xs text-muted-foreground">{s.desc}</span>
              <div className="flex gap-0.5">
                {s.keys.map((k, i) => (
                  <kbd key={i} className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border font-mono">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Press <kbd className="px-1 py-0.5 bg-muted rounded border text-[9px] font-mono">?</kbd> anytime to show this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}
