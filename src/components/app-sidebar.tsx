import { Sidebar } from '@/components/ui/sidebar';
import AppSidebarNav from './app-sidebar-nav';

export default function AppSidebar() {
  return (
    <Sidebar
      className="border-r-[2px] border-gray-300"
      collapsible="icon"
      variant="sidebar"
    >
      <AppSidebarNav isMobile={false} />
    </Sidebar>
  );
}
