import type { CSSProperties } from 'react';
import { Manrope, Noto_Serif_Display } from 'next/font/google';
import { prisma } from '@/lib/prisma';
import { EmbeddableRoom, type RoomTheme } from '@/components/room/embeddable-room';

// Fonts of the hotel website, self-hosted by next/font. Only applied to a themed room.
const body = Manrope({ subsets: ['latin', 'greek'], variable: '--room-body' });
const display = Noto_Serif_Display({ subsets: ['latin', 'greek'], weight: ['400'], variable: '--room-display' });

/** "#343F35" → "129 10% 23%", the triplet format of this app's colour tokens. Anything but a 6-digit hex → undefined. */
function hsl(hex: string | undefined): string | undefined {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? '');
  if (!m) return undefined;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return `${Math.round(h * 60)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Embeddable concierge room: /room/villa-1?primary=%23b8860b&name=Ephyria&logo=...&companyId=...
// Designed to sit in an <iframe> on the hotel website and take its colors.
export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const theme: RoomTheme = {
    primary: str(sp.primary) ?? '#0078D4',
    hotelName: str(sp.name) ?? 'Hotel',
    logo: str(sp.logo),
    companyId: str(sp.companyId),
  };

  // "Back to the website" target after a call: the company's own website from the
  // database, never a URL from the query string (that would be an open redirect).
  if (theme.companyId) {
    const company = await prisma.company
      .findUnique({ where: { id: theme.companyId }, select: { website: true } })
      .catch(() => null);
    if (company?.website && /^https?:\/\//i.test(company.website)) theme.siteUrl = company.website;
  }

  // Website palette (?bg=&card=&text=&muted=&line=&primary= as hex): remaps this app's
  // colour tokens for the room only, so inside the site's modal it looks like the site.
  const tokens: Record<string, string | undefined> = {
    '--background': hsl(str(sp.bg)),
    '--card': hsl(str(sp.card)), '--popover': hsl(str(sp.card)),
    '--foreground': hsl(str(sp.text)), '--card-foreground': hsl(str(sp.text)), '--popover-foreground': hsl(str(sp.text)),
    '--muted-foreground': hsl(str(sp.muted)),
    '--border': hsl(str(sp.line)), '--input': hsl(str(sp.line)), '--muted': hsl(str(sp.line)), '--secondary': hsl(str(sp.line)),
    '--primary': hsl(str(sp.primary)), '--ring': hsl(str(sp.primary)),
  };
  const themed = Boolean(tokens['--background']);
  const style = Object.fromEntries(Object.entries(tokens).filter(([, v]) => v)) as CSSProperties;
  if (themed) style.fontFamily = 'var(--room-body), sans-serif';

  return (
    <div
      className={themed ? `h-dvh ${body.variable} ${display.variable} [&_h1]:font-normal [&_h1]:[font-family:var(--room-display),serif]` : 'h-dvh'}
      style={style}
    >
      <EmbeddableRoom slug={slug} theme={theme} />
    </div>
  );
}
