import { useCallback } from 'react';
import { BaseHandle } from '@/components/base-handle';
import { Button } from "@/components/ui/button";
import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
} from "@/components/base-node";
import { Rocket, Plus, EllipsisVertical } from "lucide-react";
import { type Node, type NodeProps, Position, useReactFlow, type ConnectionState, useConnection } from '@xyflow/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '../ui/dropdown-menu';

export type TaskNode= Node<{
  content: string;
}>; 

const onClick = () => {
  window.alert(`Handle button has been clicked!`);
};
 
const selector = (connection: ConnectionState) => {
  return connection.inProgress;
};

export function TaskNode({ id, data }: NodeProps<TaskNode>) {
  const { updateNodeData, setNodes } = useReactFlow();

  const connectionInProgress = useConnection(selector);

  const handleDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  }, [id, setNodes]);

  return (
    <BaseNode className="w-32">
      <BaseNodeHeader className="border-b">
        <Rocket className="size-4" />
        <BaseNodeHeaderTitle>Ta</BaseNodeHeaderTitle>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="nodrag p-0.5"
              aria-label="Node Actions"
              title="Node Actions"
            >
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </BaseNodeHeader>
      <BaseNodeContent>
      <BaseHandle id="source-1" type="source" position={Position.Top} />
        <p className="text-xs">
          {data.content}
        </p>
        
      <BaseHandle id="target-1" type="target" position={Position.Bottom} />
      </BaseNodeContent>
    </BaseNode>
  );
}
TaskNode.displayName = "TaskNode";