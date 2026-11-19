'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Network, Loader2, Plug, ShieldCheck, CalendarClock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanySettings } from './company-settings';
import { DepartmentHierarchy } from './department-hierarchy';
import { IntegrationSettings } from './integration-settings';
import { AvailabilitySettings } from './availability-settings';
import { LicenseSettings, type LicenseInfo } from './license-settings';

export function SettingsContent({ license }: { license: LicenseInfo }) {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('company');
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if there's a tab query parameter
    const tabParam = searchParams.get('tab');
    if (tabParam && ['company', 'departments', 'integrations', 'availability', 'license'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Simulate page loading completion
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchParams]);

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="text-lg font-medium">Φόρτωση ρυθμίσεων...</div>
          <div className="text-sm text-muted-foreground">Please wait while we prepare your settings</div>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="company" className="flex items-center space-x-2">
          <Building2 className="h-4 w-4" />
          <span>Εταιρία</span>
        </TabsTrigger>
        <TabsTrigger value="departments" className="flex items-center space-x-2">
          <Network className="h-4 w-4" />
          <span>Τμήματα</span>
        </TabsTrigger>
        <TabsTrigger value="integrations" className="flex items-center space-x-2">
          <Plug className="h-4 w-4" />
          <span>Integrations</span>
        </TabsTrigger>
        <TabsTrigger value="availability" className="flex items-center space-x-2">
          <CalendarClock className="h-4 w-4" />
          <span>Διαθεσιμότητα</span>
        </TabsTrigger>
        <TabsTrigger value="license" className="flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Άδεια χρήσης</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="company" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ρυθμίσεις Εταιρίας</CardTitle>
            <CardDescription>
              Όρισε προεπιλεγμένη εταιρία και διαχειρίσου προτιμήσεις
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanySettings />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="departments" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ιεραρχία Τμημάτων</CardTitle>
            <CardDescription>
              Διαχείριση δομής τμημάτων με drag & drop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentHierarchy />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Βιντεοκλήσεις (Stream.io), Bunny CDN, OpenRouter και Mailgun — κατάσταση και έλεγχοι σύνδεσης.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IntegrationSettings />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="availability" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ώρες εξυπηρέτησης</CardTitle>
            <CardDescription>
              Μέρες και ώρες εξυπηρέτησης — σπάνε σε slots των 30 λεπτών για τα ραντεβού από την ιστοσελίδα.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvailabilitySettings />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="license" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Άδεια χρήσης</CardTitle>
            <CardDescription>
              Στοιχεία πωλητή (από τη διαμόρφωση) και κατόχου άδειας (προεπιλεγμένη εταιρία).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LicenseSettings license={license} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 