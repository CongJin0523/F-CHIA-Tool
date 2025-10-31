import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea"

interface EditableTextProps {
  content: string;
  onChange?: (value: string) => void;

}

export function EditableText({ content, onChange }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (onChange) onChange(value);
  }, [onChange, value]);

  return editing ? (
    <Textarea
      className="text-sm text-gray-700 text-center bg-transparent border border-gray-300 rounded w-full"
      value={value}
      autoFocus
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
    />
  ) : (
    <p
      className={`text-sm text-center cursor-text ${
        value.trim() ? "text-gray-700" : "text-gray-400 italic"
      }`}
      onDoubleClick={handleDoubleClick}
    >
      {value.trim() || "Double-click to enter content..."}
    </p>
  );
}