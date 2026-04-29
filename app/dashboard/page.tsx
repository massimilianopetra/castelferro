 
import Image from 'next/image';

export default function Page() {

    const anno = process.env.NEXT_PUBLIC_ANNO_SAGRA;
    const titolo = process.env.NEXT_PUBLIC_TITOLO_HOME;
    const edizione = process.env.NEXT_PUBLIC_EDIZIONE_SAGRA;

    return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className='text-center'>
                    <p className="text-5xl py-4">
                        Home
                    </p>
                </div>
                <div>
                  <h1>{titolo}</h1>
                    <p>Edizione: {edizione}° del {anno}</p>
                </div>
                {/* Contenitore Immagine */}
                <div className="mt-8">
                    <Image
                        src="/homecastelferro.png" // Il percorso parte automaticamente da /public
                        alt="Logo Castelferro"
                        width={500}            // Imposta la larghezza desiderata
                        height={500}           // Imposta l'altezza desiderata
                        priority               // Carica l'immagine con priorità
                        className="rounded-lg shadow-md"
                    />
                </div>
            </div>
        </main>
    );
}
