import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text">Page not found</h1>
      <p className="text-text-muted">That page doesn&apos;t exist.</p>
      <Link to="/">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  )
}
