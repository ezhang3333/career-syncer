"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";

export default function LinkedInSyncToast({
  isVisible,
  onDismiss,
}: {
  isVisible: boolean;
  onDismiss: () => void;
}) {
  const toastRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate in when visible
  useGSAP(
    () => {
      if (!toastRef.current) return;
      if (isVisible) {
        gsap.fromTo(
          toastRef.current,
          { x: "110%", autoAlpha: 0 },
          { x: "0%", autoAlpha: 1, duration: 0.35, ease: "power3.out" },
        );
      }
    },
    { dependencies: [isVisible], scope: toastRef },
  );

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!isVisible) return;
    timerRef.current = setTimeout(() => {
      dismiss();
    }, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!toastRef.current) {
      onDismiss();
      return;
    }
    gsap.to(toastRef.current, {
      x: "110%",
      autoAlpha: 0,
      duration: 0.25,
      ease: "power3.in",
      onComplete: onDismiss,
    });
  }

  if (!isVisible) return null;

  return (
    <div
      ref={toastRef}
      style={{ transform: "translateX(110%)" }}
      className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-lg border border-white/10 bg-[#111113] px-4 py-3 shadow-2xl max-w-sm"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90">
          Career data updated —{" "}
          <Link
            href="/linkedin"
            className="text-blue-400 hover:underline"
            onClick={dismiss}
          >
            sync your LinkedIn profile
          </Link>
          .
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 text-white/40 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
