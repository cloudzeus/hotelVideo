'use client';

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Video, BarChart3, Users, Building2 } from 'lucide-react'
import Link from 'next/link'
import { CreateMeetingButton } from '@/components/meetings/create-meeting-button'

interface QuickActionsProps {
  user: any
  users: any[]
  contacts: any[]
}

export function QuickActions({ user, users, contacts }: QuickActionsProps) {
  const isAdmin = user.role === 'Administrator'
  const isManager = user.role === 'Manager'

  const actions = [
    {
      id: 'create-meeting',
      title: 'Νέα Συνάντηση',
      description: 'Προγραμμάτισε νέα βιντεοκλήση',
      icon: Plus,
      href: '#',
      variant: 'default' as const,
    },
    {
      id: 'join-meeting',
      title: 'Σύνδεση σε Συνάντηση',
      description: 'Μπες σε υπάρχουσα συνάντηση',
      icon: Video,
      href: '/meetings',
      variant: 'outline' as const,
    },
    {
      id: 'view-stats',
      title: 'Στατιστικά',
      description: 'Δες χρήση και αναλυτικά',
      icon: BarChart3,
      href: '/statistics',
      variant: 'outline' as const,
    },
    ...(isManager || isAdmin ? [{
      id: 'manage-users',
      title: 'Διαχείριση Χρηστών',
      description: 'Πρόσθεσε ή επεξεργάσου χρήστες',
      icon: Users,
      href: '/users',
      variant: 'outline' as const,
    }] : []),
    ...(isAdmin ? [{
      id: 'manage-companies',
      title: 'Διαχείριση Εταιριών',
      description: 'Ρυθμίσεις και παραμετροποίηση εταιριών',
      icon: Building2,
      href: '/companies',
      variant: 'outline' as const,
    }] : []),
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Γρήγορες Ενέργειες</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon

            if (action.id === 'create-meeting') {
              return (
                <CreateMeetingButton
                  key={action.title}
                  user={user}
                  users={users}
                  contacts={contacts}
                  customTrigger={
                    <Button
                      variant={action.variant}
                      className="h-auto p-4 flex flex-col items-start gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 border-transparent shadow-[0_1px_2px_rgba(0,0,0,.2),0_4px_12px_rgba(0,120,212,.25)]"
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm text-primary-foreground/80">
                          {action.description}
                        </div>
                      </div>
                    </Button>
                  }
                />
              )
            }

            return (
              <Button
                key={action.title}
                asChild
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-start gap-2 border-border hover:bg-muted"
              >
                <Link href={action.href}>
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}