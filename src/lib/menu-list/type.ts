import { LucideIcon } from 'lucide-react'

export type Submenu = {
    href: string
    label: string
    description?: string
    hidden?: boolean
}

export type Menu = {
    href: string
    label: string
    icon: LucideIcon
    menus?: Submenu[]
    description?: string
    hidden?: boolean
}

export type Group = {
    label: string
    menus: Menu[]
}
