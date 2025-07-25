import { useState, useCallback } from "react";

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
    <input
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
      className="text-sm text-gray-700 text-center cursor-text"
      onDoubleClick={handleDoubleClick}
    >
      {value}
    </p>
  );
}