'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { DusakawiLogo } from './icons';
import {
  LayoutDashboard,
  BarChart3,
  Bell,
  MessageSquareHeart,
  User,
  FolderKanban,
  UserCog,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/lib/auth';
import { Skeleton } from './ui/skeleton';
import { useAppSettings } from '@/hooks/use-app-settings';
import Image from 'next/image';
import { useCompanyData } from '@/hooks/use-company-data';


interface AppSidebarNavProps {
  isMobile: boolean;
}

export default function AppSidebarNav({ isMobile }: AppSidebarNavProps) {
  const pathname = usePathname();
  const { user, userProfile, userRole, isRoleLoading } = useAuth();
  const { settings, isLoading: isSettingsLoading } = useAppSettings();
  const { companyName, loading: isCompanyLoading } = useCompanyData();
  
  const menuItems = [
    { href: '/inicio', label: 'Inicio', icon: LayoutDashboard },
    { href: '/inicio/documentos', label: 'Mapa de Procesos', icon: FolderKanban },
    { href: '/inicio/reports', label: 'Informes', icon: BarChart3, roles: ['superadmin', 'admin'] },
    { href: '/inicio/alerts', label: 'Alertas', icon: Bell, roles: ['superadmin', 'admin'] },
    { href: '/inicio/feedback', label: 'Feedback', icon: MessageSquareHeart },
  ];

  const bottomMenuItems = [
    { href: '/inicio/administracion', label: 'Administración', icon: UserCog, roles: ['superadmin'] },
    { href: '/inicio/account', label: 'Cuenta', icon: User },
  ]

  const isInicioActive = pathname === '/inicio';
  const userInitial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U';

  const hierarchyName = userProfile?.subprocesoNombre || userProfile?.procesoNombre || userProfile?.areaNombre || 'Sin Asignación';

  return (
    <>
      <div className="flex h-16 items-center border-b-[2px] border-gray-300">
        <Link href="/inicio" className="flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <Image src="/Imagenes/favicon.png" alt="Atlas SGI Logo" width={28} height={28} className="h-7 w-7" />
            <span className="text-lg font-headline font-semibold leading-none text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              {isSettingsLoading ? <Skeleton className="h-5 w-24 bg-muted-foreground/20" /> : settings.appName}
            </span>
          </div>
        </Link>
      </div>
      
      <div className="flex flex-col items-center text-center w-full px-3 py-4 gap-2 border-b-[2px] border-gray-300">
        <Avatar className="h-16 w-16 mb-1">
            <AvatarImage src={user?.photoURL || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxwcm9maWxlfGVufDB8fHx8MTc2MTY0MDYwMXww&ixlib=rb-4.1.0&q=80&w=1080"} alt={userProfile?.fullName || user?.displayName || 'Usuario'} />
            <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
        <div className="w-full max-w-full">
            <p className="font-semibold leading-snug text-base w-full break-words">
              {userProfile?.fullName || user?.displayName || 'Usuario'}
            </p>
            <p className="text-xs text-muted-foreground leading-snug w-full">
              {isRoleLoading ? '...' : hierarchyName}
              {isCompanyLoading
                ? <>{'\u00A0|\u00A0Cargando...'}</>
                : companyName ? (
                  <>
                    {`\u00A0|\u00A0`}
                    <span translate="no" className="notranslate">
                      {companyName}
                    </span>
                  </>
              ) : null}
            </p>
        </div>
      </div>

      <SidebarContent className="p-2 flex-1">
        <SidebarMenu>
          {isRoleLoading ? (
            <div className="space-y-2 px-2">
              <Skeleton className="h-8 w-full bg-muted-foreground/20" />
              <Skeleton className="h-8 w-full bg-muted-foreground/20" />
              <Skeleton className="h-8 w-full bg-muted-foreground/20" />
            </div>
          ) : menuItems
            .filter(item => !item.roles || (userRole && item.roles.includes(userRole)))
            .map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={item.href === '/inicio' ? isInicioActive : pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator className="bg-gray-300 h-[2px] mx-0" />
      
      <SidebarContent className="p-2 flex-none">
        <SidebarMenu>
            {isRoleLoading ? (
                <div className="flex items-center justify-center text-xs text-sidebar-foreground/70 gap-2 p-2 group-data-[collapsible=icon]:hidden">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verificando...</span>
                </div>
            ) : bottomMenuItems
                .filter(item => !item.roles || (userRole && item.roles.includes(userRole)))
                .map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.label}
                    >
                        <Link href={item.href}>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
