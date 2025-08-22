import { useMemo, useState, useEffect } from "react";
import { useZoneStore } from "@/store/zone-store"; // from previous step
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Mode = "add" | "edit";

// simple slug helper (same as in store or reuse if exported)

export default function ZoneSelecter() {
  const zones = useZoneStore(s => s.zones);
  const selectedId = useZoneStore(s => s.selectedId);
  const setSelected = useZoneStore(s => s.setSelected);
  const addZone = useZoneStore(s => s.addZone);
  const renameZone = useZoneStore(s => s.renameZone);
  const removeZone = useZoneStore(s => s.removeZone);

  const selected = () => zones.find(z => z.id === selectedId);

  // Ensure the Select is always controlled: pick a stable value
  const controlledValue = selectedId ?? zones[0]?.id ?? "";

  // If nothing is selected but zones exist, select the first zone
  // Also if the currently selected id is no longer present, fall back to first
  useEffect(() => {
    if (zones.length === 0) {
      if (selectedId) setSelected(undefined);
      return;
    }
    const exists = zones.some(z => z.id === selectedId);
    if (!selectedId || !exists) {
      setSelected(zones[0].id);
    }
  }, [zones, selectedId, setSelected]);

  // dialog state
  const [mode, setMode] = useState<Mode>("add");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // delete confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);

  const startAdd = () => {
    setMode("add");
    setName("");
    setErr(null);
    setOpen(true);
  };

  const startEdit = () => {
    if (!selected) return;
    setMode("edit");
    setName(selected.label);
    setErr(null);
    setOpen(true);
  };

  const submit = () => {
    const n = name.trim();
    if (!n) { setErr("Name is required."); return; }
    const existsSameLabel = zones.some(z => z.label.toLowerCase() === n.toLowerCase() && (mode === "add" || z.id !== selectedId));
    if (existsSameLabel) { setErr("This name already exists."); return; }

    if (mode === "add") {
      const created = addZone(n);           // store already ensures unique id & selects it
      setSelected(created.id);
    } else if (mode === "edit" && selected) {
      renameZone(selected.id, n);
    }
    setOpen(false);
    setErr(null);
  };

  const requestDelete = () => {
    // close edit dialog first and open confirm
    setOpen(false);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selected) {
      removeZone(selected.id);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 items-center">



      {/* Zone Select */}
      <Select value={controlledValue} onValueChange={setSelected}>
        <SelectTrigger className="min-w-[220px]">
          <SelectValue placeholder="Select a zone" />
        </SelectTrigger>
        <SelectContent>
          {zones.map(z => (
            <SelectItem key={z.id} value={z.id}>{z.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add Zone" : "Edit Zone"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="zone-name">Zone name</Label>
            <Input
              id="zone-name"
              autoFocus
              placeholder={mode === "add" ? "e.g., Packaging Area" : "Rename zone"}
              value={name}
              onChange={(e) => { setName(e.target.value); if (err) setErr(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            />
            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>

          <DialogFooter className="flex items-center justify-between">
            {mode === "edit" && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={requestDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={submit}>
                {mode === "add" ? "Add" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={startAdd}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={startEdit}
        disabled={!selected}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      {/* Delete confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this zone?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}