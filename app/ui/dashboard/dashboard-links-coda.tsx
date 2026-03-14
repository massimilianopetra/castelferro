'use client';

import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { LockOpenIcon, ShoppingCartIcon } from '@heroicons/react/20/solid';
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
import FoodBankIcon from '@mui/icons-material/FoodBank';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useSession } from 'next-auth/react'


// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
//const links = [
//  { name: 'Gestione Menu', href: '/dashboard/menus', icon: WrenchScrewdriverIcon },
//  { name: 'Apertura-Chiusura Giornata Sagra', href: '/dashboard/sagra', icon: LockOpenIcon },
//  { name: 'Gestione Camerieri', href: '/dashboard/camerieri', icon: AccessibilityIcon },
//  { name: 'Verifica conti (aperti e chiusi)', href: '/dashboard/listaconti', icon: CheckCircleOutlineIcon },
//  { name: 'Cruscotto di sintesi', href: '/dashboard/cruscotto', icon: EuroIcon },
// { name: 'Cruscotto di sintesi: conti omaggio', href: '/dashboard/cruscottogratis', icon: CardGiftcardIcon },
//  { name: 'Logs', href: '/dashboard/logs', icon: AutoStoriesIcon },
//  
//];

export default function DashboardLinksCoda() {
  const pathname = usePathname();
  const { data: session } = useSession();
  var links = undefined;

  switch (session?.user?.name) {
    case 'SuperUser':
      links = [
        { name: 'Contatore', href: '/dashboard/contatore', icon: EuroIcon },
        { name: 'Telecomando', href: '/dashboard/telecomando', icon: FoodBankIcon },
        { name: 'Distributore', href: '/dashboard/distributore', icon: CardGiftcardIcon },
        { name: 'Statistiche', href: '/dashboard/statistiche', icon: AutoStoriesIcon },
      ];
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
            <LinkIcon className="w-5" />
            <p>{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
