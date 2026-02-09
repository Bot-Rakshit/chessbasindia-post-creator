"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Template } from "@/lib/types";
import { exportTemplateAsJSON, exportAllTemplatesAsJSON, importTemplatesFromJSON, loadTemplates } from "@/lib/templates";

interface Props {
  templates: Template[];
  templateName: string;
  setTemplateName: (n: string) => void;
  onSave: () => void;
  onApply: (t: Template) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function TemplatesPanel({ templates, templateName, setTemplateName, onSave, onApply, onDelete, onRefresh }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <Input placeholder="Name..." value={templateName} onChange={e => setTemplateName(e.target.value)} className="h-8 text-xs" />
        <Button onClick={onSave} disabled={!templateName.trim()} className="h-8 text-xs px-3 shrink-0">Save</Button>
      </div>
      <div className="flex gap-1.5">
        <label className="flex-1">
          <div className="flex items-center justify-center border border-dashed rounded h-7 cursor-pointer hover:border-primary transition-colors text-[10px] text-muted-foreground">Import .json</div>
          <Input type="file" accept=".json" className="hidden" onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return;
            try { await importTemplatesFromJSON(f); onRefresh(); } catch (err) { alert(err instanceof Error ? err.message : "Import failed"); }
            e.target.value = "";
          }} />
        </label>
        {templates.length > 0 && <Button variant="outline" className="h-7 text-[10px] px-2" onClick={exportAllTemplatesAsJSON}>Export All</Button>}
      </div>
      {templates.length === 0 && <p className="text-xs text-muted-foreground">No templates yet.</p>}
      {templates.map(t => (
        <div key={t.id} className="flex items-center justify-between border rounded px-2 py-1.5">
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{t.name}</p>
            <p className="text-[10px] text-muted-foreground">{t.canvasWidth}x{t.canvasHeight}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => exportTemplateAsJSON(t)} title="Export">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </Button>
            <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => onApply(t)}>Apply</Button>
            <Button size="sm" variant="ghost" className="h-6 px-1 text-xs" onClick={() => onDelete(t.id)}>x</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
