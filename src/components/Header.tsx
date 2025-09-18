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
      <div className="flex h-12 items-center justify-between px-6">

        {/* 中间 Logo 或标题 */}
        <Link
          to="/"
          className="text-lg font-semibold hover:text-primary transition-colors"
        >
          F-CHIA Tool
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>File</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  <ListItem key="table" title="Table" href="/table" >Table</ListItem>
                  <ListItem key="diagram" title="Diagram" href="/diagram" >Diagram</ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Go to</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
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