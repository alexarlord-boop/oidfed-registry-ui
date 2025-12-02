import { Outlet, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar"
import { useLocation } from "react-router-dom";
import { menuItems } from "@/components/app-sidebar";
import { PageHeader } from "../components/page-header";
import { ModeToggle } from "@/components/mode-toggle";

export default function Layout() {
    const location = useLocation();
    const item = menuItems.find(item => item.url === location.pathname)
    const title = item?.title || ""
    const description = item?.desciption || ""

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0  items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="max-h-10"/>
          <PageHeader title={title} description={description}/>
          
          {/* Non-page settings */}
          <ModeToggle/>
          
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}