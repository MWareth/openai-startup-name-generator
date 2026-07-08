'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signIn } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" style={{ width: '100%' }} disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(signIn, { error: null });
  return (
    <form action={formAction}>
      {state?.error ? <div className="alert error" role="alert">{state.error}</div> : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton />
    </form>
  );
}
