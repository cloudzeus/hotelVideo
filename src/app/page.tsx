import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { getAuthSession } from '@/lib/auth';
import { getRecentMeetings, getUpcomingMeetings, getQuickStats } from '@/lib/data/meetings';
import { getCompanyStats } from '@/lib/data/companies';
import { getUserStats, getUsersByCompany } from '@/lib/data/users';
import { getContactsByCompany } from '@/lib/data/contacts';
import { NavigationWrapper } from '@/components/layout/navigation-wrapper';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentMeetings } from '@/components/dashboard/recent-meetings';
import { UpcomingMeetings } from '@/components/dashboard/upcoming-meetings';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { ActiveUsers } from '@/components/dashboard/active-users';

export default async function DashboardPage() {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      redirect('/login');
    }

    const user = session.user;
    const isAdmin = user.role === 'Administrator';
    const isManager = user.role === 'Manager';

    // Fetch data server-side based on user role
    const [
      recentMeetings,
      upcomingMeetings,
      meetingStats,
      companyStats,
      userStats,
      usersData,
      contacts
    ] = await Promise.all([
      getRecentMeetings(user.id, user.companyId, isAdmin),
      getUpcomingMeetings(user.id, user.companyId, isAdmin),
      getQuickStats(user.companyId, isAdmin, user.id),
      isAdmin ? getCompanyStats() : null,
      isAdmin ? getUserStats() : null,
      getUsersByCompany(user.companyId, true, { limit: 100 }), // Fetch up to 100 users for the modal/list
      getContactsByCompany(user.companyId),
    ]);

    const users = usersData.data;

    // Filter active users (seen in last 5 minutes)
    // Note: In a real app, you might want to use a more robust presence system (e.g. Redis, Websockets)
    // but checking lastSeen from DB is a good start
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = users.filter((u: any) =>
      u.lastSeen && new Date(u.lastSeen) > fiveMinutesAgo
    );

    return (
      <div className="min-h-screen bg-background app-shell">
        <NavigationWrapper user={user} />

        {/* Welcome header */}
        <div className="w-full bg-card border-b border-border px-8 py-5 mt-14 md:mt-0 flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-primary" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back, {user.firstName}
            </h1>
            <p className="text-sm text-muted-foreground">Here's what's happening across your villas today.</p>
          </div>
        </div>

        <main className="container-responsive py-6">
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions
              user={user}
              users={users}
              contacts={contacts}
            />

            {/* Statistics */}
            <DashboardStats
              meetingStats={meetingStats}
              companyStats={companyStats}
              userStats={userStats}
              isAdmin={isAdmin}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Column */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RecentMeetings meetings={recentMeetings} />
                  <UpcomingMeetings meetings={upcomingMeetings} />
                </div>

                {/* Additional sections based on role */}
                {isAdmin && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">System Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex justify-between p-3 bg-muted/50 rounded border border-border">
                        <span className="text-muted-foreground">Total Companies</span>
                        <span className="font-medium text-foreground">{companyStats?.totalCompanies || 0}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted/50 rounded border border-border">
                        <span className="text-muted-foreground">Active Users</span>
                        <span className="font-medium text-foreground">{userStats?.active || 0}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted/50 rounded border border-border">
                        <span className="text-muted-foreground">Total Meetings</span>
                        <span className="font-medium text-foreground">{meetingStats?.totalMeetings || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Column */}
              <div className="space-y-6">
                <ActiveUsers users={activeUsers} currentUser={user} />

                {isManager && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Department</h3>
                    <p className="text-muted-foreground text-sm">
                      Manage your department's meetings and team members.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    redirect('/login');
  }
}