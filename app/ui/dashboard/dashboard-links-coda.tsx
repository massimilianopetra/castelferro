'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

// IMPORT MUI
import HomeIcon from '@mui/icons-material/Home';
import EuroIcon from '@mui/icons-material/Euro';
import FoodBankIcon from '@mui/icons-material/FoodBank';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';

export default function DashboardLinksCoda() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  let links = [
    { name: 'Home', href: '/dashboard', icon: <HomeIcon sx={{ fontSize: 24 }} /> },
  ];

  if (session?.user?.name === 'SuperUser') {
    links = [
      { name: 'Home', href: '/dashboard', icon: <HomeIcon sx={{ fontSize: 24 }} /> },
      { name: 'Display', href: '/dashboard/display', icon: <EuroIcon sx={{ fontSize: 24 }} /> },
      { name: 'Chiama', href: '/dashboard/chiama', icon: <FoodBankIcon sx={{ fontSize: 24 }} /> },
      { name: 'Distributore di Ticket', href: '/dashboard/distributore', icon: <CardGiftcardIcon sx={{ fontSize: 24 }} /> },
    ];
  }

  if (status === 'loading') return null;

  return (
    /* AGGIUNTE:
       - overflow-y-auto: scroll verticale
       - overflow-x-auto: scroll orizzontale
       - custom-scrollbar: per lo stile personalizzato (se aggiunto al CSS)
    */
    <nav className="flex flex-col gap-2 p-2 max-h-screen overflow-y-auto overflow-x-auto custom-scrollbar">
      {/* sticky top-0: mantiene l'etichetta visibile durante lo scroll verticale. 
         bg-inherit assicura che lo sfondo sia coerente.
      */}
      <p className="px-5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 italic sticky top-0 bg-white dark:bg-transparent z-10 whitespace-nowrap">
        Area Gestione Code
      </p>

      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.name}
            href={link.href}
            /* min-w-max: assicura che il link non si restringa, forzando lo scroll orizzontale 
               whitespace-nowrap: evita che il testo vada a capo
            */
            className={clsx(
              'group relative flex h-14 min-h-[56px] min-w-max items-center gap-4 rounded-2xl px-4 transition-all duration-200 outline-none flex-shrink-0 whitespace-nowrap',
              'text-slate-600 hover:bg-white hover:text-orange-600 hover:shadow-md',
              'focus:bg-orange-50 focus:text-orange-700',
              {
                'bg-orange-50 text-orange-700 shadow-sm ring-1 ring-orange-200': isActive,
                'bg-transparent': !isActive
              }
            )}
          >
            {/* ICON CONTAINER */}
            <div
              className={clsx(
                'flex items-center justify-center rounded-xl p-2 transition-all duration-200 flex-shrink-0',
                isActive 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
                  : 'bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600'
              )}
            >
              {link.icon}
            </div>

            {/* LABEL */}
            <span className={clsx(
              'flex-1 font-bold tracking-tight transition-colors',
              'text-base md:text-lg', 
              isActive ? 'text-orange-800' : 'text-slate-700 group-hover:text-orange-700'
            )}>
              {link.name}
            </span>

            {/* ACTIVE INDICATOR */}
            {isActive && (
              <span className="ml-4 h-2 w-2 rounded-full bg-orange-600 flex-shrink-0 shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}