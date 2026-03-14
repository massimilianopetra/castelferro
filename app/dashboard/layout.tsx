
import SideNav from '@/app/ui/dashboard/sidenav';
import { NextAuthProvider } from "@/app/ui/NextAuthProvider";


type Props = {
  children: React.ReactNode ;
};

export default function Layout({ children }: Props) {
  return (
    <NextAuthProvider>
      <div className="flex h-screen flex-col lg:flex-row lg:overflow-hidden bg-gray-50">
        <div className="w-full flex-none lg:w-64">
          <SideNav />
        </div>
        {/* Ridotto p-2 a p-1 su mobile, p-4 su desktop per massimizzare lo spazio */}
        <div className="flex-grow p-1 lg:p-4 lg:overflow-y-auto">
          {children}
        </div>  
      </div>
    </NextAuthProvider>
  );
}