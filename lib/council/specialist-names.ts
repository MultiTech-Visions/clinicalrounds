import type { CouncilSpecialist, CouncilMemberInfo, OpenAIVoice } from './types';

// Friendly names that make voice conversation natural
// Instead of "Cardiologist, what do you think?" → "Cardi, what do you think?"
//
// Voice assignment: 8 OpenAI voices across 16 specialists (2 per voice).
// Paired to maximize differentiation — specialists likely to be in the same
// council session are assigned different voices.
const COUNCIL_MEMBERS: Record<CouncilSpecialist, Omit<CouncilMemberInfo, 'specialist'>> = {
  attending: {
    name: 'Chief',
    title: 'Attending Hospitalist & Council Leader',
    voice: 'ash',        // 1/2 ash
    color: '#8B5CF6',    // purple - authority
  },
  cardiologist: {
    name: 'Cardi',
    title: 'Cardiologist',
    voice: 'coral',      // 1/2 coral
    color: '#EF4444',    // red - heart
  },
  pulmonologist: {
    name: 'Breezy',
    title: 'Pulmonologist',
    voice: 'shimmer',    // 1/2 shimmer
    color: '#06B6D4',    // cyan - air
  },
  nephrologist: {
    name: 'Rio',
    title: 'Nephrologist',
    voice: 'echo',       // 1/2 echo
    color: '#3B82F6',    // blue - water/flow
  },
  hepatologist: {
    name: 'Liv',
    title: 'Hepatologist',
    voice: 'sage',       // 1/2 sage
    color: '#84CC16',    // lime - liver
  },
  hematologist: {
    name: 'Ruby',
    title: 'Hematologist',
    voice: 'ballad',     // 1/2 ballad
    color: '#DC2626',    // deep red - blood
  },
  id_specialist: {
    name: 'Scout',
    title: 'Infectious Disease Specialist',
    voice: 'verse',      // 1/2 verse
    color: '#F59E0B',    // amber - alert/detection
  },
  radiologist: {
    name: 'Ray',
    title: 'Radiologist',
    voice: 'alloy',      // 1/2 alloy
    color: '#6366F1',    // indigo - imaging
  },
  pharmacist: {
    name: 'Rex',
    title: 'Clinical Pharmacist',
    voice: 'verse',      // 2/2 verse (paired w/ ID — rarely in same council)
    color: '#10B981',    // emerald - Rx
  },
  endocrinologist: {
    name: 'Harmony',
    title: 'Endocrinologist',
    voice: 'alloy',      // 2/2 alloy (paired w/ radiology — rarely overlap)
    color: '#EC4899',    // pink - balance
  },
  neurologist: {
    name: 'Nova',
    title: 'Neurologist',
    voice: 'coral',      // 2/2 coral (paired w/ cardiology — distinct domains)
    color: '#A855F7',    // violet - neural
  },
  intensivist: {
    name: 'Vigil',
    title: 'Critical Care Intensivist',
    voice: 'ballad',     // 2/2 ballad (paired w/ hematology)
    color: '#F97316',    // orange - urgency
  },
  oncologist: {
    name: 'Archer',
    title: 'Oncologist',
    voice: 'echo',       // 2/2 echo (paired w/ nephrology — distinct domains)
    color: '#14B8A6',    // teal - targeted therapy
  },
  psychiatrist: {
    name: 'Sage',
    title: 'Psychiatrist',
    voice: 'sage',       // 2/2 sage (paired w/ hepatology — rarely overlap)
    color: '#7C3AED',    // darker violet - wisdom (distinct from attending purple)
  },
  toxicologist: {
    name: 'Vex',
    title: 'Toxicologist',
    voice: 'ash',        // 2/2 ash (paired w/ attending — tox rarely chairs)
    color: '#FBBF24',    // yellow - hazard
  },
  palliative: {
    name: 'Grace',
    title: 'Palliative Care Specialist',
    voice: 'shimmer',    // 2/2 shimmer (paired w/ pulm — distinct roles)
    color: '#F9A8D4',    // soft pink - compassion
  },
};

export function getMemberInfo(specialist: CouncilSpecialist): CouncilMemberInfo {
  const data = COUNCIL_MEMBERS[specialist];
  if (!data) {
    // Defensive fallback for unknown specialists (should not happen with valid types)
    return { specialist, name: specialist, title: 'Specialist', voice: 'ash', color: '#6B7280' };
  }
  return { specialist, ...data };
}

export function getAllMembers(): CouncilMemberInfo[] {
  return (Object.keys(COUNCIL_MEMBERS) as CouncilSpecialist[]).map(getMemberInfo);
}

export function getMemberByName(name: string): CouncilMemberInfo | undefined {
  return getAllMembers().find(
    m => m.name.toLowerCase() === name.toLowerCase()
  );
}

// Build the roster string so each member knows who's in the room
export function buildRoster(members: CouncilMemberInfo[]): string {
  return members
    .map(m => `- ${m.name} (${m.title})${m.specialist === 'attending' ? ' [COUNCIL LEADER]' : ''}`)
    .join('\n');
}
