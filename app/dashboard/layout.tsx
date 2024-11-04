
import SideNav from '@/app/ui/dashboard/sidenav';
import { NextAuthProvider } from "@/app/ui/NextAuthProvider";


type Props = {
  children: React.ReactNode ;
};

export default  function Layout({ children }: Props) {
  return (
    <NextAuthProvider>
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="w-full flex-none md:w-64">
          <SideNav />
          
        </div>
        <div className="bg-red-500 sm:bg-green-500 md:bg-blue-500 lg:bg-pink-500 xl:bg-teal-500">sss</div>
        <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
      </div>
    </NextAuthProvider>
  );
}