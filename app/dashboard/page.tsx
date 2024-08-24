import { auth } from '@/auth';

export default async function Page() {

    const session = await auth();

    return (
        <main>
            <div className="flex flex-wrap flex-col">
                <div className='text-center '>
                    <p className="text-5xl py-4">
                        Dashboard
                    </p>
                </div>
                <div className=''>
                    <p>
                        Logged user: {`${session?.user?.name}`}
                    </p>
                </div>
            </div>
        </main>

    );
}