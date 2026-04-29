'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

// IMPORT ICONE
import HomeIcon from '@mui/icons-material/Home';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import FoodBankIcon from '@mui/icons-material/FoodBank';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BackupIcon from '@mui/icons-material/Backup';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import WcIcon from '@mui/icons-material/Wc';
import AssessmentIcon from '@mui/icons-material/Assessment';
 
export default function DashboardLinks() {
  const pathname = usePathname();
  const { data: session } = useSession();
  let links = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
  ];

  if (session?.user?.name === 'SuperUser') {
  links = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'Menus', href: '/dashboard/menus', icon: MenuBookIcon },
    { name: 'Giornata Sagra', href: '/dashboard/sagra', icon: StorefrontIcon },
    { name: 'Camerieri', href: '/dashboard/camerieri', icon: WcIcon },
    { name: 'Cruscotto Piatti', href: '/dashboard/cruscottopiatti', icon: RestaurantOutlinedIcon },
    { name: 'Cruscotto di Sintesi', href: '/dashboard/cruscotto', icon: FoodBankIcon },
    { name: 'Cruscotto Gratis', href: '/dashboard/cruscottogratis', icon: AssessmentIcon },
    { name: 'Verifica Conti', href: '/dashboard/listaconti', icon: ChecklistRtlIcon },
    { name: 'Logs', href: '/dashboard/logs', icon: BackupIcon },
   
  ];
  } 

  
  
  return (
    <div className="flex justify-center w-full px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl">
        {links.map((link) => {
          const LinkIcon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                'group flex items-center gap-4 rounded-3xl p-5 transition-all duration-300 border-2 shadow-sm',
                'hover:shadow-xl hover:-translate-y-1 active:scale-95',
                isActive 
                  ? 'bg-orange-50 border-orange-400 text-orange-800' 
                  : 'bg-white border-slate-100 text-slate-700 hover:border-orange-200'
              )}
            >
              <div className={clsx(
                'flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 transition-transform group-hover:rotate-3',
                isActive ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600'
              )}>
                <LinkIcon className="w-7 h-7" />
              </div>
              <span className="font-black text-lg leading-tight whitespace-normal break-words">
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}