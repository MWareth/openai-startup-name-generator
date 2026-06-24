import './globals.css';

export const metadata = {
  title: 'Estate CRM',
  description: 'Lead, deal and target management for real-estate agents',
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
