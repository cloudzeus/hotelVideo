'use client'

import { Navigation } from './navigation'

interface NavigationWrapperProps {
    user: any
}

export function NavigationWrapper({ user }: NavigationWrapperProps) {
    return <Navigation user={user} />
}
