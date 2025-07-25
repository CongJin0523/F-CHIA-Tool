import { useCallback } from 'react';
import { ButtonHandle } from "@/components/button-handle";
import { Button } from "@/components/ui/button";
import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
} from "@/components/base-node";
import { Rocket, Plus, Trash2 } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow, type ConnectionState, useConnection } from '@xyflow/react';

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

  return (
    <BaseNode className="w-40 border-violet-200 bg-violet-50">
      <BaseNodeHeader className='h-9'>
        <div className="flex items-center gap-1 rounded-tl-sm rounded-br-sm bg-violet-200 px-2 py-1 text-violet-900">
          <Rocket className="size-4" />
          <BaseNodeHeaderTitle>Zone</BaseNodeHeaderTitle>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="nodrag rounded-full size-6 px-1"
          aria-label="Node Actions"
          title="Node Actions"
          onClick={handleDelete}
        >
          <Trash2 className="size-3" />
        </Button>

      </BaseNodeHeader>
      <BaseNodeContent>
        <p className="text-sm text-gray-700 text-center">
          {data.content}
        </p>
        <ButtonHandle
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
        </ButtonHandle>
      </BaseNodeContent>
    </BaseNode>
  );
}
ZoneNode.displayName = "ZoneNode";