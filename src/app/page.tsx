import { HomeThemeSwitch } from './HomeThemeSwitch';

export default function Home() {
  return (
    <main className="flex items-center justify-between gap-4 p-page">
      <h1>Taller Freelancer</h1>
      <HomeThemeSwitch />
    </main>
  );
}
