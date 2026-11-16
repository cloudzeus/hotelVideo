"use client"

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ClipboardList,
  CalendarClock,
  Home,
  Video,
  Building2,
  Users,
  BarChart3,
  LogOut,
  User,
  Menu,
  UserPlus,
  Settings,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  user: any
}

interface Company {
  id: string
  name: string
  default: boolean
}

const Logo = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <div
    className={cn(
      'bg-brand rounded-lg shadow-[0_1px_2px_rgba(0,0,0,.3),0_2px_8px_rgba(227,30,42,.25)] shrink-0',
      size === 'sm' ? 'p-1.5' : 'p-2',
    )}
  >
    <svg
      className={cn('text-brand-foreground', size === 'sm' ? 'w-5 h-5' : 'w-6 h-6')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="10,9 10,15 15,12" fill="currentColor" stroke="none" />
    </svg>
  </div>
)

export function Navigation({ user }: NavigationProps) {
  const [open, setOpen] = useState(false) // mobile drawer
  const [collapsed, setCollapsed] = useState(false) // desktop rail
  const [defaultCompany, setDefaultCompany] = useState<Company | null>(null)
  const pathname = usePathname()

  // restore collapsed preference
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('sb-collapsed') === '1')
    } catch {}
  }, [])

  // keep the page content offset in sync with the rail width (used by .app-shell in globals.css)
  useEffect(() => {
    document.documentElement.style.setProperty('--sb-w', collapsed ? '4rem' : '18rem')
    try {
      localStorage.setItem('sb-collapsed', collapsed ? '1' : '0')
    } catch {}
  }, [collapsed])

  useEffect(() => {
    fetch('/api/settings/default-company', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDefaultCompany(d.defaultCompany))
      .catch(() => {})
  }, [])

  useEffect(() => setOpen(false), [pathname]) // close drawer on nav

  const handleSignOut = () => signOut({ callbackUrl: '/login' })

  const navigationItems = [
    { href: '/', label: 'Πίνακας', icon: Home },
    { href: '/meetings', label: 'Συναντήσεις', icon: Video },
    { href: '/recordings', label: 'Εγγραφές', icon: FileText },
    { href: '/companies', label: 'Εταιρίες', icon: Building2 },
    { href: '/contacts', label: 'Επαφές', icon: UserPlus },
    { href: '/service-requests', label: 'Αιτήματα', icon: ClipboardList },
    { href: '/appointments', label: 'Ραντεβού', icon: CalendarClock },
    { href: '/users', label: 'Χρήστες', icon: Users },
    { href: '/statistics', label: 'Στατιστικά', icon: BarChart3 },
    { href: '/settings', label: 'Ρυθμίσεις', icon: Settings },
  ]

  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`
  // on desktop, rail collapses to icons; on mobile the drawer is always full width
  const railW = collapsed ? 'md:w-16' : 'md:w-72'

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-50 flex items-center justify-between px-4 bg-sidebar/95 backdrop-blur border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-semibold tracking-tight text-sidebar-foreground">Ephyria</span>
        </Link>
        <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {open && <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />}

      {/* Sidebar / rail */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-72 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200',
          railW,
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Brand + collapse toggle */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-sidebar-border shrink-0',
            collapsed ? 'md:justify-center md:px-0 px-5 gap-2' : 'px-5 gap-2',
          )}
        >
          <Logo />
          {!collapsed && (
            <span className="font-semibold text-lg tracking-tight text-sidebar-foreground flex-1 truncate">
              Ephyria Concierge
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            onClick={() => setCollapsed((c) => !c)}
            className={cn('hidden md:inline-flex text-muted-foreground', collapsed && 'md:hidden')}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* expand affordance when collapsed */}
        {collapsed && (
          <button
            aria-label="Expand menu"
            onClick={() => setCollapsed(false)}
            className="hidden md:flex items-center justify-center h-9 mx-2 mt-2 rounded-md text-muted-foreground hover:bg-sidebar-accent"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        {/* Nav (no inner scroller — DG rule) */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md text-[15px] font-medium transition-colors px-3 py-2.5',
                  collapsed && 'md:justify-center md:px-0',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-3 rounded-md p-2 hover:bg-sidebar-accent transition-colors text-left',
                  collapsed && 'md:justify-center',
                )}
              >
                <span className="h-9 w-9 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm">
                  {initials}
                </span>
                <span className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
                  <span className="block text-sm font-medium truncate text-sidebar-foreground">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="block text-xs truncate text-muted-foreground">
                    {defaultCompany?.name || user.companyName || user.email}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start" side="top" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" /> Προφίλ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/license" className="flex items-center">Άδεια</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Αποσύνδεση
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}
