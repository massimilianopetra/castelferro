'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

// IMPORT MUI
import HomeIcon from '@mui/icons-material/Home';
import CakeIcon from '@mui/icons-material/Cake';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import KebabDiningOutlinedIcon from '@mui/icons-material/KebabDiningOutlined';

export default function DashboardLinksBocche() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  let links = [
    { name: 'Home', href: '/dashboard', icon: <HomeIcon sx={{ fontSize: 26 }} /> },
  ];

  if (session?.user?.name === 'SuperUser') {
    links = [
      { name: 'Home', href: '/dashboard', icon: <HomeIcon sx={{ fontSize: 26 }} /> },
      { name: 'Antipasti', href: '/dashboard/antipasti', icon: <KebabDiningOutlinedIcon sx={{ fontSize: 26 }} /> },
      { name: 'Primi', href: '/dashboard/primi', icon: <DinnerDiningIcon sx={{ fontSize: 26 }} /> },
      { name: 'Secondi', href: '/dashboard/secondi', icon: <RestaurantOutlinedIcon sx={{ fontSize: 26 }} /> },
      { name: 'Dolci', href: '/dashboard/dolci', icon: <CakeIcon sx={{ fontSize: 26 }} /> },
      { name: 'Bevande', href: '/dashboard/bevande', icon: <LocalDrinkIcon sx={{ fontSize: 26 }} /> },
      { name: 'Birre', href: '/dashboard/birre', icon: <SportsBarIcon sx={{ fontSize: 26 }} /> },
    ];
  }

  if (status === 'loading') return null;

  return (
    /* AGGIUNTE:
       - max-h-[calc(100vh-100px)]: limita l'altezza (es. 100vh meno header) per attivare scroll verticale
       - overflow-y-auto: abilita lo scroll verticale se i link sono troppi
       - overflow-x-auto: abilita lo scroll orizzontale se il menu è troppo largo
       - scrollbar-hide: (opzionale) se vuoi nascondere le barre antiestetiche
    */
    <nav className="flex flex-col gap-2 p-2 max-h-screen overflow-y-auto overflow-x-auto custom-scrollbar">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.name}
            href={link.href}
            // whitespace-nowrap impedisce al testo di andare a capo, forzando lo scroll orizzontale se necessario
            className={clsx(
              'group relative flex h-14 items-center gap-5 rounded-2xl px-5 transition-all duration-200 min-w-[200px] whitespace-nowrap',
              'text-slate-600 hover:bg-white hover:text-orange-600 hover:shadow-md',
              {
                'bg-orange-50 text-orange-700 shadow-sm ring-1 ring-orange-200': isActive,
              }
            )}
          >
            <div
              className={clsx(
                'flex items-center justify-center rounded-xl p-2.5 transition-colors shrink-0',
                isActive 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
                  : 'bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600'
              )}
            >
              {link.icon}
            </div>

            <span className={clsx(
              'flex-1 text-lg font-bold tracking-tight',
              isActive ? 'text-orange-800' : 'text-slate-700 group-hover:text-orange-700'
            )}>
              {link.name}
            </span>

            {isActive && (
              <span className="absolute right-4 h-3 w-3 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}