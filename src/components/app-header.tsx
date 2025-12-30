
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import AppSidebarNav from './app-sidebar-nav';
import { Fragment, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useArea, useProceso, useSubproceso } from '@/hooks/use-areas-data';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { useAuth } from '@/lib/auth';

const hardcodedTranslations: Record<string, string> = {
    inicio: "Inicio",
    reports: "Informes",
    alerts: "Alertas",
    feedback: "Feedback",
    documentos: "Mapa de Procesos",
    account: "Cuenta",
    administracion: "Administración",
    area: "Área",
    proceso: "Proceso",
    subproceso: "Subproceso",
};

// A hook to fetch breadcrumb data dynamically
function useBreadcrumbData(segments: string[]) {
    const areaId = segments.includes('area') ? segments[segments.indexOf('area') + 1] : null;
    const procesoId = segments.includes('proceso') ? segments[segments.indexOf('proceso') + 1] : null;
    const subprocesoId = segments.includes('subproceso') ? segments[segments.indexOf('subproceso') + 1] : null;
    
    const { area, isLoading: isLoadingArea } = useArea(areaId);
    const { proceso, isLoading: isLoadingProceso } = useProceso(areaId, procesoId);
    const { subproceso, isLoading: isLoadingSubproceso } = useSubproceso(areaId, procesoId, subprocesoId);

    return {
        area,
        proceso,
        subproceso,
        isLoading: isLoadingArea || isLoadingProceso || isLoadingSubproceso,
        dataMap: {
            ...(areaId && { [areaId]: area?.nombre }),
            ...(procesoId && { [procesoId]: proceso?.nombre }),
            ...(subprocesoId && { [subprocesoId]: subproceso?.nombre }),
        }
    };
}


export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const app = useFirebaseApp();
  const { user, setIsLoggingOut } = useAuth();
  const pathSegments = pathname.split('/').filter(Boolean);

  const { isLoading, dataMap } = useBreadcrumbData(pathSegments);
  
  const handleLogout = async () => {
    const auth = getAuth(app);
    if (setIsLoggingOut) setIsLoggingOut(true);
    await signOut(auth);
    router.replace('/');
  }

  const breadcrumbItems = useMemo(() => {
    return pathSegments.map((segment, index) => {
        const isDynamicSegmentName = ['area', 'proceso', 'subproceso'].includes(segment);
        if (isDynamicSegmentName) {
            return null;
        }

        const isDynamicId = !hardcodedTranslations[segment];
        const label = hardcodedTranslations[segment] || dataMap[segment] || segment;
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;

        if (isLoading && isDynamicId && isLast) {
             return { href, label: 'Cargando...', isLast: true, isClickable: false };
        }

        const isSubprocesoId = pathSegments[index - 1] === 'subproceso';
        const isClickable = !isLast && !isSubprocesoId;

        return { href, label, isLast, isClickable };
    }).filter(Boolean);
}, [pathSegments, dataMap, isLoading]);

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6 sticky top-0 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Alternar menú de navegación</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <AppSidebarNav isMobile={true} />
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1 flex items-center gap-4">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
             {breadcrumbItems.map((item, index) => (
                <Fragment key={item.href}>
                  {index > 0 && item.label && <BreadcrumbSeparator />}
                   {item.label && (
                        <BreadcrumbItem>
                            {item.isClickable ? (
                            <BreadcrumbLink asChild>
                                <Link href={item.href} className="capitalize">
                                {item.label}
                                </Link>
                            </BreadcrumbLink>
                            ) : (
                            <BreadcrumbPage className="font-normal capitalize">{item.label}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                   )}
                </Fragment>
             ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-9 w-9">
               <AvatarImage src={user?.photoURL || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxwcm9maWxlfGVufDB8fHx8MTc2MTY0MDYwMXww&ixlib=rb-4.1.0&q=80&w=1080"} alt={user?.displayName || "Usuario"} />
               <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Alternar menú de usuario</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
           <DropdownMenuItem asChild><Link href="/inicio/account">Configuración</Link></DropdownMenuItem>
          <DropdownMenuItem disabled>Soporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Cerrar Sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
