// src/components/Header.tsx
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-background sticky top-0 z-50 w-full border-b">
      <div className="flex h-14 items-center justify-between px-6">
        {/* 左侧菜单按钮（移动端） */}
        <Button variant="ghost" size="sm" className="lg:hidden">
          ☰
        </Button>

        {/* 中间 Logo 或标题 */}
        <Link
          to="/"
          className="text-lg font-semibold hover:text-primary transition-colors"
        >
          F-CHIA Tool
        </Link>

        {/* 右侧功能区 */}
        <div className="flex items-center gap-2">
          <Link
            to="/table"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Table
          </Link>
          <Link
            to="/diagram"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Diagram
          </Link>
          <Link
            to="/fta"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            FTA
          </Link>

        </div>
      </div>
    </header>
  );
}