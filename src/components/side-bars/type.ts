import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  label: string;
  pathname: string;
  icon?: LucideIcon;
  subMenu?: {
    label: string;
    pathname: string;
    icon?: LucideIcon;
  }[];
}