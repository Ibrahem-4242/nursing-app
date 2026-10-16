'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MaintenanceConfig } from '@/lib/types';
import MaintenanceScreen from './MaintenanceScreen';
import AdminPreviewBanner from './AdminPreviewBanner';

interface MaintenanceWrapperProps {
  maintenanceConfig: MaintenanceConfig;
  isAdmin: boolean;
  children: React.ReactNode;
}

export default function MaintenanceWrapper({
  maintenanceConfig,
  isAdmin,
  children,
}: MaintenanceWrapperProps) {
  const pathname = usePathname();
  const [config, setConfig] = useState<MaintenanceConfig>(maintenanceConfig);
  const [currentIsAdmin, setCurrentIsAdmin] = useState<boolean>(isAdmin);

  // Sync state if props change (e.g. after revalidation)
  useEffect(() => {
    setConfig(maintenanceConfig);
  }, [maintenanceConfig]);

  useEffect(() => {
    setCurrentIsAdmin(isAdmin);
  }, [isAdmin]);

  // NEVER block admin-dashboard or admin APIs
  const isAdminPath =
    pathname?.startsWith('/admin-dashboard') ||
    pathname?.startsWith('/api/admin');

  if (isAdminPath) {
    return <>{children}</>;
  }

  // If maintenance is OFF, show normal site
  if (!config.isEnabled) {
    return <>{children}</>;
  }

  // If maintenance is ON and user is verified Admin:
  // Show full site with Admin Preview Banner
  if (currentIsAdmin) {
    return (
      <>
        <AdminPreviewBanner
          config={config}
          onUnlock={() => {
            setConfig((prev) => ({ ...prev, isEnabled: false }));
          }}
        />
        {children}
      </>
    );
  }

  // If maintenance is ON and user is NOT Admin:
  // Show the locked Maintenance Screen
  return (
    <MaintenanceScreen
      config={config}
      onAdminLoginSuccess={() => {
        setCurrentIsAdmin(true);
        window.location.reload();
      }}
    />
  );
}
