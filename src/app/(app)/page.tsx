import { HomeDashboard } from '@/components/projects/HomeDashboard';
import { hourIn, todayIn } from '@/lib/format';
import { mockProjects } from '@/lib/mock/projects';
import { MOCK_USER } from '@/lib/mock/user';

// Datos de prueba hasta la tanda de datos: entonces `getSummary(uid)` (03 §3).
export default function Home() {
  const today = todayIn();
  return (
    <HomeDashboard
      projects={mockProjects(today)}
      today={today}
      hour={hourIn()}
      userName={MOCK_USER.name}
    />
  );
}
