export type DisputeType = 'never_said' | 'misquoted' | 'out_of_context' | 'wrong_creator';

export type DisputeStatus = 'pending_review' | 'upheld' | 'rejected' | 'under_investigation';

export interface Dispute {
  id: string;
  claimId: string;
  type: DisputeType;
  evidence: string;
  sourceUrl: string | null;
  submittedAt: string;
  status: DisputeStatus;
  aiAnalysis: string | null;
  aiConfidence: number | null;
}

// In-memory store — persists for process lifetime
const disputes: Dispute[] = [];
let nextId = 1;

export function addDispute(dispute: Omit<Dispute, 'id' | 'submittedAt' | 'status' | 'aiAnalysis' | 'aiConfidence'>): Dispute {
  const newDispute: Dispute = {
    ...dispute,
    id: `dispute-${nextId++}`,
    submittedAt: new Date().toISOString(),
    status: 'pending_review',
    aiAnalysis: null,
    aiConfidence: null,
  };
  disputes.push(newDispute);
  return newDispute;
}

export function updateDispute(id: string, update: Partial<Dispute>): boolean {
  const idx = disputes.findIndex(d => d.id === id);
  if (idx === -1) return false;
  disputes[idx] = { ...disputes[idx], ...update };
  return true;
}

export function getDisputesByClaim(claimId: string): Dispute[] {
  return disputes.filter(d => d.claimId === claimId);
}

export function getAllDisputes(): Dispute[] {
  return [...disputes].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function getDisputeTypeLabel(type: DisputeType): string {
  switch (type) {
    case 'never_said': return 'Never Said This';
    case 'misquoted': return 'Misquoted';
    case 'out_of_context': return 'Taken Out of Context';
    case 'wrong_creator': return 'Wrong Creator';
  }
}
