'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton';

// Fields for the "Add team member" form. Lives inside a <form action={createAgent}>.
// The commission scheme only applies to agents, so it hides when an oversight
// role (Director / C-Suite) is selected.
export default function AddMemberFields() {
  const [role, setRole] = useState('agent');
  const showCommission = role === 'agent';

  return (
    <>
      <div className="form-grid">
        <div className="field"><label>Full name</label><input name="full_name" required /></div>
        <div className="field"><label>Email</label><input name="email" type="email" required /></div>
      </div>
      <div className="form-grid">
        <div className="field"><label>Temporary password</label><input name="password" minLength={6} required /></div>
        <div className="field">
          <label>Role</label>
          <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="agent">Agent</option>
            <option value="support">Support (commission collection)</option>
            <option value="director">Director (monitor + full access)</option>
            <option value="c_suite">C-Suite (monitor + full access)</option>
          </select>
        </div>
      </div>
      {showCommission ? (
        <div className="field" style={{ maxWidth: 280 }}>
          <label>Commission scheme</label>
          <select name="seniority" defaultValue="junior">
            <option value="junior">Junior (50/50)</option>
            <option value="senior">Senior (55/45)</option>
            <option value="team_leader">Team Leader (60/40)</option>
          </select>
        </div>
      ) : null}
      <SubmitButton className="btn" pendingLabel="Creating…">Create user</SubmitButton>
    </>
  );
}
