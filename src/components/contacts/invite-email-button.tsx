'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Video, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function InviteEmailButton() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      toast.error('Μη έγκυρο email')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/video-invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Αποτυχία')
      toast.success('Η πρόσκληση στάλθηκε', { description: `Email προς ${email.trim()}. Ανοίγει η αίθουσα…` })
      if (data.link) window.open(data.link, '_blank')
      setOpen(false)
      setEmail('')
      setName('')
    } catch (e) {
      toast.error('Σφάλμα', { description: e instanceof Error ? e.message : 'Αποτυχία αποστολής' })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Video className="h-4 w-4" />
        Πρόσκληση σε email
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Πρόσκληση σε βιντεοκλήση</DialogTitle>
            <DialogDescription>
              Στείλε άμεσα σύνδεσμο βιντεοκλήσης σε οποιοδήποτε email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="guest@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Όνομα (προαιρετικό)</Label>
              <Input
                id="invite-name"
                placeholder="π.χ. Μαρία"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Άκυρο
            </Button>
            <Button onClick={send} disabled={sending} className="flex items-center gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              Αποστολή
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
