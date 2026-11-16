import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatRelativeTime } from '@/lib/utils'

interface RecentMeetingsProps {
  meetings: any[]
}

export function RecentMeetings({ meetings }: RecentMeetingsProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Video className="h-5 w-5" />
          Πρόσφατες Συναντήσεις
        </CardTitle>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Καμία πρόσφατη συνάντηση
          </p>
        ) : (
          <div className="space-y-4">
            {meetings.slice(0, 5).map((meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
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
                  </div>
                </div>
              </Link>
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