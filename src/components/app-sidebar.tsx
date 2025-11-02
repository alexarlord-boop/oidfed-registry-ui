import { Link, useLocation } from "react-router-dom";
import { Braces, Home, LayoutDashboard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User2 } from "lucide-react";
import { ChevronUp, User, Code, ShieldCheck, FileText, Key, } from "lucide-react";

export function AppSidebar() {
  const location = useLocation();

  const menuItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
      section: "Explore"
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      section: "Explore"
    },
    {
      title: "API",
      url: "/api",
      icon: Code,
      section: "Explore"
    },

    // TODO
    {
      title: "Audit",
      url: "/audit",
      icon: Braces,
      section: "Explore"
    },

    {
      title: "Entities",
      url: "/entities",
      icon: User,
      section: "Management"
    },

    {
      title: "Trust Chains",
      url: "/trust-chains",
      icon: ShieldCheck,
      section: "Management"
    },

    {
      title: "Trust Marks",
      url: "/trust-marks",
      icon: ShieldCheck,
      section: "Management"
    },

    {
      title: "Policies",
      url: "/policies",
      icon: FileText,
      section: "Management"
    },

    {
      title: "Keys",
      url: "/keys",
      icon: Key,
      section: "Management"
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">OF</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">OIDFED Registry</span>
            <span className="text-xs text-muted-foreground">Trust & Identity Incubator</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(item => item.section === "Explore").map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
          <SidebarMenu>
              {menuItems.filter(item => item.section === "Management").map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 /> Username
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem>
                    <span>Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  );
}