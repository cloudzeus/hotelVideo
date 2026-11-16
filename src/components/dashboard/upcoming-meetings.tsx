import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatRelativeTime } from '@/lib/utils'

interface UpcomingMeetingsProps {
  meetings: any[]
}

export function UpcomingMeetings({ meetings }: UpcomingMeetingsProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5" />
          Επερχόμενες Συναντήσεις
        </CardTitle>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Καμία επερχόμενη συνάντηση
          </p>
        ) : (
          <div className="space-y-4">
            {meetings.slice(0, 5).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate text-foreground">{meeting.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(meeting.startTime)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(meeting.startTime)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {meeting.participants?.length || 0} participants
                    </div>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/meetings/${meeting.id}`}>
                    Join
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}

        {meetings.length > 5 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button asChild variant="outline" className="w-full border-border text-muted-foreground hover:bg-muted hover:text-foreground">
              <Link href="/meetings">
                View All Meetings
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}