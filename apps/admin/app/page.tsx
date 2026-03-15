import { PageTitle } from '@smartshop/ui';
import { DashboardOverview } from '../src/features/dashboard';

export default function HomePage() {
  return (
    <main>
      <PageTitle title="Smartshop Admin" subtitle="Module boundaries for admin workflows" />
      <DashboardOverview />
    </main>
  );
}
