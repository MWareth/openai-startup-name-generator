'use client';

import { useState } from 'react';

// Money inputs that show thousands separators (1,200,000) while keeping a clean
// numeric value for the form, plus a Commission % that auto-calculates the gross
// commission (deal value × %). Gross stays editable as an override.
function fmt(n) {
  if (n === '' || n == null) return '';
  const num = Number(n);
  if (Number.isNaN(num)) return '';
  return num.toLocaleString('en-US');
}
function parse(s) {
  return String(s).replace(/[^0-9.]/g, '');
}

export default function DealMoneyFields({
  dealValue = '',
  commissionRate = '',
  grossCommission = '',
  referralAmount = '0',
}) {
  const [value, setValue] = useState(String(dealValue ?? ''));
  const [rate, setRate] = useState(String(commissionRate ?? ''));
  const [gross, setGross] = useState(String(grossCommission ?? ''));
  const [referral, setReferral] = useState(String(referralAmount ?? '0'));

  function recalc(v, r) {
    const val = Number(v) || 0;
    const rt = Number(r) || 0;
    if (rt > 0) setGross(String(Math.round((val * rt) / 100)));
  }

  return (
    <>
      <div className="form-grid">
        <div className="field">
          <label>Deal value (AED) *</label>
          <input
            type="text"
            inputMode="numeric"
            value={fmt(value)}
            onChange={(e) => { const raw = parse(e.target.value); setValue(raw); recalc(raw, rate); }}
            placeholder="1,200,000"
            required
          />
          <input type="hidden" name="deal_value" value={value} />
        </div>
        <div className="field">
          <label>Commission %</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={rate}
            onChange={(e) => { const raw = parse(e.target.value); setRate(raw); recalc(value, raw); }}
            placeholder="e.g. 4"
          />
          <input type="hidden" name="commission_rate" value={rate} />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Gross commission (AED)</label>
          <input
            type="text"
            inputMode="numeric"
            value={fmt(gross)}
            onChange={(e) => setGross(parse(e.target.value))}
            placeholder="auto from %"
          />
          <input type="hidden" name="gross_commission" value={gross} />
          <div className="small muted">Auto = deal value × %. You can override it.</div>
        </div>
        <div className="field">
          <label>Referral amount (AED, off the top)</label>
          <input
            type="text"
            inputMode="numeric"
            value={fmt(referral)}
            onChange={(e) => setReferral(parse(e.target.value))}
            placeholder="0"
          />
          <input type="hidden" name="referral_amount" value={referral} />
        </div>
      </div>
    </>
  );
}
