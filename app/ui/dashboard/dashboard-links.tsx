'use client';

import {
  HomeIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LockOpenIcon } from '@heroicons/react/20/solid';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import EuroIcon from '@mui/icons-material/Euro';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Gestione Menu', href: '/dashboard/menus', icon: WrenchScrewdriverIcon },
  { name: 'Apertura-Chiusura Giornata Sagra', href: '/dashboard/sagra', icon: LockOpenIcon },
  { name: 'Gestione Camerieri', href: '/dashboard/camerieri', icon: AccessibilityIcon },
  { name: 'Verifica conti (aperti e chiusi)', href: '/dashboard/listaconti', icon: CheckCircleOutlineIcon },
  { name: 'Cruscotto di sintesi', href: '/dashboard/cruscotto', icon: EuroIcon },
];

export default function DashboardLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link 
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
              },
            )}
          >
            <LinkIcon className="w-5" />
            <p>{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
