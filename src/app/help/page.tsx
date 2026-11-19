import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { getAuthSession } from '@/lib/auth';
import { Navigation } from '@/components/layout/navigation';
import {
  LayoutDashboard, Users, CalendarClock, ClipboardList, Video, Settings, Plug, ShieldCheck, PhoneIncoming, LogIn,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Βοήθεια | hotelVideo', description: 'Οδηγίες χρήσης της εφαρμογής' };

type Step = string;
type Section = { id: string; icon: typeof Users; title: string; intro: string; steps: Step[]; shot?: string; shotAlt?: string };

const SECTIONS: Section[] = [
  {
    id: 'login', icon: LogIn, title: 'Σύνδεση',
    intro: 'Η πρόσβαση γίνεται με email και κωδικό του λογαριασμού σας.',
    steps: [
      'Ανοίξτε την εφαρμογή και συμπληρώστε το email και τον κωδικό σας.',
      'Μετά τη σύνδεση εμφανίζεται ο Πίνακας με τη συνολική εικόνα.',
      'Ο ρόλος σας (Διαχειριστής / Υπεύθυνος / Υπάλληλος) καθορίζει τι μπορείτε να αλλάξετε.',
    ],
  },
  {
    id: 'dashboard', icon: LayoutDashboard, title: 'Πίνακας',
    intro: 'Η αρχική οθόνη με γρήγορες ενέργειες και στατιστικά.',
    steps: [
      'Γρήγορες Ενέργειες: νέα συνάντηση, σύνδεση σε συνάντηση, στατιστικά, διαχείριση χρηστών/εταιριών.',
      'Κάρτες σύνοψης: συναντήσεις, ενεργοί χρήστες, εταιρίες, συναντήσεις του μήνα.',
      'Γραφήματα: συνεδρίες concierge, αιτήματα ανά κατηγορία, ραντεβού ανά φάση.',
    ],
    shot: 'dashboard.jpg', shotAlt: 'Πίνακας',
  },
  {
    id: 'contacts', icon: Users, title: 'Επαφές',
    intro: 'Οι επαφές (πελάτες/επισκέπτες) και οι συσχετίσεις τους με εταιρίες.',
    steps: [
      'Προσθήκη επαφής με το κουμπί «Add Contact».',
      'Στο μενού ενεργειών κάθε επαφής (⋯): Επεξεργασία, Διαγραφή και «Πρόσκληση σε βιντεοκλήση» (στέλνει email με σύνδεσμο).',
      'Με το «Πρόσκληση σε email» (πάνω δεξιά) στέλνετε άμεση πρόσκληση σε οποιαδήποτε διεύθυνση.',
    ],
    shot: 'contacts.jpg', shotAlt: 'Επαφές',
  },
  {
    id: 'appointments', icon: CalendarClock, title: 'Ραντεβού (Concierge)',
    intro: 'Ο επισκέπτης κλείνει ραντεβού από την ιστοσελίδα· εσείς το επιβεβαιώνετε και η κλήση γίνεται την ώρα του ραντεβού.',
    steps: [
      'Τα αιτήματα από την ιστοσελίδα εμφανίζονται ως «Αιτήθηκε» (REQUESTED).',
      'Όταν φτάνει νέο αίτημα, εμφανίζεται παράθυρο ειδοποίησης με επιλογή «Αποδοχή».',
      'Με την αποδοχή το ραντεβού γίνεται «Επιβεβαιώθηκε», δημιουργείται η αίθουσα και στέλνεται σύνδεσμος + ώρα στον επισκέπτη με email.',
      'Την ώρα του ραντεβού πατάτε «Σύνδεση βίντεο» για να μπείτε στην κλήση.',
    ],
    shot: 'appointments.jpg', shotAlt: 'Ραντεβού',
  },
  {
    id: 'instant', icon: PhoneIncoming, title: 'Άμεση κλήση',
    intro: 'Όταν ο επισκέπτης πατήσει «Μίλα τώρα» στην ιστοσελίδα, ζητά άμεση εξυπηρέτηση.',
    steps: [
      'Εμφανίζεται παράθυρο «Εισερχόμενη κλήση τώρα».',
      'Πατάτε «Σύνδεση τώρα» και μπαίνετε αμέσως στην αίθουσα για να εξυπηρετήσετε τον επισκέπτη.',
      'Οι εκκρεμείς άμεσες κλήσεις φαίνονται και στα «Αιτήματα Εξυπηρέτησης».',
    ],
  },
  {
    id: 'service-requests', icon: ClipboardList, title: 'Αιτήματα Εξυπηρέτησης',
    intro: 'Αιτήματα πελατών που προκύπτουν από τις βιντεοκλήσεις concierge.',
    steps: [
      'Κάθε αίτημα έχει κατηγορία, πηγή και κατάσταση (Ανοιχτό / Σε εξέλιξη / Επιλύθηκε).',
      'Αλλάξτε την κατάσταση από το αντίστοιχο μενού καθώς εξυπηρετείτε το αίτημα.',
    ],
    shot: 'service-requests.jpg', shotAlt: 'Αιτήματα Εξυπηρέτησης',
  },
  {
    id: 'call', icon: Video, title: 'Βιντεοκλήση',
    intro: 'Η αίθουσα ανοίγει ως παράθυρο (modal) πάνω στην εφαρμογή· κλείνοντάς το επιστρέφετε στον Πίνακα.',
    steps: [
      'Πριν μπείτε, βλέπετε την κάρτα εισόδου με την κατάσταση («Ένας concierge είναι online») και βάζετε το όνομά σας.',
      'Μέσα στην κλήση: ανοιγοκλείνετε κάμερα/μικρόφωνο, κοινή χρήση οθόνης, εγγραφή και αποχώρηση από τα χειριστήρια κάτω.',
      'Πάνω φαίνονται το ξενοδοχείο, η κατάσταση, ο αριθμός συμμετεχόντων και ο χρόνος.',
    ],
    shot: 'room-incall.jpg', shotAlt: 'Βιντεοκλήση',
  },
  {
    id: 'integrations', icon: Plug, title: 'Ρυθμίσεις · Integrations',
    intro: 'Σύνδεση με τις υπηρεσίες: βιντεοκλήσεις (Stream), αποθήκευση (Bunny CDN), AI (OpenRouter) και email (Mailgun).',
    steps: [
      'Συμπληρώστε τα κλειδιά κάθε υπηρεσίας και πατήστε «Έλεγχος σύνδεσης».',
      'Το κουμπί «Αποθήκευση» κρατά τις τιμές· αφήστε ένα μυστικό κενό για να διατηρηθεί η τρέχουσα τιμή.',
    ],
    shot: 'integrations.jpg', shotAlt: 'Integrations',
  },
  {
    id: 'availability', icon: Settings, title: 'Ρυθμίσεις · Διαθεσιμότητα',
    intro: 'Οι μέρες και ώρες εξυπηρέτησης που βλέπει ο επισκέπτης όταν κλείνει ραντεβού.',
    steps: [
      'Ενεργοποιήστε/απενεργοποιήστε κάθε μέρα και ορίστε ώρα έναρξης και λήξης (24ωρη μορφή).',
      'Οι ώρες σπάνε αυτόματα σε διαθέσιμα slots των 30 λεπτών.',
      'Πατήστε «Αποθήκευση» για να ισχύσουν στην ιστοσελίδα.',
    ],
    shot: 'availability.jpg', shotAlt: 'Διαθεσιμότητα',
  },
  {
    id: 'license', icon: ShieldCheck, title: 'Ρυθμίσεις · Άδεια χρήσης',
    intro: 'Στοιχεία πωλητή και κατόχου της άδειας χρήσης της εφαρμογής.',
    steps: [
      'Τα στοιχεία πωλητή προέρχονται από τη διαμόρφωση του συστήματος.',
      'Τα στοιχεία κατόχου άδειας είναι τα στοιχεία της προεπιλεγμένης εταιρίας.',
    ],
    shot: 'license.jpg', shotAlt: 'Άδεια χρήσης',
  },
];

export default async function HelpPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen bg-background app-shell">
      <Navigation user={session.user} />
      <main className="container-responsive py-6 pt-16 md:pt-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">Οδηγίες χρήσης</h1>
            <p className="text-muted-foreground">Σύντομος οδηγός για όλες τις λειτουργίες της εφαρμογής.</p>
          </header>

          <nav className="rounded-lg border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Περιεχόμενα</h2>
            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <s.icon className="h-4 w-4" /> {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20 space-y-3">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <s.icon className="h-5 w-5 text-primary" /> {s.title}
              </h2>
              <p className="text-muted-foreground">{s.intro}</p>
              <ol className="ml-5 list-decimal space-y-1.5 text-sm">
                {s.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              {s.shot ? (
                <div className="overflow-hidden rounded-lg border shadow-sm">
                  <Image src={`/help/${s.shot}`} alt={s.shotAlt ?? s.title} width={1280} height={820} className="w-full" />
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
