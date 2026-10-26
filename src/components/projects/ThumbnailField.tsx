'use client';

import { useEffect, useId, useState, type DragEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { cx } from '@/lib/cx';
import { THUMBNAIL_TYPES, thumbnailError, type ThumbnailChange } from '@/lib/thumbnails';

export type ThumbnailFieldProps = {
  initialUrl: string | null;
  /** Avisa qué hacer con la miniatura al guardar (`null` = dejarla como está). */
  onChange: (change: ThumbnailChange) => void;
};

/**
 * Miniatura del formulario del export (16:10, "PNG o JPG, idealmente 1600 × 1000"):
 * elegir o arrastrar, vista previa, validación y quitar la actual. No sube nada: el
 * formulario manda el archivo con `saveThumbnail` después de guardar el proyecto.
 */
export function ThumbnailField({ initialUrl, onChange }: ThumbnailFieldProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const shown = preview ?? (removed ? null : initialUrl);

  // Libera el object URL anterior al cambiar de imagen o al desmontar.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function pick(file: File | undefined) {
    if (!file) return;
    const problem = thumbnailError(file);
    setError(problem);
    if (problem) return;
    setPreview(URL.createObjectURL(file));
    setRemoved(false);
    onChange({ file });
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files[0]);
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="m-0 text-xl">Miniatura</h2>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={cx(
          'relative grid aspect-[16/10] cursor-pointer place-items-center overflow-hidden rounded-md bg-neutral-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
          dragging && 'outline outline-2 outline-offset-2 outline-accent',
        )}
      >
        <input
          id={inputId}
          type="file"
          aria-label="Miniatura del proyecto"
          accept={THUMBNAIL_TYPES.join(',')}
          aria-describedby={cx(hintId, error ? errorId : undefined)}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = ''; // elegir otra vez el mismo archivo también dispara el cambio
          }}
          className="sr-only"
        />
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa de un blob local: next/image no aplica
          <img
            src={shown}
            alt="Vista previa de la miniatura"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 px-4 text-center text-sm text-neutral-700">
            <Icon name="download" className="text-[22px]" />
            Arrastra o haz clic para subir una captura
          </span>
        )}
      </label>
      <span id={hintId} className="text-xs text-neutral-700">
        PNG, JPG o WebP, idealmente 1600 × 1000 (máx. 2 MB).
      </span>
      {error && (
        <span
          id={errorId}
          role="alert"
          className="flex items-center gap-1 text-xs text-danger-text"
        >
          <Icon name="warning" />
          {error}
        </span>
      )}
      {preview && (
        <Button
          variant="ghost"
          size="sm"
          icon="close"
          className="self-start"
          onClick={() => {
            setPreview(null);
            setError(null);
            onChange(null);
          }}
        >
          Quitar imagen nueva
        </Button>
      )}
      {!preview && initialUrl && (
        <Button
          variant="ghost"
          size="sm"
          icon={removed ? 'back' : 'close'}
          className="self-start"
          onClick={() => {
            setRemoved(!removed);
            onChange(removed ? null : 'remove');
          }}
        >
          {removed ? 'Recuperar miniatura' : 'Quitar miniatura'}
        </Button>
      )}
    </div>
  );
}
