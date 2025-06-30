
import SideNav from '@/app/ui/dashboard/sidenav';
import { NextAuthProvider } from "@/app/ui/NextAuthProvider";


type Props = {
  children: React.ReactNode ;
};

export default  function Layout({ children }: Props) {
  return (
    <NextAuthProvider>
      <div className="flex h-screen flex-col lg:flex-row lg:overflow-hidden">
        <div className="w-full flex-none lg:w-64">
          <SideNav />
          
        </div>
        <div className="flex-grow p-2 lg:overflow-y-auto lg:p-2">{children}</div>  
      </div>
    </NextAuthProvider>
  );
}