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

import CausesListSidebarGroup  from "@/components/FTA/component/sidebar/CausesListSidebarGroup";

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
        <CausesListSidebarGroup /> 

      </SidebarContent>
    </Sidebar>
  )
}