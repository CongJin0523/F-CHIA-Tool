import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import TaskSelectorLocal from '@/components/FTA/TaskSelectorLocal';
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
import NodeSelector from '@/components/FTA/component/Sidebar';
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
            <ul className="space-y-1">
              <li className="flex items-center space-x-2">
                <Checkbox id="basic-event-check" />
                <label htmlFor="basic-event-check" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Basic Event 1
                </label>
              </li>
              <li className="flex items-center space-x-2">
                <Checkbox id="conditioning-event-check" />
                <label htmlFor="conditioning-event-check" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Basic Event 2
                </label>
              </li>
              <li className="flex items-center space-x-2">
                <Checkbox id="basic-event-check" />
                <label htmlFor="basic-event-check" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Basic Event 3
                </label>
              </li>
              <li className="flex items-center space-x-2">
                <Checkbox id="conditioning-event-check" />
                <label htmlFor="conditioning-event-check" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Basic Event 2
                </label>
              </li>
            </ul>
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