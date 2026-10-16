import { Icon } from '@/components/ui/Icon';

/** Header de mobile (< 820px): solo la marca, como en el export. */
export function AppHeader() {
  return (
    <header className="mb-4 flex items-center gap-3 shell:hidden">
      <span
        role="img"
        aria-label="Taller Freelancer"
        className="grid h-[36px] w-[36px] flex-none place-items-center rounded-md bg-avatar text-on-ink"
      >
        <Icon name="brand" className="text-[19px]" />
      </span>
    </header>
  );
}
