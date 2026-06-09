'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import CircularProgress from '@mui/material/CircularProgress';
import { getListaSintesiPiatti, getSintesiPiatti, getGiornoSagra } from '@/app/lib/actions';
import * as React from 'react';
import { DbSintesiPiatti, DbFiera } from '@/app/lib/definitions';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  Box, 
  Typography, 
  useMediaQuery, 
  Paper, 
  Divider, 
  Card, 
  CardContent,
  Alert
} from '@mui/material';

// Utilizziamo Grid2 rinominato in Grid per evitare i warning di deprecazione
import Grid from '@mui/material/Grid2'; 

// Icone per la Dashboard
import RestaurantIcon from '@mui/icons-material/Restaurant';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

type RecordElencoPiatti = {
  piatto: string;
  prezzo: number;
  ordinati: number;
  aperti: number;
  stampati: number;
  pagatitotali: number;
  pagaticontanti: number;
  pagatipos: number;
  pagatialtro: number;
};

export default function Page() {
  const [phase, setPhase] = useState<'iniziale' | 'caricamento' | 'caricato'>('iniziale');
  const [sagra, setSagra] = useState<DbFiera>({ id: 1, giornata: 1, stato: 'CHIUSA' });
  const [record, setRecord] = useState<RecordElencoPiatti | null>(null);
  const [selectPiatto, setSelectPiatto] = useState<DbSintesiPiatti | undefined>(undefined);
  const [elencoPaitti, setElencoPiatti] = useState<DbSintesiPiatti[]>([]);

  const { data: session } = useSession();
  const isMobile = useMediaQuery('(max-width:600px)');

  // 1. Caricamento iniziale dei piatti della giornata
  useEffect(() => {
    const fetchPiatti = async () => {
      const gg = await getGiornoSagra();
      if (gg) {
        setSagra(gg);
        const piatti = await getListaSintesiPiatti(gg.giornata);
        if (piatti) {
          setElencoPiatti(piatti);
        }
      }
    };
    fetchPiatti();
  }, []);

  // 2. Ordinamento piatti alfabetico memorizzato
  const piattiOrdinati = useMemo(() => {
    return [...elencoPaitti].sort((a, b) => a.alias.localeCompare(b.alias));
  }, [elencoPaitti]);

  // 3. Gestione selezione piatto
  const handleChange = async (event: SelectChangeEvent<string>) => {
    const selectedId = event.target.value;
    const piattoTrovato = elencoPaitti.find(piatto => piatto.id === parseInt(selectedId, 10));
    setSelectPiatto(piattoTrovato);
    
    if (piattoTrovato) {
      setPhase('caricamento');
      await fetchDati(piattoTrovato.id, piattoTrovato);
    }
  };

  // 4. Recupero dati del piatto dal DB
  const fetchDati = async (id: number, piattoInfo: DbSintesiPiatti) => {
    const op = await getSintesiPiatti(id, sagra.giornata);
    if (op) {
      setRecord({
        piatto: piattoInfo.alias,
        prezzo: piattoInfo.prezzo,
        ordinati: op.ordinati,
        aperti: op.aperto,
        stampati: op.stampati,
        pagatitotali: op.pagatocontanti + op.pagatopos + op.pagatoaltro,
        pagaticontanti: op.pagatocontanti,
        pagatipos: op.pagatopos,
        pagatialtro: op.pagatoaltro,
      });
    } else {
      setRecord(null);
    }
    setPhase('caricato');
  };

  // COMPONENTE DINAMICO: Cambia orientamento interno in base allo schermo per non schiacciare i testi
  const DataRowCard = ({ 
    title, 
    value, 
    icon, 
    color = "#2589FE", 
    subValue = "", 
    bgColor = "#fff" 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    color?: string; 
    subValue?: string; 
    bgColor?: string;
  }) => (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        backgroundColor: bgColor,
        borderLeft: `6px solid ${color}`,
        display: 'flex',
        // Su Smartphone (xs) e Tablet (sm): layout a riga (orizzontale interno)
        // Su PC (lg): layout a colonna (verticale interno, dato che i tasti sono affiancati)
        flexDirection: { xs: 'column', sm: 'row', lg: 'column' },
        alignItems: { xs: 'flex-start', sm: 'center', lg: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        width: '100%',
        height: '100%', 
        transition: 'all 0.2s ease-in-out',
        '&:hover': { 
          transform: { xs: 'translateX(4px)', lg: 'translateY(-4px)' }, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'row', lg: 'column' }, 
        alignItems: 'center', 
        gap: 2,
        textAlign: { xs: 'left', lg: 'center' }
      }}>
        <Box sx={{ color: color, display: 'flex', alignItems: 'center', fontSize: '1.8rem' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', fontWeight: 'bold', color: '#444', letterSpacing: 0.5 }}>
            {title}
          </Typography>
          {subValue && (
            <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.2 }}>
              {subValue}
            </Typography>
          )}
        </Box>
      </Box>
      <Typography variant="h5" sx={{ 
        fontWeight: 'bold', 
        color: '#111', 
        alignSelf: { xs: 'flex-end', sm: 'center', lg: 'center' },
        mt: { xs: 0, lg: 1 }
      }}>
        {value}
      </Typography>
    </Paper>
  );

  // Controllo Sicurezza
  if (session?.user?.name !== "SuperUser" && session?.user?.name !== "Casse") {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Alert severity="error" variant="filled" sx={{ maxWidth: 500, width: '100%', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Violazione:</Typography>
          Utente non autorizzato ad accedere al Cruscotto Piatti.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, margin: 'auto' }}>
      
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant={isMobile ? "h4" : "h2"} sx={{ fontWeight: 'bold', color: '#111', mb: 1 }}>
          Cruscotto Piatti
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#666' }}>
          Monitoraggio vendite e cucina in tempo reale • Giornata {sagra.giornata}
        </Typography>
      </Box>

      {/* Selezione Piatto */}
      <Card sx={{ mb: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3, flexDirection: isMobile ? 'column' : 'row' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: 160, textAlign: isMobile ? 'center' : 'left' }}>
            Seleziona un piatto:
          </Typography>
          <FormControl fullWidth size="medium">
            <InputLabel id="select-piatto-label">Piatto</InputLabel>
            <Select
              labelId="select-piatto-label"
              value={selectPiatto ? selectPiatto.id + "" : ""}
              onChange={handleChange}
              label="Piatto"
              sx={{ borderRadius: 2 }}
            >
              {piattiOrdinati.map((piatto) => (
                <MenuItem key={piatto.id} value={piatto.id}>
                  {piatto.alias}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Loading */}
      {phase === 'caricamento' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size="4.5rem" thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, color: '#555', fontWeight: 500 }}>
            Aggiornamento dati in corso...
          </Typography>
        </Box>
      )}

      {/* Dashboard Dati Fluida */}
      {phase === 'caricato' && record && (
        <Grid container spacing={2}>
          
          {/* SEZIONE 1: INFORMAZIONI ECONOMICHE (Su PC affiancati a 2 colonne) */}
          <Grid size={12}>
            <Divider sx={{ my: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 'bold', color: '#666', letterSpacing: 1 }}>
                Informazioni Economiche
              </Typography>
            </Divider>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <DataRowCard 
              title="Piatto Selezionato" 
              value={record.piatto} 
              icon={<RestaurantIcon />} 
              color="#2589FE" 
              subValue={`Prezzo unitario: ${record.prezzo.toFixed(2)} €`} 
              bgColor="#fff"
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <DataRowCard 
              title="Incasso Stimato Totale" 
              value={`${(record.pagatitotali * record.prezzo).toFixed(2)} €`} 
              icon={<MonetizationOnIcon />} 
              color="#4CAF50" 
              subValue={`Calcolato su ${record.pagatitotali} comande saldate`}
              bgColor="#fff"
            />
          </Grid>

          {/* SEZIONE 2: STATO COMANDE (Su PC affiancati a 3 colonne - Sfondo Violetto) */}
          <Grid size={12}>
            <Divider sx={{ mt: 2, mb: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 'bold', color: '#666', letterSpacing: 1 }}>
                Stato Comande e Cucina
              </Typography>
            </Divider>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <DataRowCard 
              title="Ordinati Totali" 
              value={record.ordinati} 
              icon={<QueryStatsIcon />} 
              color="#2196F3" 
              bgColor="#f3e5f5" // <--- VIOLETTO PASTELLO
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <DataRowCard 
              title="In Attesa (Aperti)" 
              value={record.aperti} 
              icon={<HourglassTopIcon />} 
              color="#FF9800" 
              bgColor="#f3e5f5" // <--- VIOLETTO PASTELLO
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <DataRowCard 
              title="Stampati in Cucina" 
              value={record.stampati} 
              icon={<LocalPrintshopIcon />} 
              color="#9C27B0" 
              bgColor="#f3e5f5" // <--- VIOLETTO PASTELLO
            />
          </Grid>

          {/* SEZIONE 3: DETTAGLIO PAGAMENTI (Su PC affiancati a 4 colonne - Sfondo Azzurrino) */}
          <Grid size={12}>
            <Divider sx={{ mt: 2, mb: 1 }}>
              <Typography variant="overline" sx={{ fontWeight: 'bold', color: '#666', letterSpacing: 1 }}>
                Dettaglio Pagamenti Ricevuti
              </Typography>
            </Divider>
          </Grid>
          <Grid size={{ xs: 12, lg: 3 }}>
            <DataRowCard 
              title="Totale Piatti Pagati" 
              value={record.pagatitotali} 
              icon={<PaymentsIcon />} 
              color="#4CAF50" 
              bgColor="#e3f2fd" // <--- AZZURRINO
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 3 }}>
            <DataRowCard 
              title="Pagati in Contanti" 
              value={record.pagaticontanti} 
              icon={<AccountBalanceWalletIcon />} 
              color="#03A9F4" 
              subValue={`${(record.pagaticontanti * record.prezzo).toFixed(2)} €`}
              bgColor="#e3f2fd" // <--- AZZURRINO
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 3 }}>
            <DataRowCard 
              title="Pagati con POS" 
              value={record.pagatipos} 
              icon={<CreditCardIcon />} 
              color="#E91E63" 
              subValue={`${(record.pagatipos * record.prezzo).toFixed(2)} €`}
              bgColor="#e3f2fd" // <--- AZZURRINO
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 3 }}>
            <DataRowCard 
              title="Altri Importo" 
              value={record.pagatialtro} 
              icon={<PaymentsIcon />} 
              color="#9E9E9E" 
              subValue={`${(record.pagatialtro * record.prezzo).toFixed(2)} €`}
              bgColor="#e3f2fd" // <--- AZZURRINO
            />
          </Grid>

        </Grid>
      )}
    </Box>
  );
}