'use client';

import EuroIcon from '@mui/icons-material/Euro';
import CakeIcon from '@mui/icons-material/Cake';
import HomeIcon from '@mui/icons-material/Home';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import KebabDiningOutlinedIcon from '@mui/icons-material/KebabDiningOutlined';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Casse', href: '/dashboard/casse', icon: EuroIcon },
  { name: 'Antipasti', href: '/dashboard/antipasti', icon: KebabDiningOutlinedIcon },
  { name: 'Primi', href: '/dashboard/primi', icon: DinnerDiningIcon },
  { name: 'Secondi', href: '/dashboard/secondi', icon: RestaurantOutlinedIcon },
  { name: 'Dolci', href: '/dashboard/dolci', icon: CakeIcon },
  { name: 'Bevande', href: '/dashboard/bevande', icon: LocalDrinkIcon },
  { name: 'Birre', href: '/dashboard/birre', icon: SportsBarIcon },
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
              'flex h-[48px] grow items-center justify-center gap-2 rounded-lg bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 lg:flex-none lg:justify-start lg:p-2 lg:px-3',
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden lg:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
