// src/components/OnThisPage.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type HeadingItem = {
  id: string;
  text: string;
  depth: 2 | 3;
};

export interface OnThisPageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 包裹正文内容的容器 id，用它来查找 h2/h3（默认 'docs-content'） */
  containerId?: string;
  /** 查找标题的选择器（默认 'h2, h3'） */
  headingsSelector?: string;
  /** 激活线的 top 偏移（负值越早高亮，默认 80） */
  activeOffsetTop?: number;
}

export function OnThisPage({
  className,
  containerId = "docs-content",
  headingsSelector = "h2, h3",
  activeOffsetTop = 80,
  ...props
}: OnThisPageProps) {
  const [headings, setHeadings] = React.useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");

  // 简单 slugify：将标题文本变成 id
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  // 收集 headings
  React.useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const nodes = Array.from(container.querySelectorAll(headingsSelector)) as HTMLElement[];

    const items: HeadingItem[] = nodes
      .filter((el) => /H2|H3/.test(el.tagName))
      .map((el) => {
        // 确保每个标题都有 id
        if (!el.id) {
          el.id = slugify(el.textContent || "section");
        }
        return {
          id: el.id,
          text: el.textContent || "",
          depth: el.tagName === "H3" ? 3 : 2,
        };
      });

    setHeadings(items);
  }, [containerId, headingsSelector]);

  // 观察并高亮当前可视标题
  React.useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 找到最靠上的可见标题
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top));

        if (visible[0]?.target) {
          const id = (visible[0].target as HTMLElement).id;
          setActiveId(id);
        }
      },
      {
        // 用 rootMargin 把“视口顶部”往下推一点，这样更符合阅读习惯
        root: null,
        rootMargin: `-${activeOffsetTop}px 0px -60% 0px`,
        threshold: [0, 1.0],
      }
    );

    // 订阅所有标题
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings, activeOffsetTop]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "no-scrollbar overflow-y-auto px-6",
        "text-sm",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-2 p-4 pt-0">
        <p className="text-muted-foreground bg-background sticky top-0 h-6 text-xs">
          On This Page
        </p>

        <ScrollArea className="max-h-[70vh] pr-2">
          <nav className="flex flex-col">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                data-active={activeId === h.id}
                data-depth={h.depth}
                className={cn(
                  "text-muted-foreground hover:text-foreground data-[active=true]:text-foreground",
                  "text-[0.8rem] no-underline transition-colors py-1",
                  h.depth === 3 ? "pl-4" : "pl-0"
                )}
              >
                {h.text}
              </a>
            ))}
          </nav>
          <div className="h-12" />
        </ScrollArea>
      </div>
    </div>
  );
}