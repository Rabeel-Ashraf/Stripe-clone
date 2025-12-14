import Link from "next/link"
import { usePathname } from "next/navigation"
import SidebarClient from "./SidebarClient"

interface NavItem {
  label: string
  href: string
  icon: string
}

interface SidebarProps {
  merchantName: string
  items: NavItem[]
  onLogout: () => Promise<void>
}

export function Sidebar({ merchantName, items, onLogout }: SidebarProps) {
  return (
    <SidebarClient
      merchantName={merchantName}
      items={items}
      onLogout={onLogout}
    />
  )
}
