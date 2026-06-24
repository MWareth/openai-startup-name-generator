// Shows an agent's photo from a URL, or their initials as a fallback.
export default function Avatar({ url, name, size = 'sm' }) {
  if (url) {
    // Plain <img> (not next/image) so any external photo URL works without config.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`avatar ${size}`} src={url} alt={name || 'agent'} />;
  }
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return <span className={`avatar-fallback ${size}`}>{initials}</span>;
}
