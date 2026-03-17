'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CouncilSetup } from '@/components/council/CouncilSetup';
import { CouncilRoom } from '@/components/council/CouncilRoom';
import type { CouncilSpecialist } from '@/lib/council/types';

type Phase = 'setup' | 'active';

interface SessionConfig {
  specialists: CouncilSpecialist[];
  leader: CouncilSpecialist;
  caseContext: string;
}

export default function CouncilPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<SessionConfig | null>(null);

  const handleStart = (
    specialists: CouncilSpecialist[],
    leader: CouncilSpecialist,
    caseContext: string
  ) => {
    setConfig({ specialists, leader, caseContext });
    setPhase('active');
  };

  const handleEnd = () => {
    setPhase('setup');
    setConfig(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Disclaimer banner */}
      <div className="shrink-0 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-700 dark:text-amber-400">
        AI clinical reasoning aid. Does not replace physician clinical judgment.
        Not for diagnostic or treatment decisions.
      </div>

      {/* Navigation bar (setup phase only) */}
      {phase === 'setup' && (
        <nav className="shrink-0 border-b border-border px-4 py-2">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <Link
              href="/landing"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
              </svg>
              Back to ClinicalRounds
            </Link>
          </div>
        </nav>
      )}

      {/* Content */}
      <div className="flex-1">
        {phase === 'setup' && <CouncilSetup onStart={handleStart} />}
        {phase === 'active' && config && (
          <CouncilRoom
            selectedSpecialists={config.specialists}
            leader={config.leader}
            caseContext={config.caseContext}
            onEnd={handleEnd}
          />
        )}
      </div>
    </div>
  );
}
