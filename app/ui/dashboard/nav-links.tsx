'use client';

import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CakeIcon from '@mui/icons-material/Cake';
import EuroIcon from '@mui/icons-material/Euro';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import KebabDiningOutlinedIcon from '@mui/icons-material/KebabDiningOutlined';
import { LockOpenIcon, ShoppingCartIcon } from '@heroicons/react/20/solid';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react'
import clsx from 'clsx';

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.


export default function NavLinks() {
  const { data: session } = useSession();
  const pathname = usePathname();
  var links = undefined;

  switch (session?.user?.name) {
    case 'Casse':
      links = [
        { name: 'Gestione', href: '/dashboard/gestione', icon: SettingsIcon },
        { name: 'Casse', href: '/dashboard/casse', icon: EuroIcon },
        { name: 'Incassa Conti', href: '/dashboard/chiudiconti', icon: ShoppingCartIcon  },
        { name: 'Verifica conti (aperti e chiusi)', href: '/dashboard/listaconti', icon: CheckCircleOutlineIcon },       
        { name: 'Gestione Camerieri', href: '/dashboard/camerieri', icon: AccessibilityIcon },
       ];
      break;
    case 'SuperUser':
      links = [
        { name: 'Gestione', href: '/dashboard/gestione', icon: SettingsIcon },
        { name: 'Casse', href: '/dashboard/casse', icon: EuroIcon },
        { name: 'Incassa Conti', href: '/dashboard/chiudiconti', icon: ShoppingCartIcon  },
        { name: 'Antipasti', href: '/dashboard/antipasti', icon: KebabDiningOutlinedIcon },
        { name: 'Primi', href: '/dashboard/primi', icon: DinnerDiningIcon },
        { name: 'Secondi', href: '/dashboard/secondi', icon: RestaurantOutlinedIcon },
        { name: 'Dolci', href: '/dashboard/dolci', icon: CakeIcon },
        { name: 'Bevande', href: '/dashboard/bevande', icon: LocalDrinkIcon },
        { name: 'Birre', href: '/dashboard/birre', icon: SportsBarIcon },
      ];
      break;
    case 'Antipasti':
      links = [{ name: 'Antipasti', href: '/dashboard/antipasti', icon: KebabDiningOutlinedIcon },]
      break;
    case 'Primi':
      links = [{ name: 'Primi', href: '/dashboard/primi', icon: DinnerDiningIcon },]
      break;
    case 'Secondi':
      links = [{ name: 'Secondi', href: '/dashboard/secondi', icon: RestaurantOutlinedIcon },]
      break;
    case 'Dolci':
      links = [{ name: 'Dolci', href: '/dashboard/dolci', icon: CakeIcon },]
      break;
    case 'Bevande':
      links = [{ name: 'Bevande', href: '/dashboard/bevande', icon: LocalDrinkIcon },]
      break;
    case 'Birre':
      links = [{ name: 'Birre', href: '/dashboard/birre', icon: SportsBarIcon },]
      break;

    default:
      links = [{ name: 'Home', href: '/dashboard', icon: HomeIcon },]
  }
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
