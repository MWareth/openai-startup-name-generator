// Shown while a page's data loads. A shimmering outline of the layout reads as
// "loading" far better than a frozen screen or a blank flash.
export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading">
      <div className="skeleton title" />
      <div className="grid grid-3">
        <div className="card"><div className="skeleton" style={{ width: '55%' }} /><div className="skeleton" style={{ height: 28, marginTop: 10, width: '35%' }} /></div>
        <div className="card"><div className="skeleton" style={{ width: '55%' }} /><div className="skeleton" style={{ height: 28, marginTop: 10, width: '35%' }} /></div>
        <div className="card"><div className="skeleton" style={{ width: '55%' }} /><div className="skeleton" style={{ height: 28, marginTop: 10, width: '35%' }} /></div>
      </div>
      <div className="card">
        <div className="skeleton" style={{ width: '30%' }} />
        <div className="skeleton card-block" style={{ marginTop: 12 }} />
      </div>
      <div className="card">
        <div className="skeleton" style={{ width: '25%' }} />
        <div className="skeleton card-block" style={{ marginTop: 12 }} />
      </div>
    </div>
  );
}
