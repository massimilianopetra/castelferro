
import DashboardLinks from '@/app/ui/dashboard/dashboard-links';

export default async function Page() {


    return (
        <main>
            <div className="flex flex-wrap flex-col">
                <div className='text-center '>
                    <p className="text-5xl py-4">
                        Home
                    </p>
                </div>

                <DashboardLinks/>

            </div>
        </main>

    );
}