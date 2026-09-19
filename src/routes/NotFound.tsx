import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { AnimatedHeading } from '@/components/ui/AnimatedHeading'
import { playBack } from '@/lib/sound/sfx'

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <AnimatedHeading
        as="h1"
        text="Page not found"
        className="font-display text-3xl font-semibold tracking-tight text-text"
        radius={130}
      />
      <p className="text-text-muted">That page doesn&apos;t exist.</p>
      <Link to="/">
        <Button onClick={() => playBack()}>Back to Dashboard</Button>
      </Link>
    </div>
  )
}
