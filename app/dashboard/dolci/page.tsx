import { auth } from '@/auth';

export default async function Page() {

    const session = await auth();
    console.log(session?.user?.name);

    if ((session?.user?.name == "Dolci") || (session?.user?.name == "SuperUser"))

        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <p className="text-5xl py-4">
                            Dolci
                        </p>
                    </div>
                    <div className=''>
                        <p>
                            Ciao bello
                        </p>
                    </div>
                </div>
            </main>

        )
    else
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <p className="text-5xl py-4">
                            Utente non autorizzato
                        </p>
                    </div>
                </div>
            </main>

        )

}