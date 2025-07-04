import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import AcmeLogo from '@/app/ui/acme-logo';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from '@/auth';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-3 lg:px-2 sm:px-2">
      <Link
        className="hidden lg:mb-2 lg:h-32 lg:items-end lg:justify-start lg:rounded-sm lg:bg-blue-600 lg:p-4 force-display-flex" // 
        href="/"
      >
        <div className="w-32 text-white lg:w-64">
          <AcmeLogo />
        </div>
      </Link>
      
      <div className="flex grow flex-row justify-between space-x-2 lg:flex-col lg:space-x-0 lg:space-y-2 ">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-sm bg-gray-50 lg:block "></div>
        <form
          action={async () => {
            'use server';
            console.log("LOGOUT");
            await signOut();
          }}
        >
          <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-sm bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 lg:flex-none lg:justify-start lg:p-2 lg:px-3">
            <PowerIcon className="w-6" />
            <div className="hidden lg:block">Sign Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}
