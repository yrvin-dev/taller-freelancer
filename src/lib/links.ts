// Enlaces de la ficha. Los links del proyecto se guardan como el usuario los escribe
// ("polerastudio.pe", "https://…"); aquí se convierten en href seguros.

/** `polerastudio.pe` → `https://polerastudio.pe`. Solo http(s): nada de `javascript:`. */
export function externalHref(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return null; // otro esquema (javascript:, data:…)
  return `https://${text}`;
}

export function mailtoHref(email: string | null | undefined): string | null {
  const text = email?.trim();
  return text ? `mailto:${text}` : null;
}

/** `+51 954 228 017` → `https://wa.me/51954228017`. */
export function whatsappHref(phone: string | null | undefined): string | null {
  const digits = phone?.replace(/\D/g, '') ?? '';
  return digits ? `https://wa.me/${digits}` : null;
}
