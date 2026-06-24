import './globals.css';

export const metadata = {
  title: 'Bullish Team CRM',
  description: 'Bridges & Allies — lead, deal and target management',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
