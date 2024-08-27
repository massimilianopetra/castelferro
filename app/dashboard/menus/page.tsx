import { auth } from '@/auth';
import DashboardLinks from '@/app/ui/dashboard/dashboard-links';
import { sql } from '@vercel/postgres';
import type { DbMenu } from '@/app/lib/definitions';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

async function getMenu(): Promise<DbMenu[] | undefined> {
    try {
        const menus = await sql<DbMenu>`SELECT * FROM menus`;
        return menus.rows;
    } catch (error) {
        console.error('Failed to fetch menu:', error);
        throw new Error('Failed to fetch menu.');
    }
}

export default async function Page() {

    const session = await auth();
    console.log(session?.user?.name);

    if ((session?.user?.name == "SuperUser")) {
        const menus = await getMenu();

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
                                        <TableCell>id</TableCell>
                                        <TableCell align="left">Piatto</TableCell>
                                        <TableCell align="left">Prezzo&nbsp;(eur)</TableCell>
                                        <TableCell align="left">Cucina&nbsp;</TableCell>
                                        <TableCell align="left">Disponibile&nbsp;(Y/N)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {menus?.map((row) => (
                                        <TableRow>

                                            <TableCell>{row.id}</TableCell>
                                            <TableCell align="left">{row.piatto}</TableCell>
                                            <TableCell align="left">{row.prezzo}</TableCell>
                                            <TableCell align="left">{row.cucina}</TableCell>
                                            <TableCell align="left">{row.disponibile}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                    </div>
                    <DashboardLinks />
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