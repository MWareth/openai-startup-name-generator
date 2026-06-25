'use client';

export default function PrintButton({ className = 'btn', children = 'Save as PDF' }) {
  return (
    <button type="button" className={`${className} no-print`} onClick={() => window.print()}>
      {children}
    </button>
  );
}
