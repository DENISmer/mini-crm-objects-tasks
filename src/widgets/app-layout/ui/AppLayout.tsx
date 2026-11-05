import { LogOutIcon } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'

import { ROLE_LABELS } from '@/entities/profile'
import { useAuth, useCurrentProfile } from '@/features/auth'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button, buttonVariants } from '@/shared/ui/button'

const NAV_BY_ROLE = {
  manager: [{ to: '/objects', label: 'Объекты' }],
  executor: [
    { to: '/my-tasks', label: 'Мои задачи' },
    { to: '/objects', label: 'Объекты' },
  ],
} as const

export function AppLayout() {
  const profile = useCurrentProfile()
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link to="/" className="font-semibold tracking-tight">
            Мини-CRM
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_BY_ROLE[profile.role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' }))
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm sm:inline">{profile.full_name}</span>
            <Badge variant="outline">{ROLE_LABELS[profile.role]}</Badge>
            <Button variant="ghost" size="sm" onClick={() => void signOut()} aria-label="Выйти">
              <LogOutIcon />
              <span className="hidden sm:inline">Выйти</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
