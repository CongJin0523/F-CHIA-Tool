import { useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useZoneStore } from "@/store/zone-store";
import { listAllFtaTasksWithTitles } from "@/common/fta-storage";
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

  // current available FTAs
  const items = useMemo(() => listAllFtaTasksWithTitles(), []);
  const hasUrlPair =
    !!urlZone && !!urlTask && items.some(i => i.zoneId === urlZone && i.taskId === urlTask);




  // ① If no URL, try selectedFta; otherwise fall back away
  useEffect(() => {
    if (!urlZone || !urlTask) {
      if (selectedFta) {
        setParams({ zone: selectedFta.zoneId, task: selectedFta.taskId }, { replace: true });
      } else {
        // nothing selected => go elsewhere
        navigate("/table", { replace: true });
        toast.info("No FTA selected. Use the Table page to create one.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlZone, urlTask, selectedFta]);

  // ② Keep store in sync with URL, but guard against missing pair
  useEffect(() => {
    if (urlZone && urlTask) {
      if (hasUrlPair) {
        setSelectedFta({ zoneId: urlZone, taskId: urlTask });
      } else {
        // URL points to a deleted/missing FTA → clear everything and leave
        setSelectedFta(undefined);
        setParams({}, { replace: true });
        navigate("/table", { replace: true });
        toast.success("FTA deleted.");
      }
    }
  }, [urlZone, urlTask, hasUrlPair, setSelectedFta, setParams, navigate]);

  // Don’t render until URL is settled on a valid FTA
  if (!urlZone || !urlTask) return null;

  return <FtaCanvas zoneId={urlZone} taskId={urlTask} />;
}