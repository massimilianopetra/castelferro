export function today(): string {

    const d = new Date();
    const date_format_str = d.getFullYear().toString() + "-" + ((d.getMonth() + 1).toString().length == 2 ? (d.getMonth() + 1).toString() : "0" + (d.getMonth() + 1).toString()) + "-" + (d.getDate().toString().length == 2 ? d.getDate().toString() : "0" + d.getDate().toString()) + " " + (d.getHours().toString().length == 2 ? d.getHours().toString() : "0" + d.getHours().toString()) + ":" + (d.getMinutes().toString().length == 2 ? d.getMinutes().toString() : "0" + d.getMinutes().toString()) + ":00";

    return (date_format_str);
}

export function milltodatestring(dtmillis: number | undefined): string {
    if (dtmillis) {
        let date = new Date(+dtmillis);
        // Definisci le opzioni per il formato desiderato
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Per un formato 24 ore
        };
        // Usa toLocaleString con le opzioni e 'sv-SE' per il formato anno-mese-giorno
        // o un locale che supporti il formato che vuoi per la data, e poi riorganizza
        // In alternativa, costruiscila manualmente per un controllo preciso
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mese è 0-based
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        return `${year}/${month}/${day}, ${hours}:${minutes}:${seconds}`;
    }

    return "--:--:--";
}

export function deltatime(dtmillistart: number | undefined, dtmilliend: number | undefined): string {

    if (dtmillistart && dtmilliend) {

        const dtmillis = dtmilliend - dtmillistart;

        const ss = Math.trunc(dtmillis / 1000) % 60;
        const mm = Math.trunc(dtmillis / 60000) % 60;
        const hh = Math.trunc(dtmillis / 3600000);

        var date_format_str = hh.toString().length < 2 ? "0" + hh.toString() : hh.toString();
        date_format_str += ":" + (mm.toString().length < 2 ? "0" + mm.toString() : mm.toString());
        date_format_str += ":" + (ss.toString().length < 2 ? "0" + ss.toString() : ss.toString());

        if (hh>24) {
            return " troppo! ";
        }
        {
            return (date_format_str);
        }
    }
    return "--:--:--";
}

export function deltanow(millis: number | undefined): string {

    if (millis) {

        const dtmillis = Date.now() - millis;

        const ss = Math.trunc(dtmillis / 1000) % 60;
        const mm = Math.trunc(dtmillis / 60000) % 60;
        const hh = Math.trunc(dtmillis / 3600000);

        var date_format_str = hh.toString().length < 2 ? "0" + hh.toString() : hh.toString();
        date_format_str += ":" + (mm.toString().length < 2 ? "0" + mm.toString() : mm.toString());
        date_format_str += ":" + (ss.toString().length < 2 ? "0" + ss.toString() : ss.toString());

        if (hh>24) {
            return " oltre un giorno";
        }
        else 
        {
            return (date_format_str);
        }
    }

    return "--:--:--";
}
