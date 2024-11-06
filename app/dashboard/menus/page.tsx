'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import type { DbMenu } from '@/app/lib/definitions';
import { getMenu, updatetMenu, setMenuAllAvailable, overwriteMenu } from '@/app/lib/actions';
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

    const handleFileChange = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            const text = await file.text();
            const rows = text.trim().split("\n"); // Split by line

            const data = rows.slice(1).map((row) => {
                const values = row.split(",");
                const entry: DbMenu = { id: Number(values[0]), piatto: values[1], prezzo: Number(values[2]), cucina: values[3], disponibile: values[4], alias: values[5] };
                return entry;
            });

            setProducts(data);
            overwriteMenu(data);
            console.log("Parsed CSV Data:", data);
        }
    }

    const handleUploadClick = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.onchange = handleFileChange;
        fileInput.click();
    };

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
                    <div className="flex justify-center space-x-4 py-8">
                        <Button variant="contained" onClick={handleButtonClickInvia}>Tutto Disponibile</Button>
                        <Button variant="contained" onClick={handleUploadClick}>Upload Menu</Button>
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