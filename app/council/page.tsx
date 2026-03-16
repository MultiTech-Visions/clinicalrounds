'use client';

import { useState } from 'react';
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
    <div className="min-h-screen bg-background">
      {/* Disclaimer banner */}
      <div className="bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-400">
        AI clinical reasoning aid. Does not replace physician clinical judgment.
        Not for diagnostic or treatment decisions.
      </div>

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
  );
}
