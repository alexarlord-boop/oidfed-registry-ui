import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useAppState, type Lang } from "@/hooks/store"
import { Braces, Home, Languages, LayoutDashboard } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/auth";

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
  const navigate = useNavigate();
  const { language } = useAppState();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">OF</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">OIDFED Registry</span>
            <span className="text-xs text-muted-foreground">by Trust & Identity Incubator</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('Explore')}</SidebarGroupLabel>
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
                      <span>{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('Management')}</SidebarGroupLabel>
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
                      <span>{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('Settings')}</SidebarGroupLabel>
          <SidebarGroupContent>
          <SidebarMenu>
              {menuItems.filter(item => item.section === "Settings").map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{t(item.title)}</span>
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
                    <Avatar>
                      <AvatarImage 
                        src={user?.metadata?.avatarUrl || `https://avatar.iran.liara.run/public/${Math.abs((user?.username || 'user').split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 100}`} 
                        alt={user?.username || 'User'}
                      />
                      <AvatarFallback>
                        {(user?.username || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{user?.username || 'User'}</span>
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Account</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={async () => {
                      try {
                        await logout();
                        navigate('/login');
                      } catch (error) {
                        console.error('Logout failed:', error);
                        // Fallback: force navigation to login
                        navigate('/login');
                      }
                    }}
                    className="cursor-pointer"
                  >
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

export const menuItems = [
  
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    section: "Explore",
    desciption: "Stats & KPIs"
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

  {
    title: "Language",
    url: "/language",
    icon: Languages,
    section: "Settings"
  },

  {
    title: "System",
    url: "/system",
    icon: Code,
    section: "Settings"
  },

  {
    title: "Account",
    url: "/account",
    icon: Languages,
    section: "User"
  },


];