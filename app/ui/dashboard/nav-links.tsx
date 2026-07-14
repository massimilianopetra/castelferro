'use client';

import AccessibilityIcon from '@mui/icons-material/Accessibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CakeIcon from '@mui/icons-material/Cake';
import EuroIcon from '@mui/icons-material/Euro';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import CampaignIcon from '@mui/icons-material/Campaign';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import KebabDiningOutlinedIcon from '@mui/icons-material/KebabDiningOutlined';
import { ShoppingCartIcon } from '@heroicons/react/20/solid';
import KitchenIcon from '@mui/icons-material/Kitchen';
import TvIcon from '@mui/icons-material/Tv';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';

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
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'Gestione Termiche', href: '/dashboard/stampantitermiche', icon: LocalPrintshopIcon },
        { name: 'Casse', href: '/dashboard/casse', icon: EuroIcon },
        { name: 'Incassa Conti', href: '/dashboard/chiudiconti', icon: ShoppingCartIcon },
        { name: 'Verifica conti (aperti e chiusi)', href: '/dashboard/listaconti', icon: CheckCircleOutlineIcon },
        { name: 'Gestione Camerieri', href: '/dashboard/camerieri', icon: AccessibilityIcon },
      ];
      break;
    case 'SuperUser':
      links = [
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'Gestione', href: '/dashboard/gestione', icon: SettingsIcon },
        { name: 'Casse', href: '/dashboard/casse', icon: EuroIcon },
        { name: 'Incassa Conti', href: '/dashboard/chiudiconti', icon: ShoppingCartIcon },
        { name: 'Cucine', href: '/dashboard/bocche', icon: KitchenIcon },
        { name: 'Ingresso', href: '/dashboard/coda', icon: CampaignIcon },
      ];
      break;
    case 'Ingresso':
    case 'IngressoE':
      links = [
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'Gestione Termiche', href: '/dashboard/stampantitermiche', icon: LocalPrintshopIcon },        
        { name: 'Display', href: '/dashboard/display', icon: TvIcon },
        { name: 'Chiama', href: '/dashboard/chiama', icon: RecordVoiceOverIcon },
        { name: 'Distributore di Ticket', href: '/dashboard/distributore', icon: LocalActivityIcon },
      ];
      break;
    case 'Antipasti':
    case 'AntipastiE':
      
      links = [
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'Antipasti', href: '/dashboard/antipasti', icon: KebabDiningOutlinedIcon },]
      break;
    case 'Primi':
    case 'PrimiE':
      links = [
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'Primi', href: '/dashboard/primi', icon: DinnerDiningIcon },]
      break;
    case 'Secondi':
    case 'SecondiE':
      links = [
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'Secondi', href: '/dashboard/secondi', icon: RestaurantOutlinedIcon },]
      break;
    case 'Dolci':
    case 'DolciE':
      links = [
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'Dolci', href: '/dashboard/dolci', icon: CakeIcon },]
      break;
    case 'Bevande':
    case 'BevandeE':
      links = [
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'Bevande', href: '/dashboard/bevande', icon: LocalDrinkIcon },]
      break;
    case 'Birre':
    case 'BirreE':
      links = [
         { name: 'Home', href: '/dashboard', icon: HomeIcon },
         { name: 'Birre', href: '/dashboard/birre', icon: SportsBarIcon },
      
      ]
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
