import { type ComponentType } from "react";
import { BaseNodeHeader, BaseNodeHeaderTitle } from "@/components/base-node";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface NodeHeaderProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  bgColor: string;
  textColor: string;
  onDelete: () => void;
}

export function NodeHeader({ icon: Icon, title, bgColor, textColor, onDelete }: NodeHeaderProps) {
  return (
    <BaseNodeHeader className="h-9">
      <div className={`flex items-center gap-1 rounded-tl-sm rounded-br-sm px-2 py-1 ${bgColor} ${textColor}`}>
        <Icon className="size-4" />
        <BaseNodeHeaderTitle>{title}</BaseNodeHeaderTitle>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="nodrag rounded-full size-6 px-1"
        aria-label="delete"
        title="delete"
        onClick={onDelete}
      >
        <Trash2 className="size-3" />
      </Button>
    </BaseNodeHeader>
  );
}