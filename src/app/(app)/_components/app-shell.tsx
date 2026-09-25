"use client";

import React, { useState } from "react";
import { TaskDialogsProvider } from "@/features/tasks/components/task-dialogs";
import { CosmicBackground } from "@/shared/effects/cosmic-background";
import { useLocalBoolean } from "@/shared/lib/use-local-preference";
import { cn } from "@/shared/lib/utils";
import { OrbitHeader } from "./orbit-header";
import { OrbitSidebar } from "./orbit-sidebar";

export function AppShell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalBoolean("orbit_sidebar_collapsed");
  const toggleCollapse = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <TaskDialogsProvider>
      <div className="relative min-h-screen flex flex-col transition-colors duration-300">
        {/* Cosmic background with canvas stars & meteors */}
        <CosmicBackground />

        {/* Fixed Sidebar on Left (Desktop) & Drawer (Mobile) */}
        <OrbitSidebar
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Main Content Area - Shifted Right on Desktop according to sidebar state */}
        <div
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "md:pl-[72px]" : "md:pl-64"
          )}
        >
          <OrbitHeader
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          />

          <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>

          {footer}
        </div>
      </div>
    </TaskDialogsProvider>
  );
}
