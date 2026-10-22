import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AAYAN.SEC — Security Researcher & Pentester Portfolio',
  description:
    'Security research dossier of Aayan — Offensive Security Researcher & Penetration Tester. Protocol analysis, cloud architecture vulnerabilities, and exploit tooling.',
  keywords: [
    'Aayan',
    'Security Researcher',
    'Pentester',
    'Offensive Security',
    'Bug Bounty',
    'Vulnerability Research',
    'Exploit Development',
  ],
  authors: [{ name: 'Aayan' }],
  openGraph: {
    title: 'AAYAN.SEC — Security Researcher & Pentester Portfolio',
    description: 'Exploring systems. Finding flaws. Creating impact.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800;900&family=Saira+Extra+Condensed:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-[#DF491E] selection:text-[#171514]">
        {children}
      </body>
    </html>
  );
}
