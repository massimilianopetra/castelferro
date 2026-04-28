'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

// IMPORT ICONE
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

export default function DashboardLinks() {
  const pathname = usePathname();
  const { data: session } = useSession();
  let links = [];

  switch (session?.user?.name) {
    case 'Casse':
      links = [
        { name: 'Apertura-Chiusura Giornata Sagra', href: '/dashboard/sagra', icon: LockOpenIcon },
        { name: 'Configura Menu', href: '/dashboard/menus', icon: WrenchScrewdriverIcon },
        { name: 'Cruscotto di sintesi', href: '/dashboard/cruscotto', icon: EuroIcon },
        { name: 'Cruscotto di sintesi: piatti', href: '/dashboard/cruscottopiatti', icon: FoodBankIcon },
      ];
      break;
    case 'SuperUser':
      links = [
        { name: 'Apertura-Chiusura Giornata Sagra', href: '/dashboard/sagra', icon: LockOpenIcon },
        { name: 'Gestione Menu', href: '/dashboard/menus', icon: WrenchScrewdriverIcon },
        { name: 'Gestione Camerieri', href: '/dashboard/camerieri', icon: AccessibilityIcon },
        { name: 'Verifica conti (aperti e chiusi)', href: '/dashboard/listaconti', icon: CheckCircleOutlineIcon },
        { name: 'Cruscotto di sintesi', href: '/dashboard/cruscotto', icon: EuroIcon },
        { name: 'Cruscotto di sintesi: piatti', href: '/dashboard/cruscottopiatti', icon: FoodBankIcon },
        { name: 'Cruscotto di sintesi: conti omaggio', href: '/dashboard/cruscottogratis', icon: CardGiftcardIcon },
        { name: 'Logs', href: '/dashboard/logs', icon: AutoStoriesIcon },
        { name: 'Coda', href: '/dashboard/coda', icon: AutoStoriesIcon },       
      ];
      break;
    case 'Antipasti':
      links = [{ name: 'Antipasti', href: '/dashboard/antipasti', icon: KebabDiningOutlinedIcon }];
      break;
    case 'Primi':
      links = [{ name: 'Primi', href: '/dashboard/primi', icon: DinnerDiningIcon }];
      break;
    case 'Secondi':
      links = [{ name: 'Secondi', href: '/dashboard/secondi', icon: RestaurantOutlinedIcon }];
      break;
    case 'Dolci':
      links = [{ name: 'Dolci', href: '/dashboard/dolci', icon: CakeIcon }];
      break;
    case 'Bevande':
      links = [{ name: 'Bevande', href: '/dashboard/bevande', icon: LocalDrinkIcon }];
      break;
    case 'Birre':
      links = [{ name: 'Birre', href: '/dashboard/birre', icon: SportsBarIcon }];
      break;
    default:
      links = [{ name: 'Home', href: '/dashboard', icon: HomeIcon }];
  }

  return (
    <nav className="flex flex-col gap-3 p-2 overflow-x-auto custom-scrollbar">
       {links.map((link) => {
        const LinkIcon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              // Layout: centrato, altezza fissa, bordi arrotondati
              'group relative flex h-14 items-center gap-5 rounded-2xl px-5 transition-all duration-200 min-w-[280px] whitespace-nowrap',
              'text-slate-600 hover:bg-white hover:text-orange-600 hover:shadow-md',
              {
                'bg-orange-50 text-orange-700 shadow-sm ring-1 ring-orange-200': isActive,
              }
            )}
          >
            {/* Contenitore Icona */}
            <div
              className={clsx(
                'flex items-center justify-center rounded-xl p-2.5 transition-colors shrink-0',
                isActive 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
                  : 'bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600'
              )}
            >
              <LinkIcon className="w-6 h-6" />
            </div>

            {/* Nome del Link */}
            <span className={clsx(
              'flex-1 text-lg font-bold tracking-tight',
              isActive ? 'text-orange-800' : 'text-slate-700 group-hover:text-orange-700'
            )}>
              {link.name}
            </span>

            {/* Indicatore Attivo (pallino a destra) */}
            {isActive && (
              <span className="absolute right-4 h-3 w-3 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}