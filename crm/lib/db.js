// Run a Supabase write (insert/update) that tolerates columns which don't exist
// yet because a migration hasn't been applied on this database. Postgres/PostgREST
// reports e.g. "Could not find the 'community' column of 'leads' in the schema
// cache" — we detect that, drop the offending key from the payload, and retry.
// This keeps core actions working while a database is catching up on migrations.
export async function writeTolerant(run, payload) {
  let res = await run(payload);
  let guard = 0;
  while (res && res.error && guard < 10) {
    const msg = res.error.message || '';
    const m = /'([\w]+)' column|column '([\w]+)'|column "([\w]+)"|the ([\w]+) column/i.exec(msg);
    const col = m && (m[1] || m[2] || m[3] || m[4]);
    if (!col || !(col in payload)) break;
    delete payload[col];
    res = await run(payload);
    guard += 1;
  }
  return res;
}
