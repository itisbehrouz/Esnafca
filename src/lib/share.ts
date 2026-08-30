export async function shareMerchant(merchant: {
  name: string;
  city: string;
  district: string;
  craftTitle: string;
  slug: string;
}): Promise<boolean> {
  const url = typeof window !== "undefined" ? `${window.location.origin}/esnaf/${merchant.slug}` : "";
  const text = `${merchant.name} (${merchant.city} / ${merchant.district} - ${merchant.craftTitle}) - Şeffaf fiyat listesini inceleyin:`;

  // 1. Try Native Web Share API (Safari iOS / Chrome mobile)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: `${merchant.name} - Esnafça`,
        text: text,
        url: url,
      });
      return true;
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return false; // User closed share modal
      }
    }
  }

  // 2. Try Modern Clipboard API (Requires HTTPS or localhost)
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      // Fall through to legacy fallback
    }
  }

  // 3. Fallback for Local LAN IPs (e.g. 192.168.1.110 without HTTPS)
  try {
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    if (successful) return true;
  } catch (err) {
    console.error("Copy fallback error", err);
  }

  // 4. Ultimate fallback: Direct WhatsApp Web/App Share
  if (typeof window !== "undefined") {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
    return true;
  }

  return false;
}
