import type { ReactNode } from 'react';
import { AdminShell } from '../../src/shared/ui/admin-shell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
