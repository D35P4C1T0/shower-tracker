import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const KEY = 'shower-tracker-onboarding-complete'

export function OnboardingDialog() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(KEY) !== 'true' } catch { return false }
  })
  const finish = () => {
    try { localStorage.setItem(KEY, 'true') } catch { /* storage unavailable */ }
    setOpen(false)
  }
  if (import.meta.env.MODE === 'test') return null
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent data-testid="onboarding-dialog">
        <DialogHeader>
          <DialogTitle>Your private shower log</DialogTitle>
          <DialogDescription>Data stays on this device. No account or cloud sync.</DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Record showers, review history, and set personal goals.</li>
          <li>Export regular backups from Settings before clearing browser data.</li>
          <li>Offline tracking works. Reminders run only while app is open.</li>
        </ul>
        <DialogFooter><Button onClick={finish}>Get started</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
