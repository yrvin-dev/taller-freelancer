import { HomeDashboard } from '@/components/projects/HomeDashboard';
import { hourIn, todayIn } from '@/lib/format';
import { mockProjects } from '@/lib/mock/projects';
import { getCurrentProfile } from '@/lib/data/profile';

// Datos de prueba hasta la tanda de datos: entonces `getSummary(uid)` (03 §3).
export default async function Home() {
  const profile = await getCurrentProfile();
  const today = todayIn();
  return (
    <HomeDashboard
      projects={mockProjects(today)}
      today={today}
      hour={hourIn()}
      userName={profile?.displayName ?? ''}
    />
  );
}
