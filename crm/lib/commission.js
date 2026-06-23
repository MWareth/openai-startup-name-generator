// Commission model
// ----------------
// Referral is taken OFF THE TOP of the gross commission, then the remainder is
// split between the agent and the company by seniority:
//   junior -> 50% agent / 50% company
//   senior -> 55% agent / 45% company

export function agentSplitFor(seniority) {
  return seniority === 'senior' ? 0.55 : 0.5;
}

export function computeCommission({ grossCommission, referralAmount = 0, seniority }) {
  const gross = Number(grossCommission) || 0;
  const referral = Math.max(Number(referralAmount) || 0, 0);
  const afterReferral = Math.max(gross - referral, 0);
  const split = agentSplitFor(seniority);
  const agentCommission = afterReferral * split;
  const companyCommission = afterReferral - agentCommission;
  return {
    gross,
    referral,
    afterReferral,
    agentSplitPct: split,
    agentCommission,
    companyCommission,
  };
}
