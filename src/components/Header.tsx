// src/components/Header.tsx
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link to={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
export default function Header() {
  return (
    <header className="bg-background sticky top-0 z-50 w-full border-b">
      <div className="flex h-12 items-center px-6">

        {/* 左侧 Logo 或标题 */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-lg font-semibold hover:text-primary transition-colors"
          >
            F-CHIA Tool
          </Link>
        </div>

        {/* 右侧导航菜单 */}
        <div className="ml-auto flex items-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>File</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2">
                    <ListItem key="table" title="Table" href="/table" >Table</ListItem>
                    <ListItem key="diagram" title="Diagram" href="/diagram" >Diagram</ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Go to</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2">
                    <ListItem key="table" title="Table" href="/table" >Table</ListItem>
                    <ListItem key="diagram" title="Diagram" href="/diagram" >Diagram</ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to="/docs">Docs</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <span className="text-muted-foreground text-sm">|</span>
          <a
            href="https://github.com/CongJin0523/F-CHIA-Tool"
            target="_blank"
            rel="noreferrer"
            className="ml-4 inline-flex items-center gap-1 text-m hover:text-primary transition-colors"
            title="GitHub Repository"
          >
            <img
              src="src/icon/github-mark.svg"
              alt="GitHub"
              className="w-5 h-5"
            />
            <span className="hidden md:inline font-bold">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}