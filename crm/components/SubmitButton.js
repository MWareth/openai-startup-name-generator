'use client';

import { useFormStatus } from 'react-dom';

// Submit button that disables itself while the form action is running, so a
// double-click can't create duplicate entries. Shows a "working" label too.
export default function SubmitButton({ children, className = 'btn', pendingLabel = 'Saving…', ...rest }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} {...rest}>
      {pending ? pendingLabel : children}
    </button>
  );
}
