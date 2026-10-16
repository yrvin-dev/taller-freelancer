'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Seg } from '@/components/ui/Seg';
import type { ProjectView } from '@/lib/projects';

/**
 * Seg "Tarjetas / Tabla" del export. La vista vive en la URL (`?vista=tabla`), así
 * sobrevive a la recarga y se puede compartir; conserva los demás parámetros (filtros).
 */
export function ViewSwitch({ value }: { value: ProjectView }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function change(view: ProjectView) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'tabla') params.set('vista', 'tabla');
    else params.delete('vista');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <Seg<ProjectView>
      name="vista"
      label="Vista"
      value={value}
      options={[
        { value: 'tarjetas', label: 'Tarjetas', icon: 'apps' },
        { value: 'tabla', label: 'Tabla', icon: 'list' },
      ]}
      onChange={change}
    />
  );
}
