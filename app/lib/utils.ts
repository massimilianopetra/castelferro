export function today(): string {

    const d = new Date();
    const date_format_str = d.getFullYear().toString() + "-" + ((d.getMonth() + 1).toString().length == 2 ? (d.getMonth() + 1).toString() : "0" + (d.getMonth() + 1).toString()) + "-" + (d.getDate().toString().length == 2 ? d.getDate().toString() : "0" + d.getDate().toString()) + " " + (d.getHours().toString().length == 2 ? d.getHours().toString() : "0" + d.getHours().toString()) + ":" + (d.getMinutes().toString().length == 2 ? d.getMinutes().toString() : "0" + d.getMinutes().toString()) + ":00";

    return (date_format_str);
}

export function milltodatestring(dtmillis: number | undefined): string {
   // console.log(dtmillis);
    if (dtmillis){
        let stringa = new Date(+dtmillis).toLocaleString()  
        return  stringa;
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
