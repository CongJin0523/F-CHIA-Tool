import React from 'react';
import { Panel, useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';

import { useZoneStore } from "@/store/zone-store"; // from previous step
import { ImageDown } from 'lucide-react';
import Tooltip from '@mui/material/Tooltip';
import Fab from "@mui/material/Fab";
import { grey } from '@mui/material/colors';

const color = grey[500];

function downloadImage(dataUrl, zoneName: string) {
  const a = document.createElement('a');
  if (zoneName) {
    const safeZoneName = zoneName.replace(/\s+/g, '-');
    a.setAttribute('download', `reactflow-${safeZoneName}.png`);
  } else {
    a.setAttribute('download', 'reactflow.png');
  }
  a.setAttribute('href', dataUrl);
  a.click();
}

const imageWidth = 1920;
const imageHeight = 1080;
const DPR = Math.min(3, window.devicePixelRatio || 1);

function DownloadButton() {


  const { getNodes } = useReactFlow();
  const zones = useZoneStore(s => s.zones);
  const selectedId = useZoneStore(s => s.selectedId);
  const projectName = useZoneStore(s => s.projectName);
  const onClick = () => {
    // we calculate a transform for the nodes so that all nodes are visible
    // we then overwrite the transform of the `.react-flow__viewport` element
    // with the style option of the html-to-image library
    const nodesBounds = getNodesBounds(getNodes());
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2);


    const selected = zones.find((z) => z.id === selectedId);

    const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewportEl) return;

    // --- Overlay: Project + Zone (will be captured in the PNG) ---
    const prevPos = viewportEl.style.position;
    if (!prevPos) viewportEl.style.position = 'relative';

    const badge = document.createElement('div');
    badge.style.position = 'absolute';
    badge.style.top = '12px';
    badge.style.left = '12px';
    badge.style.padding = '8px 12px';
    badge.style.borderRadius = '8px';
    badge.style.background = 'rgba(255,255,255,0.9)';
    badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
    badge.style.backdropFilter = 'blur(2px)';
    badge.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    badge.style.pointerEvents = 'none';
    badge.style.lineHeight = '1.2';
    badge.style.maxWidth = '60%';
    badge.style.wordBreak = 'break-word';

    const title = document.createElement('div');
    title.textContent = projectName || 'Untitled Project';
    title.style.fontWeight = '700';
    title.style.fontSize = '14px';

    const subtitle = document.createElement('div');
    subtitle.textContent = `Zone: ${selected?.label ?? selectedId ?? 'Unknown'}`;
    subtitle.style.fontSize = '12px';
    subtitle.style.color = '#555';

    badge.appendChild(title);
    badge.appendChild(subtitle);
    viewportEl.appendChild(badge);
    toPng(viewportEl, {
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      pixelRatio: DPR,
      cacheBust: true,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transformOrigin: '0 0',
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        // text render hints (helps clarity a bit)
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        imageRendering: 'crisp-edges',
      } as any,
    })
      .then((dataUrl) => {
        downloadImage(dataUrl, selected?.label);
      })
      .catch((err) => {
        console.error('PNG export failed:', err);
      })
      .finally(() => {
        // cleanup overlay
        try { viewportEl.removeChild(badge); } catch {}
        if (!prevPos) viewportEl.style.position = '';
      });
  };

  return (
    <Panel>
      <Tooltip title="Download as PNG">
        <Fab
          size="small"
          color={color}
          onClick={onClick}
          sx={{
            position: "fixed",
            right: 18,
            top: "10vh", // 150px from top
          }}
        >
          <ImageDown />
        </Fab>
      </Tooltip>
    </Panel>
  );
}

export default DownloadButton;