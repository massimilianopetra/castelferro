'use client';

import {
  UserGroupIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Antipasti', href: '/dashboard/antipasti', icon: UserGroupIcon },
  { name: 'Bevande', href: '/dashboard/bevande', icon: UserGroupIcon },
  { name: 'Casse', href: '/dashboard/casse', icon: UserGroupIcon },
  { name: 'Dolci', href: '/dashboard/dolci', icon: UserGroupIcon },
  { name: 'Primi', href: '/dashboard/primi', icon: UserGroupIcon },
  { name: 'Secondi', href: '/dashboard/secondi', icon: UserGroupIcon },
  { name: 'Birre', href: '/dashboard/birre', icon: UserGroupIcon },
];

export default function NavLinks() {
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
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
