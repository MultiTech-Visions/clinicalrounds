import type { CouncilSpecialist, CouncilMemberInfo, OpenAIVoice } from './types';

// Friendly names that make voice conversation natural
// Instead of "Cardiologist, what do you think?" → "Cardi, what do you think?"
const COUNCIL_MEMBERS: Record<CouncilSpecialist, Omit<CouncilMemberInfo, 'specialist'>> = {
  attending: {
    name: 'Chief',
    title: 'Attending Hospitalist & Council Leader',
    voice: 'ash',
    color: '#8B5CF6',    // purple - authority
  },
  cardiologist: {
    name: 'Cardi',
    title: 'Cardiologist',
    voice: 'coral',
    color: '#EF4444',    // red - heart
  },
  pulmonologist: {
    name: 'Breezy',
    title: 'Pulmonologist',
    voice: 'shimmer',
    color: '#06B6D4',    // cyan - air
  },
  nephrologist: {
    name: 'Rio',
    title: 'Nephrologist',
    voice: 'echo',
    color: '#3B82F6',    // blue - water/flow
  },
  hepatologist: {
    name: 'Liv',
    title: 'Hepatologist',
    voice: 'sage',
    color: '#84CC16',    // lime - liver
  },
  hematologist: {
    name: 'Ruby',
    title: 'Hematologist',
    voice: 'ballad',
    color: '#DC2626',    // deep red - blood
  },
  id_specialist: {
    name: 'Scout',
    title: 'Infectious Disease Specialist',
    voice: 'verse',
    color: '#F59E0B',    // amber - alert/detection
  },
  radiologist: {
    name: 'Ray',
    title: 'Radiologist',
    voice: 'alloy',
    color: '#6366F1',    // indigo - imaging
  },
  pharmacist: {
    name: 'Rex',
    title: 'Clinical Pharmacist',
    voice: 'echo',
    color: '#10B981',    // emerald - Rx
  },
  endocrinologist: {
    name: 'Harmony',
    title: 'Endocrinologist',
    voice: 'shimmer',
    color: '#EC4899',    // pink - balance
  },
  neurologist: {
    name: 'Nova',
    title: 'Neurologist',
    voice: 'sage',
    color: '#A855F7',    // violet - neural
  },
  intensivist: {
    name: 'Vigil',
    title: 'Critical Care Intensivist',
    voice: 'ash',
    color: '#F97316',    // orange - urgency
  },
  oncologist: {
    name: 'Archer',
    title: 'Oncologist',
    voice: 'verse',
    color: '#14B8A6',    // teal - targeted therapy
  },
  psychiatrist: {
    name: 'Sage',
    title: 'Psychiatrist',
    voice: 'ballad',
    color: '#8B5CF6',    // purple - wisdom
  },
  toxicologist: {
    name: 'Vex',
    title: 'Toxicologist',
    voice: 'coral',
    color: '#FBBF24',    // yellow - hazard
  },
  palliative: {
    name: 'Grace',
    title: 'Palliative Care Specialist',
    voice: 'shimmer',
    color: '#F9A8D4',    // soft pink - compassion
  },
};

export function getMemberInfo(specialist: CouncilSpecialist): CouncilMemberInfo {
  return { specialist, ...COUNCIL_MEMBERS[specialist] };
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
