import { WhatsAppIcon } from "@/components/ui/icons";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** Floating WhatsApp button. The number comes from store settings. */
export function WhatsAppFloat({ number, label }: { number: string; label: string }) {
  const url = buildWhatsAppUrl(number);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition-transform hover:scale-105 hover:bg-whatsapp-hover"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <WhatsAppIcon width={28} height={28} />
    </a>
  );
}
