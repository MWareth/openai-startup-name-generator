// A small mood-boost card for agents. Picks a fresh sales-motivation line on
// every dashboard load (the page is force-dynamic, so it varies each visit).

const MESSAGES = [
  'Every "no" is one step closer to your next "yes." Keep dialing. 📞',
  'The best deal you\'ll close this month starts with the call you make right now.',
  'Fortune favours the agent who follows up. Check your calendar. 📅',
  'You don\'t need more leads — you need to work the ones you have, harder.',
  'Top closers aren\'t lucky. They\'re consistent. Show up today.',
  'Someone is going to sell that property today. Make it you. 🏆',
  'Your next commission is hiding in a follow-up you haven\'t made yet.',
  'Confidence sells. Walk into every viewing like the deal is already done.',
  'Speed wins listings. Be the first to call back. ⚡',
  'A full pipeline beats a perfect pitch. Keep prospecting.',
  'The client can feel your energy through the phone. Bring the good stuff. 🔥',
  'Small daily wins compound into a record month. Stack one today.',
  'You miss 100% of the deals you don\'t ask for. Ask for the close.',
  'Hot leads cool down fast. Strike while they\'re warm. ☕',
  'Discipline today is freedom tomorrow. Make the extra call.',
  'Be so good they can\'t ignore you — then be so reliable they can\'t leave you.',
  'Every viewing is a chance to change someone\'s life. Treat it like one. 🔑',
  'The market rewards activity. Movement creates momentum.',
  'Your reputation is built one honest deal at a time. Build it today.',
  'Champions do the boring work brilliantly. Update your leads. 💪',
  'Sell the dream, deliver the detail. Clients remember both.',
  'Follow up like the sale depends on it — because it does.',
  'A calm agent closes a nervous buyer. Be the calm. 🌊',
  'Today\'s effort is tomorrow\'s closing. Plant the seed now.',
  'The phone weighs a ton until you pick it up. Then it pays. 📱',
  'You\'re one conversation away from a deal that changes your quarter.',
  'Persistence beats talent when talent doesn\'t follow up.',
  'Make the call you\'re avoiding. That\'s usually the one worth money.',
  'Great agents don\'t chase clients — they earn referrals. Deliver today.',
  'Believe in the property, believe in yourself, and the close takes care of itself.',
];

export default function MotivationCard() {
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, var(--brand), #0a2540)',
        color: '#fff',
        border: 'none',
      }}
    >
      <div className="small" style={{ opacity: 0.75, marginBottom: 4, letterSpacing: 0.3 }}>💡 DAILY BOOST</div>
      <div style={{ fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.4 }}>{msg}</div>
    </div>
  );
}
