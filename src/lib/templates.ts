import { Template } from "./types";

const STORAGE_KEY = "chessbase-templates";

export function loadTemplates(): Template[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveTemplate(template: Template): void {
  const templates = loadTemplates();
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function deleteTemplate(id: string): void {
  const templates = loadTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function exportTemplateAsJSON(template: Template): void {
  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${template.name.replace(/[^a-zA-Z0-9-_ ]/g, "")}.cbtemplate.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportAllTemplatesAsJSON(): void {
  const templates = loadTemplates();
  if (templates.length === 0) return;
  const json = JSON.stringify(templates, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "chessbase-templates.json";
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function importTemplatesFromJSON(file: File): Promise<Template[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const arr: Template[] = Array.isArray(parsed) ? parsed : [parsed];
        // Validate minimal shape
        const valid = arr.filter(
          (t) => t && t.textConfigs && t.canvasWidth && t.canvasHeight
        );
        if (valid.length === 0) {
          reject(new Error("No valid templates found in file"));
          return;
        }
        // Assign new IDs to avoid collisions
        const imported = valid.map((t) => ({
          ...t,
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        }));
        // Merge into storage
        const existing = loadTemplates();
        const merged = [...existing, ...imported];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        resolve(imported);
      } catch {
        reject(new Error("Invalid template file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
