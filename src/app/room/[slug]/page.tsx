import { prisma } from '@/lib/prisma';
import { EmbeddableRoom, type RoomTheme } from '@/components/room/embeddable-room';

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

  return (
    <div className="h-dvh">
      <EmbeddableRoom slug={slug} theme={theme} />
    </div>
  );
}
