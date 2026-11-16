import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Video, Building2, BarChart3 } from 'lucide-react'

interface DashboardStatsProps {
  meetingStats: any
  companyStats: any
  userStats: any
  isAdmin: boolean
}

export function DashboardStats({ meetingStats, companyStats, userStats, isAdmin }: DashboardStatsProps) {
  const stats = [
    {
      title: 'Σύνολο Συναντήσεων',
      value: meetingStats?.totalMeetings || 0,
      icon: Video,
      description: 'Όλες οι συναντήσεις',
    },
    {
      title: 'Ενεργοί Χρήστες',
      value: userStats?.activeUsers || 0,
      icon: Users,
      description: 'Ενεργοί τώρα',
    },
    ...(isAdmin ? [{
      title: 'Εταιρίες',
      value: companyStats?.totalCompanies || 0,
      icon: Building2,
      description: 'Σύνολο εταιριών',
    }] : []),
    {
      title: 'Αυτόν τον Μήνα',
      value: meetingStats?.monthlyMeetings || 0,
      icon: BarChart3,
      description: 'Συναντήσεις αυτόν τον μήνα',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 