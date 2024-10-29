'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import type { DbMenu } from '@/app/lib/definitions';
import { getMenu, updatetMenu, setMenuAllAvailable } from '@/app/lib/actions';
import TabellaMenu from '@/app/ui/dashboard/TabellaMenu';
import { Button } from '@mui/material';


export default function Page() {
    const [products, setProducts] = useState<DbMenu[]>([]);
    const { data: session } = useSession();

    useEffect(() => {
        const fetchData = async () => {
            const menus = await getMenu();
            if (menus) setProducts(menus);
        };

        const fetchAuth = async () => {
            //const session = await auth();
        };

        fetchData();
        fetchAuth();
    }, []);

    const handleToggle = (id: number) => {
        const newProducts = products.map((item) => {
            if (item.id == id) {
                console.log(item);
                if (item.disponibile == "N") {
                    updatetMenu({ ...item, disponibile: "Y" });
                    return ({ ...item, disponibile: "Y" });
                }
                else {
                    updatetMenu({ ...item, disponibile: "N" });
                    return ({ ...item, disponibile: "N" });
                }
            }
            else
                return (item);
        });
        setProducts(newProducts);
    };

    const handleButtonClickInvia = async () => {
        const newProducts = products.map((item) => {
            return ({ ...item, disponibile: "Y" });
        });
        await setMenuAllAvailable()
        setProducts(newProducts);
    }

    //const session = await auth();
    //console.log(session?.user?.name);

    console.log("*********************");
    console.log(session?.user?.name);
    console.log("*********************");
    if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <p className="text-5xl py-4">
                            Menu
                        </p>
                    </div>
                    <div>
                        <TabellaMenu item={products} onToggle={handleToggle} />
                    </div>
                    <div className='text-center '>
                        <br></br>
                        <br></br>
                        <Button variant="contained" onClick={handleButtonClickInvia}>Tutto Disponibile</Button>
                    </div>

                </div>
            </main>

        )
    }
    else
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <div className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50" role="alert">
                            <span className="text-xl font-semibold">Danger alert!</span> Utente non autorizzato.
                        </div>
                    </div>
                </div>
            </main>

        )

}