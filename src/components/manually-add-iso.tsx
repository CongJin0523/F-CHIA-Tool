import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import React from "react";
import { LINK_WHITELIST, type ResultItem } from "@/common/iso-match-tool"; 

type IsoMatch = ResultItem;

const uniqIso = (list: IsoMatch[]) => {
  const m = new Map<string, IsoMatch>();
  for (const it of list) m.set(`${it.iso_number}::${it.title}`, it);
  return Array.from(m.values());
};

const isWL = (url: string) => {
  try {
    const u = new URL(url);
    return LINK_WHITELIST.some(d => u.hostname === d || u.hostname.endsWith(`.${d}`));
  } catch { return false; }
};

export default function AddIsoDialog({
  trigger,
  onAdd,
}: {
  trigger: React.ReactNode;
  onAdd: (item: IsoMatch) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [iso, setIso] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [linksRaw, setLinksRaw] = React.useState("");
  const [error, setError] = React.useState("");
  const [warning, setWarning] = React.useState("");

  const handleConfirm = () => {
    setError("");
    setWarning("");

    // basic required fields
    if (!iso.trim() || !title.trim()) {
      setError("ISO number and Title are required.");
      return;
    }

    // links are OPTIONAL now
    const rawList = linksRaw
      .split(/[\n,;]/)
      .map(s => s.trim())
      .filter(Boolean);

    const whitelisted = rawList.filter(isWL);

    if (rawList.length > 0) {
      if (whitelisted.length === 0) {
        // Non-blocking warning if all links are filtered out
        setWarning(
          "No link passed the whitelist (iso.org / webstore.iec.ch / BSI / ANSI / Techstreet / DIN / SIS). The item will be saved without links."
        );
      } else if (whitelisted.length < rawList.length) {
        // Some links filtered
        setWarning(
          "Some links were removed because they are not in the whitelist."
        );
      }
    }

    onAdd({
      iso_number: iso.trim(),
      title: title.trim(),
      reason: reason.trim() || "(Manual add)",
      links: whitelisted, // may be []
    });

    setOpen(false);
    // reset
    setIso(""); setTitle(""); setReason(""); setLinksRaw("");
  };

  const canSave = Boolean(iso.trim() && title.trim());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Standard Manually</DialogTitle>
          <DialogDescription>
            Add an ISO/IEC entry manually. Links are optional; if provided, non-whitelisted links will be ignored.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 w-full max-w-[600px] mx-auto">
          <div>
            <Label>Reference Number</Label>
            <Input
              value={iso}
              onChange={e => setIso(e.target.value)}
              placeholder="e.g., ISO 10218-1:2025"
              className="w-full"
            />
          </div>

          <div>
            <Label>Title</Label>
            <Textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Standard title"
              className="resize-none w-full"
            />
          </div>

          <div>
            <Label>Reason (optional)</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Why does this standard match the requirement?"
              className="resize-none w-full"
            />
          </div>

          <div >
            <Label>Links (optional; comma/semicolon/newline separated)</Label>
            <Textarea
              rows={3}
              value={linksRaw}
              onChange={e => setLinksRaw(e.target.value)}
              placeholder="https://www.iso.org/standard/..., https://webstore.iec.ch/en/publication/..."
              className="resize-none w-full"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {warning && !error && <div className="text-sm text-amber-600">{warning}</div>}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!canSave}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function EditIsoDialog({
  trigger,
  value,
  onSave,
}: {
  trigger: React.ReactNode;
  value: IsoMatch;
  onSave: (item: IsoMatch) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState(value.reason || "");
  const [linksRaw, setLinksRaw] = React.useState((value.links || []).join("\n"));
  const [warning, setWarning] = React.useState("");
  const [error, setError] = React.useState("");

  // 打开时，同步当前记录内容
  React.useEffect(() => {
    if (!open) return;
    setReason(value.reason || "");
    setLinksRaw((value.links || []).join("\n"));
    setWarning("");
    setError("");
  }, [open, value]);

  const handleSave = () => {
    setWarning("");
    setError("");

    const rawList = linksRaw
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const whitelisted = rawList.filter(isWL);

    if (rawList.length > 0) {
      if (whitelisted.length === 0) {
        setWarning(
          "No link passed the whitelist (iso.org / webstore.iec.ch / BSI / ANSI / Techstreet / DIN / SIS). The item will be saved without links."
        );
      } else if (whitelisted.length < rawList.length) {
        setWarning(
          "Some links were removed because they are not in the whitelist."
        );
      }
    }

    onSave({
      ...value,
      reason: reason.trim() || value.reason || "(Manual edit)",
      links: whitelisted,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>View / Edit Standard</DialogTitle>
          <DialogDescription>
            You can review this ISO/IEC entry and update the rationale or links.
            The reference number and title are fixed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 w-full max-w-[600px] mx-auto">
          <div>
            <Label>Reference Number</Label>
            <Input
              value={value.iso_number}
              disabled
              readOnly
              className="bg-muted cursor-not-allowed"
            />
          </div>

          <div>
            <Label>Title</Label>
            <Textarea
              value={value.title}
              disabled
              readOnly
              className="bg-muted cursor-not-allowed resize-none w-full"
            />
          </div>

          <div>
            <Label>Reason</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why does this standard match the requirement?"
              className="resize-none w-full"
            />
          </div>

          <div>
            <Label>Links (optional; comma/semicolon/newline separated)</Label>
            <Textarea
              rows={3}
              value={linksRaw}
              onChange={(e) => setLinksRaw(e.target.value)}
              placeholder="https://www.iso.org/standard/..., https://webstore.iec.ch/en/publication/..."
              className="resize-none w-full"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {warning && !error && (
            <div className="text-sm text-amber-600">{warning}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}