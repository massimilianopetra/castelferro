'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { DbMenu } from '@/app/lib/definitions';
import { getMenu, updatetMenu, setMenuAllAvailable, overwriteMenu } from '@/app/lib/actions';
import TabellaMenu from '@/app/ui/dashboard/TabellaMenu';
import { Button, Typography, useMediaQuery, Box, CircularProgress, ThemeProvider, createTheme } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const defaultTheme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#9c27b0' },
        success: { main: '#2e7d32' },
        error: { main: '#d32f2f' },
        background: { default: '#f4f6f8' }
    },
});

export default function MenuPage() {
    const [products, setProducts] = useState<DbMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();
    const isMobile = useMediaQuery('(max-width:600px)');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const menus = await getMenu();
            if (menus) setProducts(menus);
        } catch (error) {
            console.error("Errore nel caricamento del menu:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggle = (id: number) => {
        const newProducts = products.map((item) => {
            if (item.id === id) {
                const newStatus = item.disponibile === "N" ? "Y" : "N";
                updatetMenu({ ...item, disponibile: newStatus });
                return { ...item, disponibile: newStatus };
            }
            return item;
        });
        setProducts(newProducts);
    };

    const handleButtonClickInvia = async () => {
        const newProducts = products.map((item) => ({ ...item, disponibile: "Y" as const }));
        await setMenuAllAvailable();
        setProducts(newProducts);
    };
/*
    const handleFileChange = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            const text = await file.text();
            const rows = text.trim().split("\n"); 
            const data = rows.slice(1).map((row) => {
                const values = row.split(",");
                return { 
                    id: Number(values[0]), piatto: values[1], prezzo: Number(values[2]), 
                    cucina: values[3], disponibile: values[4], alias: values[5], percentuale: Number(values[6]) 
                } as DbMenu;
            });
            setProducts(data);
            await overwriteMenu(data);
        }
    };
*/
const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
        const text = await file.text();
        const rows = text.trim().split("\n"); 
        
        const data = rows.slice(1).map((row) => {
            // Questa regex divide per virgola MA ignora le virgole dentro i testi tra virgolette
            const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(",");
            
            // Pulisce le virgolette dai testi se presenti
            const clean = (val: string) => val ? val.replace(/^"|确认|"$|/g, '').trim() : '';

            return { 
                id: Number(clean(values[0])), 
                piatto: clean(values[1]), 
                prezzo: Number(clean(values[2])), 
                cucina: clean(values[3]), 
                disponibile: clean(values[4]), 
                alias: clean(values[5]), 
                percentuale: Number(clean(values[6])) 
            } as DbMenu;
        });
        setProducts(data);
        await overwriteMenu(data);
    }
};
    const handleUploadClick = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.onchange = handleFileChange;
        fileInput.click();
    };

    if (loading && !products.length) {
        return (
    <ThemeProvider theme={defaultTheme}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                // MODIFICA CHIAVE: height 100% per stare nel layout senza scrollbar
                height: '100%', 
                width: '100%',
                bgcolor: 'background.default', 
                p: 2, 
                position: 'relative',
                boxSizing: 'border-box',
                overflow: 'hidden' // Impedisce scroll orizzontali/verticali indesiderati
            }}>
            <CircularProgress />
        </Box>
    </ThemeProvider>
 
        );
    }

 // ... (import e logica invariati)

if ((session?.user?.name == "Casse") || (session?.user?.name == "SuperUser")) {
    return (
        /* Rimosso h-screen e overflow-y-auto: ora comanda il layout */
        <div className="flex flex-col min-h-full bg-white">
            
            <div className='text-center py-4'>
                 <Typography variant={isMobile ? "h5" : "h3"} sx={{ fontWeight: 'bold', color: '#333' }}>
                    Menu
                </Typography>
            </div>
            
            {/* La tabella occupa lo spazio necessario */}
            <main className="flex-grow px-2 md:px-4">
                  <TabellaMenu item={products} onToggle={handleToggle} />
            </main>
             
            {/* I bottoni appariranno alla fine della tabella */}
            <div className="flex justify-center space-x-4 py-10 pb-20">
                <Button variant="contained" onClick={handleButtonClickInvia} style={{ borderRadius: '9999px' }}>
                    Tutto Disponibile
                </Button>
                <Button variant="contained" startIcon={<CloudUploadIcon />} style={{ borderRadius: '9999px' }} onClick={handleUploadClick}>
                    Upload Menu
                </Button>
            </div>
        </div>
    )
}

    return (
        <main className="flex items-center justify-center h-screen bg-gray-50">
            <div className="p-8 text-center bg-white shadow-xl rounded-2xl border border-red-100">
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#b91c1c' }}>Accesso Negato (MENU)</Typography>
            </div>
        </main>
    );
}