"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  onBulkExport: (files: File[]) => Promise<void>;
}

export default function BulkPanel({ onBulkExport }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleExport = async () => {
    setProcessing(true);
    await onBulkExport(files);
    setProcessing(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Upload photos, current layout applied to all, download as ZIP.</p>
      <Input type="file" accept="image/*" multiple className="h-8 text-xs"
        onChange={e => setFiles(Array.from(e.target.files || []))} />
      {files.length > 0 && <p className="text-xs">{files.length} photo{files.length > 1 ? "s" : ""}</p>}
      <Dialog>
        <DialogTrigger asChild>
          <Button disabled={files.length === 0} className="w-full h-8 text-xs">Generate ZIP</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Export</DialogTitle></DialogHeader>
          <p className="text-sm">Apply layout to {files.length} photo{files.length > 1 ? "s" : ""}?</p>
          <Button onClick={handleExport} disabled={processing}>
            {processing ? "Processing..." : "Generate"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
