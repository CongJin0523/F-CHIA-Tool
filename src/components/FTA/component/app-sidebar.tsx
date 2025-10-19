import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import TaskSelectorLocal from '@/components/FTA/component/sidebar/TaskSelectorLocal';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import NodeSelector from '@/components/FTA/component/sidebar/Sidebar';
import { useSearchParams } from "react-router-dom";
import { useTaskCauses } from "@/components/FTA/component/sidebar/useTaskCauses";
// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

export function AppSidebar() {
  const [params] = useSearchParams();
  const zoneId = params.get("zone");
  const taskId = params.get("task");

  const causes = useTaskCauses(zoneId, taskId);
  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-2xl font-bold pt-12 flex justify-center">Tool</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xl font-bold flex justify-center">FTA Select</SidebarGroupLabel>
          <SidebarGroupContent>
            <TaskSelectorLocal />
          </SidebarGroupContent>

        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xl font-bold flex justify-center">Node</SidebarGroupLabel>
          <SidebarGroupContent>
            <NodeSelector />
          </SidebarGroupContent>

        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xl font-bold flex justify-center">Basic Event Check</SidebarGroupLabel>
          <SidebarGroupContent>
        {(!zoneId || !taskId) ? (
          <div className="text-xs text-neutral-500 px-1 py-1">
            Select a task first.
          </div>
        ) : causes.length === 0 ? (
          <div className="text-xs text-neutral-500 px-1 py-1">
            No causes found in this task.
          </div>
        ) : (
          <ul className="space-y-1">
            {causes.map((c, idx) => {
              const checkboxId = `cause-${c.id || idx}`;
              return (
                <li key={checkboxId} className="flex items-start gap-2">
                  <Checkbox id={checkboxId} />
                  <label
                    htmlFor={checkboxId}
                    className="text-sm leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate"
                    title={c.text}
                  >
                    {/* Short prefix “C1, C2, ...” + truncated text */}
                    <span className="font-medium mr-1">C{idx + 1}:</span>
                    <span className="align-middle">{c.text || "(empty)"}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </SidebarGroupContent>

        </SidebarGroup>
        {/* <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>
    </Sidebar>
  )
}