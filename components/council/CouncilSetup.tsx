'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PixelAvatar } from './pixels/PixelAvatar';
import type { CouncilSpecialist, CouncilMemberInfo } from '@/lib/council/types';
import { getAllMembers } from '@/lib/council/specialist-names';

interface CouncilSetupProps {
  onStart: (
    selected: CouncilSpecialist[],
    leader: CouncilSpecialist,
    caseContext: string
  ) => void;
}

export function CouncilSetup({ onStart }: CouncilSetupProps) {
  const allMembers = getAllMembers();
  const [selected, setSelected] = useState<Set<CouncilSpecialist>>(
    new Set(['attending'])
  );
  const [leader, setLeader] = useState<CouncilSpecialist>('attending');
  const [caseContext, setCaseContext] = useState('');

  const toggle = (specialist: CouncilSpecialist) => {
    const next = new Set(selected);
    if (next.has(specialist)) {
      if (specialist === leader) return; // Can't deselect the leader
      next.delete(specialist);
    } else {
      next.add(specialist);
    }
    setSelected(next);
  };

  const selectAll = () => {
    setSelected(new Set(allMembers.map(m => m.specialist)));
  };

  const canStart = selected.size >= 2;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Voice Council</h1>
        <p className="mt-2 text-muted-foreground">
          Select specialists for a live voice conference. They&apos;ll discuss
          the case in real-time using parliamentary procedure.
        </p>
      </div>

      {/* Case context */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium">
          Case Context (optional)
        </label>
        <Textarea
          placeholder="Paste clinical notes or describe the case for the council to discuss..."
          value={caseContext}
          onChange={e => setCaseContext(e.target.value)}
          rows={4}
          className="resize-y"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          This will be shared with all council members at session start.
        </p>
      </div>

      {/* Specialist selection */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Select Council Members</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelected(new Set(['attending']))}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {allMembers.map(member => (
          <MemberCard
            key={member.specialist}
            member={member}
            isSelected={selected.has(member.specialist)}
            isLeader={leader === member.specialist}
            onToggle={() => toggle(member.specialist)}
            onSetLeader={() => {
              setLeader(member.specialist);
              setSelected(prev => new Set([...prev, member.specialist]));
            }}
          />
        ))}
      </div>

      {/* Council leader selection */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium">
          Council Leader (Chair)
        </label>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={leader}
          onChange={e => {
            const spec = e.target.value as CouncilSpecialist;
            setLeader(spec);
            setSelected(prev => new Set([...prev, spec]));
          }}
        >
          {allMembers
            .filter(m => selected.has(m.specialist))
            .map(m => (
              <option key={m.specialist} value={m.specialist}>
                {m.name} ({m.title})
              </option>
            ))}
        </select>
      </div>

      {/* Start button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          disabled={!canStart}
          onClick={() =>
            onStart(Array.from(selected), leader, caseContext)
          }
          className="px-8"
        >
          Start Council ({selected.size} members)
        </Button>
      </div>

      {!canStart && (
        <p className="mt-2 text-center text-sm text-destructive">
          Select at least 2 council members to start.
        </p>
      )}
    </div>
  );
}

function MemberCard({
  member,
  isSelected,
  isLeader,
  onToggle,
  onSetLeader,
}: {
  member: CouncilMemberInfo;
  isSelected: boolean;
  isLeader: boolean;
  onToggle: () => void;
  onSetLeader: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative rounded-lg border-2 p-3 text-left transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-muted-foreground/50'
      }`}
    >
      {/* Pixel avatar */}
      <div className="mb-1 flex justify-center">
        <PixelAvatar
          specialist={member.specialist}
          status={isSelected ? 'connected' : 'idle'}
          size={2}
        />
      </div>

      <div className="text-sm font-semibold">{member.name}</div>
      <div className="text-xs text-muted-foreground">{member.title}</div>

      {isLeader && (
        <span className="absolute right-2 top-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          CHAIR
        </span>
      )}

      {isSelected && !isLeader && (
        <button
          onClick={e => {
            e.stopPropagation();
            onSetLeader();
          }}
          className="mt-1 text-[10px] text-muted-foreground underline hover:text-foreground"
        >
          Make chair
        </button>
      )}
    </button>
  );
}
