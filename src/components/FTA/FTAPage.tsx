import { useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useZoneStore } from "@/store/zone-store";
import FtaCanvas from "./FTACanvas"; // 你的画布组件
import { toast } from "sonner";
// tiny helper: read all FTA ids from localStorage
function listAllFtasFromLocalStorage(): Array<{ zoneId: string; taskId: string }> {
  const out: Array<{ zoneId: string; taskId: string }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || "";
    if (!k.startsWith("fta-")) continue;
    // key format: fta-${zoneId}::${taskId}
    const id = k.slice(4);
    const [zoneId, taskId] = id.split("::");
    if (zoneId && taskId) out.push({ zoneId, taskId });
  }
  return out;
}


export default function FtaPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedFta = useZoneStore((s) => s.selectedFta);
  const setSelectedFta = useZoneStore((s) => s.setSelectedFta);

  const urlZone = params.get("zone") || undefined;
  const urlTask = params.get("task") || undefined;

  // All available FTAs discovered from localStorage
  const availableFtas = useMemo(() => listAllFtasFromLocalStorage(), []);

  // If URL params are missing, try to restore from store; if none, fall back to first available; else go to /diagram
  useEffect(() => {
    if (urlZone && urlTask) return;

    if (selectedFta?.zoneId && selectedFta?.taskId) {
      setParams({ zone: selectedFta.zoneId, task: selectedFta.taskId }, { replace: true });
      return;
    }

    if (availableFtas.length > 0) {
      const first = availableFtas[0];
      setParams({ zone: first.zoneId, task: first.taskId }, { replace: true });
      return;
    }
    toast.warning(
      "No FTA data found. Please create an FTA from the Table page before viewing."
    );
    console.log("No Fta");
    // no FTAs at all — send user to Table to create FTAs from the Table flow
    navigate("/table", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlZone, urlTask, selectedFta]);

  // If URL params exist but point to a non-existing FTA, redirect to first available or Diagram
  useEffect(() => {
    if (!urlZone || !urlTask) return;
    const exists = availableFtas.some((f) => f.zoneId === urlZone && f.taskId === urlTask);
    if (!exists) {
      if (availableFtas.length > 0) {
        const first = availableFtas[0];
        setParams({ zone: first.zoneId, task: first.taskId }, { replace: true });
      } else {
        navigate("/table", { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlZone, urlTask]);

  // Keep store in sync with URL
  useEffect(() => {
    if (urlZone && urlTask) {
      setSelectedFta({ zoneId: urlZone, taskId: urlTask });
    }
  }, [urlZone, urlTask, setSelectedFta]);

  // Don’t render until URL is settled on a valid FTA
  if (!urlZone || !urlTask) return null;

  return <FtaCanvas zoneId={urlZone} taskId={urlTask} />;
}