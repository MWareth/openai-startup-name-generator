'use client';

import { useState } from 'react';

// Role + commission-scheme selects for the "edit team member" row. The scheme
// (Junior 50/50 · Senior 55/45 · Team Leader 60/40) only applies to agents, so
// it reacts live to the role dropdown — pick Marketing/Support/Admin and the
// scheme disappears instead of showing a stale "Junior 50/50".
export default function EditMemberRoleFields({ role: initialRole, seniority }) {
  const [role, setRole] = useState(initialRole || 'agent');

  return (
    <>
      <select
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ width: 130 }}
      >
        <option value="agent">Agent</option>
        <option value="marketing">Marketing</option>
        <option value="support">Support</option>
        <option value="director">Director</option>
        <option value="c_suite">C-Suite</option>
        <option value="admin">Admin (Owner)</option>
      </select>
      {role === 'agent' ? (
        <select name="seniority" defaultValue={seniority || 'junior'} style={{ width: 140 }}>
          <option value="junior">Junior 50/50</option>
          <option value="senior">Senior 55/45</option>
          <option value="team_leader">Team Leader 60/40</option>
        </select>
      ) : (
        <span className="small muted" style={{ width: 140 }}>— no scheme —</span>
      )}
    </>
  );
}
