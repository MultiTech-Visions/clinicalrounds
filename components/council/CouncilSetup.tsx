'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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

  const clearSelection = () => {
    setSelected(new Set([leader]));
  };

  const canStart = selected.size >= 2;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Voice Council</h1>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          Select specialists for a live voice conference. They&apos;ll discuss
          the case in real-time using parliamentary procedure.
        </p>
      </div>

      {/* Case context */}
      <div className="mb-8">
        <label className="mb-2 block text-sm font-medium">
          Case Context
          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          placeholder="Paste clinical notes or describe the case for the council to discuss..."
          value={caseContext}
          onChange={e => setCaseContext(e.target.value)}
          rows={4}
          className="resize-y"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Shared with all council members at session start.
        </p>
      </div>

      {/* Specialist selection header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Council Members</h2>
          <Badge
            variant={canStart ? 'default' : 'secondary'}
            className="tabular-nums"
          >
            {selected.size} / {allMembers.length}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={selected.size === allMembers.length}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            disabled={selected.size <= 1}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Specialist grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

      {/* Council leader picker */}
      <div className="mb-8 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="block text-sm font-medium">
              Council Chair
            </label>
            <p className="text-xs text-muted-foreground">
              The chair manages floor recognition and session flow.
            </p>
          </div>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                  {m.name} — {m.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Start button */}
      <div className="flex flex-col items-center gap-2">
        <Button
          size="lg"
          disabled={!canStart}
          onClick={() => onStart(Array.from(selected), leader, caseContext)}
          className="px-10 text-base"
        >
          Start Council
          <span className="ml-2 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
            {selected.size} members
          </span>
        </Button>
        {!canStart && (
          <p className="text-sm text-muted-foreground">
            Select at least 2 members to begin.
          </p>
        )}
      </div>
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
      className={`group relative flex flex-col items-center rounded-lg border-2 p-3 text-center transition-all duration-150 ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-transparent bg-muted/40 opacity-70 hover:border-muted-foreground/30 hover:opacity-100'
      }`}
      style={isSelected ? { borderColor: member.color } : undefined}
    >
      {/* Leader badge */}
      {isLeader && (
        <span
          className="absolute -top-2 right-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
          style={{ backgroundColor: member.color }}
        >
          CHAIR
        </span>
      )}

      {/* Selection checkmark */}
      {isSelected && !isLeader && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
          &#10003;
        </span>
      )}

      {/* Pixel avatar */}
      <div className={`mb-2 transition-transform duration-150 ${isSelected ? '' : 'grayscale group-hover:grayscale-0'}`}>
        <PixelAvatar
          specialist={member.specialist}
          status={isSelected ? 'connected' : 'idle'}
          size={2}
        />
      </div>

      {/* Name and title */}
      <div className="text-sm font-semibold leading-tight">{member.name}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
        {member.title}
      </div>

      {/* Make chair action */}
      {isSelected && !isLeader && (
        <button
          onClick={e => {
            e.stopPropagation();
            onSetLeader();
          }}
          className="mt-1.5 rounded-sm px-2 py-0.5 text-[10px] text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
          Make chair
        </button>
      )}
    </button>
  );
}
