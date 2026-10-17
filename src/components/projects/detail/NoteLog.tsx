'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Tag } from '@/components/ui/Tag';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { NOTE_KIND_LABEL, NOTE_KINDS, type NoteKind, type TagVariant } from '@/lib/domain';
import { formatDate } from '@/lib/format';
import type { Note } from '@/lib/projects';

// Pedido en outline (no coral, que es vencido/destructivo: 02 §8.3).
const KIND_TONE: Record<NoteKind, TagVariant> = {
  pedido: 'outline',
  cambio: 'accent',
  nota: 'neutral',
};

export type NoteLogProps = {
  initialNotes: Note[];
  /** "Hoy" en Lima (`'YYYY-MM-DD'`), fecha de las entradas nuevas. */
  today: string;
};

/**
 * Bitácora del export: agregar Pedido / Cambio / Nota y borrar con confirmación en la
 * misma línea. Por ahora vive en el estado de la página; con la base, `onAdd` y
 * `onDelete` pasan a Server Actions (03 §4).
 */
export function NoteLog({ initialNotes, today }: NoteLogProps) {
  const toast = useToast();
  const [notes, setNotes] = useState(initialNotes);
  const [kind, setKind] = useState<NoteKind>('pedido');
  const [draft, setDraft] = useState('');
  const [asking, setAsking] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const kindId = useId();
  const bodyId = useId();

  function add(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setNotes((prev) => [{ id: crypto.randomUUID(), kind, body, notedOn: today }, ...prev]);
    setDraft('');
    toast.show('Nota agregada');
  }

  function remove(id: string) {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    setAsking(null);
    toast.show('Entrada borrada');
    textareaRef.current?.focus(); // el botón que tenía el foco desaparece
  }

  return (
    <div className="flex max-w-[820px] flex-col gap-6">
      <form onSubmit={add} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start gap-2">
          <label htmlFor={kindId} className="sr-only">
            Tipo de entrada
          </label>
          {/* El ancho va en el contenedor: Select ya trae w-full (no mezclar dos anchos). */}
          <div className="w-[140px] flex-none">
            <Select id={kindId} value={kind} onChange={(e) => setKind(e.target.value as NoteKind)}>
              {NOTE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {NOTE_KIND_LABEL[k]}
                </option>
              ))}
            </Select>
          </div>
          <label htmlFor={bodyId} className="sr-only">
            Entrada de la bitácora
          </label>
          <Textarea
            ref={textareaRef}
            id={bodyId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Qué pidió el cliente o qué cambiaste hoy…"
            compact
            className="flex-[1_1_300px]"
          />
        </div>
        <Button type="submit" icon="plus" disabled={!draft.trim()} className="self-start">
          Agregar a la bitácora
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="m-0 text-neutral-700">Todavía no hay entradas en la bitácora.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {notes.map((note) => {
            const date = formatDate(note.notedOn);
            return (
              <li key={note.id} className="flex flex-wrap gap-x-4 gap-y-1 py-3">
                <span className="flex-[0_0_120px] text-sm text-neutral-700">{date}</span>
                <span className="flex flex-[1_1_300px] flex-col items-start gap-1">
                  <Tag tone={KIND_TONE[note.kind]}>{NOTE_KIND_LABEL[note.kind]}</Tag>
                  <span className="text-lg">{note.body}</span>
                </span>
                {asking === note.id ? (
                  <span className="flex flex-none items-center gap-2">
                    <span className="text-sm text-neutral-700">¿Borrar?</span>
                    <Button size="sm" variant="ghost" autoFocus onClick={() => setAsking(null)}>
                      No
                    </Button>
                    <Button size="sm" tone="danger" onClick={() => remove(note.id)}>
                      Sí, borrar
                    </Button>
                  </span>
                ) : (
                  <Button
                    iconOnly
                    icon="trash"
                    variant="ghost"
                    aria-label={`Borrar entrada del ${date} (${NOTE_KIND_LABEL[note.kind]})`}
                    onClick={() => setAsking(note.id)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
