import './globals.css';

export const metadata = {
  title: 'Bullish Team CRM',
  description: 'Bridges & Allies — lead, deal and target management',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Bullish CRM', statusBarStyle: 'black-translucent' },
  icons: { apple: '/logo.png' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a2540',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
