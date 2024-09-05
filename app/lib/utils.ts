
export function today(): string {

    const d = new Date();
    const date_format_str = d.getFullYear().toString() + "-" + ((d.getMonth() + 1).toString().length == 2 ? (d.getMonth() + 1).toString() : "0" + (d.getMonth() + 1).toString()) + "-" + (d.getDate().toString().length == 2 ? d.getDate().toString() : "0" + d.getDate().toString()) + " " + (d.getHours().toString().length == 2 ? d.getHours().toString() : "0" + d.getHours().toString()) + ":" + (d.getMinutes().toString().length == 2 ? d.getMinutes().toString() : "0" + d.getMinutes().toString()) + ":00";

    return (date_format_str);
}