import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useAppState, type Lang } from "@/hooks/store"
import { Braces, Home, Languages, LayoutDashboard } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, isAdmin, isTechnicalContact, canManageEntities } from "@/types/auth";

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
import { ChevronUp, User, Code, ShieldCheck, FileText, Key, Users, CheckSquare, Globe2 } from "lucide-react";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useAppState();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => {
    // Admin-only items
    if (item.adminOnly && !isAdmin(user)) {
      return false;
    }
    // Management section requires at least technical contact role
    if (item.section === "Management" && !canManageEntities(user)) {
      return false;
    }
    return true;
  });


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
              {visibleMenuItems.filter(item => item.section === "Explore").map((item) => (
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

        {/* Admin-only section */}
        {isAdmin(user) && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('Administration')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMenuItems.filter(item => item.section === "Administration").map((item) => (
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
        )}

        {/* Management section - for technical contacts and admins */}
        {canManageEntities(user) && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('Management')}</SidebarGroupLabel>
            <SidebarGroupContent>
            <SidebarMenu>
                {visibleMenuItems.filter(item => item.section === "Management").map((item) => (
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
        )}

        <SidebarGroup>
          <SidebarGroupLabel>{t('Settings')}</SidebarGroupLabel>
          <SidebarGroupContent>
          <SidebarMenu>
              {visibleMenuItems.filter(item => item.section === "Settings").map((item) => (
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
                        src={`https://avatar.iran.liara.run/public/${Math.abs((user?.username || 'user').split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 100}`} 
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
    desciption: "Stats & KPIs",
    adminOnly: false,
  },

  {
    title: "Audit",
    url: "/audit",
    icon: Braces,
    section: "Explore",
    adminOnly: false,
  },

  // Admin-only section
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
    section: "Administration",
    desciption: "Manage user accounts",
    adminOnly: true,
  },

  {
    title: "Approvals",
    url: "/admin/approvals",
    icon: CheckSquare,
    section: "Administration",
    desciption: "Approve pending requests",
    adminOnly: true,
  },

  {
    title: "Trust Anchors",
    url: "/admin/trust-anchors",
    icon: Globe2,
    section: "Administration",
    desciption: "Manage federations and trust anchors",
    adminOnly: true,
  },

  // Management (available to technical contacts and admins)
  {
    title: "Entities",
    url: "/entities",
    icon: User,
    section: "Management",
    adminOnly: false,
  },

  {
    title: "Trust Chains",
    url: "/trust-chains",
    icon: ShieldCheck,
    section: "Management",
    adminOnly: false,
  },

  {
    title: "Trust Marks",
    url: "/trust-marks",
    icon: ShieldCheck,
    section: "Management",
    adminOnly: false,
  },

  {
    title: "Policies",
    url: "/policies",
    icon: FileText,
    section: "Management",
    adminOnly: false,
  },

  {
    title: "Keys",
    url: "/keys",
    icon: Key,
    section: "Management",
    adminOnly: false,
  },

  // Settings
  {
    title: "Language",
    url: "/language",
    icon: Languages,
    section: "Settings",
    adminOnly: false,
  },

  {
    title: "System",
    url: "/system",
    icon: Code,
    section: "Settings",
    adminOnly: false,
  },

  {
    title: "Account",
    url: "/account",
    icon: User,
    section: "User",
    adminOnly: false,
  },
];