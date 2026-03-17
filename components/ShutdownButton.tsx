'use client';

import { useState } from 'react';
import { Power } from 'lucide-react';

export function ShutdownButton() {
  const [confirming, setConfirming] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);

  async function handleShutdown() {
    if (!confirming) {
      setConfirming(true);
      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => setConfirming(false), 3000);
      return;
    }

    setShuttingDown(true);

    try {
      await fetch('/api/shutdown', { method: 'POST' });
    } catch {
      // Expected — server dies before response completes
    }

    // Close the browser tab
    window.close();

    // Fallback: if window.close() is blocked (not opened by script),
    // show a message briefly then navigate to blank
    setTimeout(() => {
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666;">' +
        '<p>Server stopped. You can close this tab.</p></div>';
    }, 1000);
  }

  return (
    <button
      onClick={handleShutdown}
      disabled={shuttingDown}
      title={confirming ? 'Click again to confirm shutdown' : 'Close ClinicalRounds'}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition-all
        ${
          shuttingDown
            ? 'bg-muted text-muted-foreground cursor-wait'
            : confirming
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-muted/80 text-muted-foreground hover:bg-destructive/10 hover:text-destructive backdrop-blur-sm'
        }`}
    >
      <Power className="size-3.5" />
      {shuttingDown ? 'Shutting down...' : confirming ? 'Confirm close?' : 'Close'}
    </button>
  );
}
