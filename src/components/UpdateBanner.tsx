import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

/**
 * Listens for a waiting service worker and shows a refresh banner.
 * The page itself reloads after the new SW takes control.
 */
export function UpdateBanner() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let reg: ServiceWorkerRegistration | null = null;
    let reloading = false;

    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const trackInstalling = (sw: ServiceWorker) => {
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          setWaiting(sw);
        }
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker.getRegistration().then((r) => {
      if (!r) return;
      reg = r;
      if (r.waiting && navigator.serviceWorker.controller) setWaiting(r.waiting);
      if (r.installing) trackInstalling(r.installing);
      r.addEventListener("updatefound", () => {
        const sw = r.installing;
        if (sw) trackInstalling(sw);
      });
      // Poll for updates every 30 minutes while the tab is open.
      const id = setInterval(() => r.update().catch(() => {}), 30 * 60 * 1000);
      return () => clearInterval(id);
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting || dismissed) return null;

  const refresh = () => {
    waiting.postMessage("SKIP_WAITING");
  };

  return (
    <div
      className="fixed left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/80 px-4 py-2.5 text-sm text-white shadow-2xl backdrop-blur-xl"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
        animation: "fade-in-up 280ms cubic-bezier(0.22,1,0.36,1) both",
      }}
      role="status"
    >
      <span className="font-medium">A new version is available</span>
      <button
        onClick={refresh}
        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
