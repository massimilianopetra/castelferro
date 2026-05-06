export const dynamic = 'force-dynamic'; // FONDAMENTALE PER DOCKER

// @ts-ignore: allow side-effect CSS import in app layout
import './ui/global.css';
import { inter } from './ui/fonts';
import { ConfigProvider } from '@/context/ConfigContext'; // Importa il provider

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Leggiamo le variabili dal server (Docker le inietta qui a runtime)
  const config = {
    edizione: process.env.EDIZIONE_SAGRA,
    anno: process.env.ANNO_SAGRA,
    titolo: process.env.TITOLO_HOME,
    inizio: process.env.INIZIO_SAGRA,
    fine: process.env.FINE_SAGRA,
    mese: process.env.MESE_SAGRA,
    stampante_wifi: process.env.STAMPANTE_WIFI,
    stampante_uno:process.env.STAMPANTE_UNO,
    stampante_due:process.env.STAMPANTE_DUE,
    stampante_tre:process.env.STAMPANTE_TRE,
    stampante_quattro:process.env.STAMPANTE_QUATTRO,
    wellcome_msg:process.env.WELLCOME_MSG,
  };
  console.log("CONFIG CARICATA DA DOCKER:", config);
  
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {/* Avvolgiamo tutta l'app con il provider e passiamo la config */}
        <ConfigProvider config={config}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}