import SideNav from '@/app/ui/dashboard/sidenav';
import { NextAuthProvider } from "@/app/ui/NextAuthProvider";
 
type Props = {
  children: React.ReactNode ;
};

export default function Layout({ children }: Props) {
  return (
    <NextAuthProvider>
         <div className="flex h-screen flex-col lg:flex-row overflow-hidden bg-gray-50">
          <div className="w-full flex-none lg:w-64">
            <SideNav />
          </div>
          
          <div className="flex-grow p-1 lg:p-4 overflow-y-auto lg:overflow-hidden">
            {children}
          </div>  
        </div>
      </NextAuthProvider>
  );
}