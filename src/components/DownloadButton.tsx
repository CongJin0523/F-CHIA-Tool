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

const imageWidth = 1024;
const imageHeight = 768;

function DownloadButton() {
  const { getNodes } = useReactFlow();
  const zones = useZoneStore(s => s.zones);
  const selectedId = useZoneStore(s => s.selectedId);
  const onClick = () => {
    // we calculate a transform for the nodes so that all nodes are visible
    // we then overwrite the transform of the `.react-flow__viewport` element
    // with the style option of the html-to-image library
    const nodesBounds = getNodesBounds(getNodes());
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2);


    const selected = zones.find((z) => z.id === selectedId);
    toPng(document.querySelector('.react-flow__viewport'), {
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: imageWidth,
        height: imageHeight,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then((dataUrl) => downloadImage(dataUrl, selected?.label));
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