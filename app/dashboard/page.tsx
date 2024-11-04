
import DashboardLinks from '@/app/ui/dashboard/dashboard-links';

export default async function Page() {


    return (
        <main>
            <div className="flex flex-wrap flex-col ">
                <div className='text-center '>
                    <p className="text-5xl py-4">
                        Home
                    </p>
                </div>
                <div className="bg-red-500 sm:bg-green-500 lg:bg-blue-500 lg:bg-pink-500 xl:bg-teal-500"></div>
                <DashboardLinks/>

            </div>
        </main>

    );
}