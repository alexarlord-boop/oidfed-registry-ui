import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useAppState, type Lang } from "@/hooks/store"
import { Braces, Home, Languages, LayoutDashboard } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, isAdmin, isTechnicalContact, canManageEntities } from "@/types/auth";
import { PlatformSections } from "@/types/constants";

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
            <Link to={PlatformSections.HOME.home.path}><span className="text-sm font-bold">OF</span></Link>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">OIDFED Registry</span>
            <span className="text-xs text-muted-foreground">by Trust & Identity Incubator</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t(PlatformSections.HOME.name)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.filter(item => item.section === PlatformSections.HOME.name).map((item) => (
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
            <SidebarGroupLabel>{t(PlatformSections.ADMIN.name)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMenuItems.filter(item => item.section === PlatformSections.ADMIN.name).map((item) => (
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
            <SidebarGroupLabel>{t(PlatformSections.MANAGEMENT.name)}</SidebarGroupLabel>
            <SidebarGroupContent>
            <SidebarMenu>
                {visibleMenuItems.filter(item => item.section === PlatformSections.MANAGEMENT.name).map((item) => (
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
          <SidebarGroupLabel>{t(PlatformSections.SETTINGS.name)}</SidebarGroupLabel>
          <SidebarGroupContent>
          <SidebarMenu>
              {visibleMenuItems.filter(item => item.section === PlatformSections.SETTINGS.name).map((item) => (
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
                    <UserAvatar
                      name={user?.username || 'User'}
                      src={user?.oidc_provider === 'github' ? `https://github.com/${user?.username}.png` : null}
                      size="sm"
                    />
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
    title: PlatformSections.HOME.dashboard.name,
    url: PlatformSections.HOME.dashboard.path,
    icon: LayoutDashboard,
    section: PlatformSections.HOME.name,
    desciption: "Stats & KPIs",
    adminOnly: false,
  },

  {
    title: PlatformSections.HOME.audit.name,
    url: PlatformSections.HOME.audit.path,
    icon: Braces,
    section: PlatformSections.HOME.name,
    adminOnly: false,
  },

  // Admin-only section
  {
    title: PlatformSections.ADMIN.users.name,
    url: PlatformSections.ADMIN.users.path,
    icon: Users,
    section: PlatformSections.ADMIN.name,
    desciption: "Manage user accounts",
    adminOnly: true,
  },

  {
    title: PlatformSections.ADMIN.trustAnchors.name,
    url: PlatformSections.ADMIN.trustAnchors.path,
    icon: Globe2,
    section: PlatformSections.ADMIN.name,
    desciption: "Manage federations and trust anchors",
    adminOnly: true,
  },

  // Management (available to technical contacts and admins)
  {
    title: PlatformSections.MANAGEMENT.entities.name  ,
    url: PlatformSections.MANAGEMENT.entities.path,
    icon: User,
    section: PlatformSections.MANAGEMENT.name,
    adminOnly: false,
  },

  {
    title: PlatformSections.MANAGEMENT.trustChains.name,
    url: PlatformSections.MANAGEMENT.trustChains.path,
    icon: ShieldCheck,
    section: PlatformSections.MANAGEMENT.name,
    adminOnly: false,
  },

  
  // Settings
  {
    title: PlatformSections.SETTINGS.language.name,
    url: PlatformSections.SETTINGS.language.path,
    icon: Languages,
    section: PlatformSections.SETTINGS.name,
    adminOnly: false,
  },

  {
    title: PlatformSections.SETTINGS.system.name,
    url: PlatformSections.SETTINGS.system.path,
    icon: Code,
    section: PlatformSections.SETTINGS.name,
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