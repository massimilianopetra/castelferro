
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import type { DbConsumazioniPrezzo } from '@/app/lib/definitions';
import { idID } from '@mui/material/locale';

export default function TheBill({ item }: { item: DbConsumazioniPrezzo[] }) {

    var totale = 0;
    var coperti = 1;
    var comanda = -1;
    var giorno = -1;

    for (let i of item) {
        totale += i.quantita * i.prezzo_unitario;
        if (i.id_piatto == 1) //comanda 1 sono i coperti
            coperti = i.quantita;
        if (comanda == -1) comanda = i.id_comanda;
        if (giorno == -1) giorno = i.giorno;
    }


    var media = (totale / coperti);


    return (

        <div>
            <Table>
                <TableHead>
                    <TableRow><TableCell>&nbsp;&nbsp;&nbsp;&nbsp;48° SAGRA DEI SALAMINI D’ASINO dal 14 al 21 Agosto 2025</TableCell></TableRow>
                </TableHead>
            </Table>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell >Piatto&nbsp;&nbsp;</TableCell>
                        <TableCell >Quantità</TableCell>
                        <TableCell >Pr. Uni.</TableCell>
                        <TableCell >SubTot&nbsp;</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody >
                    {item.map((row) => (
                        row.quantita > 0 ?
                            <TableRow>
                                <TableCell >{row.piatto}</TableCell>
                                <TableCell >

                                    &nbsp;&nbsp;&nbsp;&nbsp;{row.quantita}

                                </TableCell>
                                <TableCell className="flex-wrap">

                                    &nbsp;&nbsp;&nbsp;{row.prezzo_unitario}&nbsp;&euro;

                                </TableCell>
                                <TableCell > &nbsp;&nbsp;&nbsp;
                                    {(row.quantita * row.prezzo_unitario).toFixed(2)}&nbsp;&euro;
                                </TableCell>
                            </TableRow>
                            :
                            <></>
                    ))}
                    <TableHead >
                        <TableCell ></TableCell>
                        <TableCell> </TableCell>
                        <TableCell >Totale:</TableCell>
                        <TableCell >{totale.toFixed(2)}&nbsp;&euro;
                        </TableCell>
                    </TableHead>
                    <TableBody>
                        <TableCell></TableCell>
                        <TableCell ></TableCell>
                        <TableCell>&nbsp;&nbsp;&nbsp;A coperto:</TableCell>
                        <TableCell>&nbsp;&nbsp;{media.toFixed(2)}&nbsp;&euro; </TableCell>
                    </TableBody>
                </TableBody>
            </Table>
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp; Id: {comanda}_{giorno}
        </div >
    );

}
/*
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import type { DbConsumazioniPrezzo } from '@/app/lib/definitions';

export default function TheBill({ item }: { item: DbConsumazioniPrezzo[] }) {

    var totale = 0;
    var coperti = 0;

    for (let i of item) {
        totale += i.quantita * i.prezzo_unitario;
         if (i.id_piatto == 1) //comanda 1 sono i coperti
        coperti = i.quantita;
    }
    var media = (totale / coperti);


    return (

        <div className="z-0">

            <div className="z-0 p-1 mb-1 text-2xl font-extralight text-blue-800 rounded-lg bg-blue-50 text-end">
                Totale Conto: <span className="text-xl font-semibold ">{totale.toFixed(2)}</span> &euro;&nbsp;<br />
                Media per persona: <span className="text-xl font-semibold ">{media.toFixed(2)}</span> &euro; - <span className="text-xl font-semibold ">{coperti}</span> - coperti 
                
            </div>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 150 }} size="small" aria-label="a dense table">
                    <TableHead>
                        <TableRow className=" text-gray-800 rounded-lg bg-gray-50">
                            <TableCell align="left"><p className="text-lg font-bold">Piatto       </p></TableCell>
                            <TableCell className="text-lg font-bold" align="center"><p className="font-bold">Quantità       </p></TableCell>
                            <TableCell className="text-lg font-bold" align="center"><p className="font-bold">Prezzo Unitario</p></TableCell>
                            <TableCell className="text-lg font-bold" align="right"><p className="font-bold">SubTotale      </p></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody >
                        {item.map((row) => (
                            row.quantita > 0 ?
                            <TableRow className="bg-white">
                                <TableCell align="left" className="text-lg font-extralight">{row.piatto}</TableCell>
                                <TableCell className="flex-wrap">

                                    <span className="text-lg font-semibold ">{row.quantita}</span>

                                </TableCell>
                                 <TableCell className="flex-wrap">

                                    <span className="text-lg font-semibold ">{row.prezzo_unitario}</span>&nbsp;&euro;

                                </TableCell>
                                <TableCell align="right" className="text-lg font-extralight">
                                    {(row.quantita * row.prezzo_unitario).toFixed(2)}&nbsp;&euro;&nbsp;
                                </TableCell>
                            </TableRow>
                            :
                            <></>
                        ))}
                         <TableHead className="bg-white">
                             <TableCell align="left"><p className="text-lg font-bold">        </p></TableCell>
                            <TableCell className="text-lg font-bold" align="center"><p className="font-bold">        </p></TableCell>
                            <TableCell className="text-lg font-bold" align="center"><p className="font-bold">Totale:</p></TableCell>
                            <TableCell className="text-lg font-bold" align="right"><p className="font-bold">{totale.toFixed(2)}&euro;&nbsp;</p></TableCell>
                         </TableHead>
                    </TableBody>
                </Table>
            </TableContainer>
            <div className="p-2 mb-2 text-2xl font-extralight text-blue-800 rounded-lg bg-blue-50 text-end">
                    Grazie per aver cenato da noi!  Speriamo di rivederti presto.
            </div>
        </div>

    
    );

    }

/*
import React, { useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box
} from '@mui/material';
import { styled, createTheme, ThemeProvider, Theme } from '@mui/material/styles'; // Importa Theme qui
import { CssBaseline } from '@mui/material';

// Definisci il tipo di dato per i tuoi elementi
interface DbConsumazioniPrezzo {
    quantita: number;
    prezzo_unitario: number;
    piatto: string;
}

// *** 1. Tema personalizzato specifico per questo componente ***
// È definito qui dentro, per essere applicato solo a TheBill
const elegantLocalTheme = createTheme({
    typography: {
        fontFamily: [
            'Playfair Display',
            'Roboto',
            'serif',
            'sans-serif',
        ].join(','),
        h4: {
            fontFamily: 'Playfair Display, serif !important',
            fontWeight: 700,
            color: '#303030 !important',
        },
        h5: {
            fontFamily: 'Playfair Display, serif !important',
            fontWeight: 700,
            color: '#202020 !important',
            fontSize: '1.8rem !important',
        },
        h6: {
            fontWeight: 500,
            color: '#404040 !important',
            fontSize: '1.2rem !important',
        },
        body1: {
            fontFamily: 'Roboto, sans-serif !important',
            fontWeight: 300,
            color: '#505050 !important',
            fontSize: '1rem !important',
        },
        body2: {
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            color: '#606060 !important',
            fontSize: '0.95rem !important',
        },
    },
    palette: {
        primary: {
            main: '#4A4A4A !important',
            light: '#F8F8F8 !important',
            contrastText: '#FFF !important',
        },
        text: {
            primary: '#303030 !important',
            secondary: '#707070 !important',
        },
        divider: '#E0E0E0 !important',
        background: {
            paper: '#FFFFFF !important',
            default: '#F5F5F5 !important',
        },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    // Questa ombra è per i Paper "normali" non wrappati da styled components specifici
                    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        // *** AGGIUNTA: Sovrascrizioni per MuiTableCell e MuiTableRow direttamente nel tema locale ***
        // Questo forza gli stili sui componenti MUI all'interno di questo tema,
        // anche se un styled component specifico potrebbe avere la precedenza.
        MuiTableCell: {
            styleOverrides: {
                root: ({ theme }) => ({
                    // Applica questi stili a tutte le TableCell all'interno di questo tema
                    // Se un StyledTableCell ha stili propri, li sovrascriverà
                    fontSize: '0.95rem !important',
                    color: theme.palette.text.primary,
                    padding: theme.spacing(1.2, 2),
                    borderBottom: `1px dashed ${theme.palette.divider}`,
                }),
                head: ({ theme }) => ({
                    fontWeight: 600,
                    color: theme.palette.text.secondary,
                    fontSize: '0.9rem !important',
                    backgroundColor: theme.palette.background.default,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }),
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: ({ theme }) => ({
                    '&:nth-of-type(odd)': {
                        backgroundColor: theme.palette.action.hover,
                    },
                    '&:hover': {
                        backgroundColor: theme.palette.action.selected,
                    },
                    '&:last-child td, &:last-child th': {
                        border: 0,
                    },
                }),
            },
        },
    },
});

// *** 2. Styled Components per personalizzazioni ancora più specifiche (se necessario) ***
// Questi avranno la precedenza sulle sovrascrizioni del tema MuiTableCell/MuiTableRow
const ElegantContainer = styled(Paper)(({ theme }) => ({
    maxWidth: 550,
    margin: '40px auto !important',
    padding: theme.spacing(4),
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.08)', // Ombra più marcata per il contenitore principale
}));

const StyledHeader = styled(Box)(({ theme }) => ({
    textAlign: 'center',
    marginBottom: theme.spacing(3),
    paddingBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

// Se definisci stili per TableHead, TableRow, TableCell qui, avranno priorità
// sui loro equivalenti definiti nel 'components' del tema locale.
// Per una maggiore specificità, puoi lasciare questi styled components.
const StyledTableHead = styled(TableHead)(({ theme }) => ({
    // Questo sovrascriverà lo sfondo di MuiTableCell-head definito nel tema, ma solo qui.
    backgroundColor: theme.palette.background.default,
    '& .MuiTableCell-root': {
        fontWeight: 600,
        color: theme.palette.text.secondary,
        fontSize: '0.9rem',
        padding: theme.spacing(1.5, 2),
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:hover': {
        backgroundColor: theme.palette.action.selected,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    // Questo sovrascriverà gli stili di MuiTableCell-root definiti nel tema, ma solo qui.
    fontSize: '0.95rem',
    color: theme.palette.text.primary,
    padding: theme.spacing(1.2, 2),
    borderBottom: `1px dashed ${theme.palette.divider}`,
}));


const SummaryRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(0.8, 0),
    borderBottom: `1px dotted ${theme.palette.divider}`,
    '&:last-child': {
        borderBottom: 'none',
    },
}));

const FinalTotalBox = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
    borderTop: `2px solid ${theme.palette.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
}));

const FooterBox = styled(Box)(({ theme }) => ({
    textAlign: 'center',
    marginTop: theme.spacing(4),
    paddingTop: theme.spacing(2),
    borderTop: `1px dashed ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    fontSize: '0.85rem',
}));

export default function TheBill({ item }: { item: DbConsumazioniPrezzo[] }) {
    const totale = useMemo(() => {
        let calculatedTotal = 0;
        for (let i of item) {
            calculatedTotal += i.quantita * i.prezzo_unitario;
        }
        return calculatedTotal;
    }, [item]);

    const subtotal = totale;
    const serviceChargeRate = 0.10;
    const serviceCharge = subtotal * serviceChargeRate;
    const finalTotalWithService = subtotal + serviceCharge;

    const currentDate = new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
       // *** ThemeProvider e CssBaseline locali ***
        <ThemeProvider theme={elegantLocalTheme}>
            <CssBaseline />
            <ElegantContainer>
                <StyledHeader>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Il Gusto Divino
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Via Roma, 10 - 10100 Torino</Typography>
                    <Typography variant="body2" color="text.secondary">Tel: 011 12345678</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>Data: {currentDate}</Typography>
                </StyledHeader>

                <TableContainer component={Paper} elevation={0}>
                    <Table sx={{ minWidth: 250 }} size="small" aria-label="dettagli conto ristorante">
                        <StyledTableHead>
                            <TableRow>
                                <TableCell align="left">Piatto</TableCell>
                                <TableCell align="center">Quantità</TableCell>
                                <TableCell align="right">Prezzo</TableCell>
                                <TableCell align="right">Subtotale</TableCell>
                            </TableRow>
                        </StyledTableHead>
                        <TableBody>
                            {item.map((row, index) => (
                                row.quantita > 0 ? (
                                    <StyledTableRow key={index}>
                                        <StyledTableCell align="left">
                                            <Typography variant="body1">{row.piatto}</Typography>
                                        </StyledTableCell>
                                        <StyledTableCell align="center">
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.quantita}</Typography>
                                        </StyledTableCell>
                                        <StyledTableCell align="right">
                                            <Typography variant="body2">{row.prezzo_unitario.toFixed(2)}&nbsp;&euro;</Typography>
                                        </StyledTableCell>
                                        <StyledTableCell align="right">
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {(row.quantita * row.prezzo_unitario).toFixed(2)}&nbsp;&euro;
                                            </Typography>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ) : (
                                    <React.Fragment key={index}></React.Fragment>
                                )
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box mt={3}>
                    <SummaryRow>
                        <Typography variant="body1" color="text.primary">Subtotale Articoli:</Typography>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 500 }}>{subtotal.toFixed(2)} &euro;</Typography>
                    </SummaryRow>
                    <SummaryRow>
                        <Typography variant="body1" color="text.primary">Servizio ({serviceChargeRate * 100}%):</Typography>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 500 }}>{serviceCharge.toFixed(2)} &euro;</Typography>
                    </SummaryRow>
                </Box>

                <FinalTotalBox>
                    <Typography variant="h6" component="span">
                        Totale Conto:
                    </Typography>
                    <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                        {finalTotalWithService.toFixed(2)} &euro;
                    </Typography>
                </FinalTotalBox>

                <FooterBox>
                    <Typography variant="body2">Grazie per aver cenato da noi!</Typography>
                    <Typography variant="body2">Speriamo di rivederti presto.</Typography>
                </FooterBox>
            </ElegantContainer>
        </ThemeProvider>
    );
}
 */