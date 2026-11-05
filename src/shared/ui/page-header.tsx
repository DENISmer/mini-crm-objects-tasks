import { ArrowLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { buttonVariants } from '@/shared/ui/button'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  backTo?: { to: string; label: string }
  actions?: ReactNode
}

export function PageHeader({ title, description, backTo, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      {backTo ? (
        <Link
          to={backTo.to}
          className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' w-fit'}
        >
          <ArrowLeftIcon />
          {backTo.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
