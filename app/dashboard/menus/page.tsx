'use client'

import { useState, useEffect } from 'react';
import { useSession} from 'next-auth/react'
import type { DbMenu } from '@/app/lib/definitions';
import { getMenu } from '@/app/lib/actions';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';


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

    const handleToggle = (id: number, d: string) => {
        const newProducts = products.map((item) => {
            if (item.id == id) {
                console.log(item);
                if (item.disponibile == "N")
                    return ({ ...item, disponibile: "Y" });
                else
                    return ({ ...item, disponibile: "N" });

            }
            else
                return (item);
        });
        setProducts(newProducts);
    };


    //const session = await auth();
    //console.log(session?.user?.name);

    console.log("*********************");
    console.log(session?.user?.name);
    console.log("*********************");

    if ((session?.user?.name == "SuperUser")) {
        return (
            <main>
                <div className="flex flex-wrap flex-col">
                    <div className='text-center '>
                        <p className="text-5xl py-4">
                            Menu
                        </p>
                    </div>
                    <div>
                        <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 450 }} aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell className="font-bold">id</TableCell>
                                        <TableCell className="font-bold" align="left">Piatto</TableCell>
                                        <TableCell className="font-bold" align="left">Prezzo&nbsp;(eur)</TableCell>
                                        <TableCell className="font-bold" align="left">Cucina&nbsp;</TableCell>
                                        <TableCell className="font-bold" align="left">Disponibile&nbsp;(Y/N)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {products.map((row) => (
                                        <TableRow>

                                            <TableCell>{row.id}</TableCell>
                                            <TableCell align="left">{row.piatto}</TableCell>
                                            <TableCell align="left">{row.prezzo}</TableCell>
                                            <TableCell align="left">{row.cucina}</TableCell>
                                            <TableCell align="left"><Switch checked={row.disponibile === "Y"}
                                                onClick={() => handleToggle(row.id, row.disponibile)} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

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
                        <p className="text-5xl py-4">
                            Utente non autorizzato
                        </p>
                    </div>
                </div>
            </main>

        )

}