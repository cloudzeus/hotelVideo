import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Building2 } from 'lucide-react';

export type LicenseInfo = {
  licensor: { name: string; address: string; serial: string; dateIssued: string };
  licensee:
    | { name: string; afm: string | null; address: string | null; city: string | null; zip: string | null; country: string | null; phone: string | null; email: string | null }
    | null;
};

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function LicenseSettings({ license }: { license: LicenseInfo }) {
  const { licensor, licensee } = license;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="h-5 w-5 text-primary" /> Στοιχεία πωλητή
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="Επωνυμία" value={licensor.name} />
          <Row label="Διεύθυνση" value={licensor.address} />
          <Row label="Σειριακός αριθμός" value={licensor.serial} />
          <Row label="Ημ/νία έκδοσης" value={licensor.dateIssued} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" /> Στοιχεία κατόχου άδειας
          </CardTitle>
        </CardHeader>
        <CardContent>
          {licensee ? (
            <>
              <Row label="Επωνυμία" value={licensee.name} />
              <Row label="ΑΦΜ" value={licensee.afm} />
              <Row label="Διεύθυνση" value={licensee.address} />
              <Row label="Πόλη" value={[licensee.zip, licensee.city].filter(Boolean).join(' ') || null} />
              <Row label="Χώρα" value={licensee.country} />
              <Row label="Τηλέφωνο" value={licensee.phone} />
              <Row label="Email" value={licensee.email} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Δεν έχει οριστεί προεπιλεγμένη εταιρία.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
