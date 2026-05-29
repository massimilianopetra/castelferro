'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'
import type { DbFiera } from '@/app/lib/definitions';
import { getGiornoSagra, updateGiornoSagra } from '@/app/lib/actions';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleSharpIcon from '@mui/icons-material/RemoveCircleSharp';
import { 
    Button, 
    Typography, 
    useMediaQuery, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogContentText, 
    DialogTitle,
    Box,
    Paper,
    Divider,
    Stack
} from '@mui/material';

// Helper per i colori e i testi del giorno
function GetDay({i}:{i:number}) {
    if (i==1)
        return <h1 className="mb-2 font-extrabold text-gray-900 text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-300 from-sky-200">GIOVEDI'</span></h1>
    else if (i==2)
        return <h1 className="mb-2 font-extrabold text-gray-900 text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-400 from-sky-200">VENERDI'</span></h1>
    else if (i==3)
        return <h1 className="mb-2 font-extrabold text-gray-900 text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-400 from-sky-300">SABATO</span></h1>
     else if (i==4)
        return <h1 className="mb-2 font-extrabold text-gray-900 text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-500 from-sky-300">DOMENICA</span></h1>
     else if (i==5)
        return <h1 className="mb-2 font-extrabold text-gray-900 text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-500 from-sky-400">LUNEDI'</span></h1>
     else if (i==6)
        return <h1 className="mb-2 font-extrabold text-gray-900 text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-500">MARTEDI'</span></h1>
     else if (i==7)
        return <h1 className="mb-2 font-extrabold text-gray-900 text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-500">MERCOLEDI'</span></h1>
     else if (i==8)
        return <h1 className="mb-2 font-extrabold text-gray-900 text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-700 from-sky-600">GIOVEDI' <br/><span className="text-3xl font-light italic">The Last Dance</span></span></h1>
     else
        return <h1 className="mb-2 font-extrabold text-gray-900 text-5xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-red-500 from-purple-600">La sagra è finita!</span></h1>
  }

export default function Page() {
    const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
    const [openConfirm, setOpenConfirm] = useState(false); 
    const { data: session } = useSession();
    const isMobile = useMediaQuery('(max-width:600px)');
    
    useEffect(() => {
        const fetchData = async () => {
            const gg = await getGiornoSagra();
            if (gg) setSagra(gg);
        };
        fetchData();
    }, []);

    const handleAdd = () => {
        const gg = { ...sagra, giornata: sagra.giornata + 1 }
        setSagra(gg);
    };

    const handleRemove = () => {
        if (sagra.giornata > 1) {
            const gg = { ...sagra, giornata: sagra.giornata - 1 }
            setSagra(gg);
        }
    };

    const handleClick = () => {
        if (sagra.stato === 'CHIUSA') {
            const gg = { ...sagra, stato: 'APERTA' }
            setSagra(gg);
            updateGiornoSagra(gg.giornata, gg.stato);
        } else {
            setOpenConfirm(true);
        }
    };

    const handleConfirmProceed = () => {
        const gg = { ...sagra, stato: 'CHIUSA' }
        setSagra(gg);
        updateGiornoSagra(gg.giornata, gg.stato);
        setOpenConfirm(false);
    };

    if ((session?.user?.name == "SuperUser")) {
        return (
            <Box sx={{ 
                p: { xs: 2, md: 4 }, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                minHeight: '80vh',
                justifyContent: 'center'
            }}>
                <Paper elevation={4} sx={{ 
                    p: { xs: 3, md: 6 }, 
                    borderRadius: 4, 
                    maxWidth: 700, 
                    width: '100%',
                    textAlign: 'center',
                    bgcolor: '#ffffff'
                }}>
                    <Typography variant={isMobile ? "h5" : "h3"} sx={{ mb: 4, fontWeight: '900', color: '#1a237e', textTransform: 'uppercase' }}>
                        Pannello di Controllo
                    </Typography>

                    <Divider sx={{ mb: 4 }} />

                    <Box sx={{ mb: 4 }}>
                        <Typography variant="overline" sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#666' }}>
                            Stai gestendo la
                        </Typography>
                        {/* Giornata ingrandita */}
                        <Typography variant="h1" sx={{ fontWeight: '900', color: '#1a237e', my: 1, fontSize: { xs: '5rem', md: '7rem' } }}>
                            {sagra.giornata}ª
                        </Typography>
                        <GetDay i={sagra.giornata} />
                    </Box>

                    <Stack 
                        direction={isMobile ? "column" : "row"} 
                        spacing={3} 
                        justifyContent="center" 
                        alignItems="center"
                        sx={{ mt: 5 }}
                    >
                        {/* Tasti ingranditi e più stilosi */}
                        <Stack direction="row" spacing={2}>
                            <Button 
                                onClick={() => handleAdd()} 
                                disabled={sagra.stato=='APERTA'} 
                                variant="outlined" 
                                sx={{ borderSize: 2, p: 2, borderRadius: 3, minWidth: 80 }}
                            >
                                <AddCircleIcon sx={{ fontSize: 40 }} />
                            </Button>
                            <Button 
                                onClick={() => handleRemove()} 
                                disabled={sagra.stato=='APERTA'} 
                                variant="outlined" 
                                color="inherit"
                                sx={{ borderSize: 2, p: 2, borderRadius: 3, minWidth: 80 }}
                            >
                                <RemoveCircleSharpIcon sx={{ fontSize: 40 }} />
                            </Button>
                        </Stack>

                        {/* Pulsante Azione Principale ingrandito */}
                        {sagra.stato == 'CHIUSA' ? (
                            <Button 
                                variant="contained" 
                                onClick={() => handleClick()}
                                sx={{ 
                                    fontSize: '1.5rem', 
                                    px: 6, 
                                    py: 2, 
                                    borderRadius: 3, 
                                    fontWeight: 'bold',
                                    bgcolor: '#2e7d32',
                                    '&:hover': { bgcolor: '#1b5e20' },
                                    width: { xs: '100%', sm: 'auto' }
                                }}
                            >
                                APRI GIORNATA
                            </Button>
                        ) : (
                            <Button 
                                variant="contained" 
                                onClick={() => handleClick()} 
                                color="error"
                                sx={{ 
                                    fontSize: '1.5rem', 
                                    px: 6, 
                                    py: 2, 
                                    borderRadius: 3, 
                                    fontWeight: 'bold',
                                    width: { xs: '100%', sm: 'auto' },
                                    boxShadow: '0 4px 14px 0 rgba(211, 47, 47, 0.39)'
                                }}
                            >
                                CHIUDI GIORNATA
                            </Button>
                        )}
                    </Stack>
                </Paper>

                <Dialog
                    open={openConfirm}
                    onClose={() => setOpenConfirm(false)}
                    PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                        {"🚨 Verifica Necessaria"}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ fontWeight: '600', color: '#d32f2f', fontSize: '1.2rem', py: 2 }}>
                            Hai stampato la classifica Camerieri?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setOpenConfirm(false)} variant="outlined" sx={{ px: 3 }}>
                            Annulla
                        </Button>
                        <Button onClick={handleConfirmProceed} variant="contained" color="error" sx={{ px: 4 }} autoFocus>
                            Prosegui
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        )
    } else {
        return (
            <main className="flex justify-center items-center h-[80vh]">
                <div className="p-8 text-center text-red-800 rounded-2xl bg-red-50 border border-red-200 shadow-lg">
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Violazione di Accesso
                    </Typography>
                    <Typography sx={{ mt: 1 }}>Utente non autorizzato alla gestione della sagra.</Typography>
                </div>
            </main>
        )
    }
}