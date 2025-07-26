import { useCallback, useState } from 'react';
import { ButtonHandle } from "@/components/button-handle";
import { Button } from "@/components/ui/button";
import {
  BaseNode,
  BaseNodeContent,
} from "@/components/base-node";
import { NodeHeader } from "@/components/nodes/subComponents/node-header";
import { Globe, Plus } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow, type ConnectionState, useConnection } from '@xyflow/react';
import { EditableText } from './subComponents/editable-text';
import { BaseHandle } from '../base-handle';

export type ZoneNode = Node<{
  content: string;
}>;

const onClick = () => {
  window.alert(`Handle button has been clicked!`);
};

const selector = (connection: ConnectionState) => {
  return connection.inProgress;
};

export function ZoneNode({ id, data }: NodeProps<ZoneNode>) {
  const { updateNodeData, setNodes } = useReactFlow();

  const connectionInProgress = useConnection(selector);

  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  }, [id, setNodes]);


  const [content, setContent] = useState(data.content);


  return (
    <BaseNode className="w-40 border-violet-200 bg-violet-50">
      <NodeHeader
        icon={Globe}
        title="Zone"
        bgColor="bg-violet-200"
        textColor="text-violet-900"
        onDelete={handleDelete}
      />
      <BaseNodeContent>
        <EditableText
          content={content}
          onChange={(value) => setContent(value)}
        />
        {/* <ButtonHandle
          type="target"
          position={Position.Bottom}
          showButton={!connectionInProgress}
        >
          <Button
            onClick={onClick}
            size="sm"
            variant="secondary"
            className="rounded-full"
          >
            <Plus size={10} />
          </Button>
        </ButtonHandle> */}
        <BaseHandle id={`${id}-source`} type="source" position={Position.Bottom} className="nodrag" />
      </BaseNodeContent>
    </BaseNode>
  );
}
ZoneNode.displayName = "ZoneNode";