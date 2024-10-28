"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CircularProgress from "@mui/material/CircularProgress";
import {
  listConti,
  listConsumazioni,
  listConsumazioniGratis,
  listContiGratis,
  listConsumazioniFogliettoN,
  listContiGratisFogliettoN,
} from "@/app/lib/actions";
import * as React from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { BarChart } from "@mui/x-charts/BarChart";
import { blue, blueGrey, yellow } from "@mui/material/colors";
import TextField from "@mui/material/TextField";

export default function Page() {
  const [phase, setPhase] = useState("caricamento");
  const [record, setRecord] = useState<RecordCruscotto[]>([]);
  const { data: session } = useSession();

  const CustomTextField = styled(TextField)({
    "& .MuiInputBase-input": {
      //   label: 'filled-size-small',
      textAlign: "right", // Allinea il testo a dx
      width: "100%",
      fontSize: "13px", // Cambia la dimensione del carattere del testo inserito
    },
    "& .MuiInputLabel-root": {
      fontSize: "12px", // Cambia la dimensione del carattere dell'etichetta
    },
  });

  const StyledTableCell = styled(TableCell)(({}) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: "#2f6feb", //'#1e40af',  // Imposta lo sfondo blu
      color: "white", // Imposta il colore del testo giallo
      fontWeight: "bold",
      fontSize: 16,
    },
    [`&.${tableCellClasses.body}`]: {
      color: "#2f6feb",
      fontSize: 14,
    },
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    "&:last-child td, &:last-child th": {
      border: 0,
    },
  }));

  type RecordCruscotto = {
    giornata: string;
    incasso: number;
    incassopos: number;
    incassoconto1: number;
    incassoconto2: number;
    incassoconto3: number;
    incassoconto4: number;
    incassoconto5: number;
    incassoconto6: number;
    incassoconto7: number;
    incassoconto8: number;
    incassoconto9: number;
  };

  function createData(
    giornata: string,
    incasso: number,
    incassopos: number,
    incassoconto1: number,
    incassoconto2: number,
    incassoconto3: number,
    incassoconto4: number,
    incassoconto5: number,
    incassoconto6: number,
    incassoconto7: number,
    incassoconto8: number,
    incassoconto9: number
  ) {
    return {
      giornata,
      incasso,
      incassopos,
      incassoconto1,
      incassoconto2,
      incassoconto3,
      incassoconto4,
      incassoconto5,
      incassoconto6,
      incassoconto7,
      incassoconto8,
      incassoconto9,
    };
  }

  var rows = [
    createData("Giovedi -1giorno", 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10),
    createData("Venerdì -2giorno", 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10),
    createData("Sabato  -3giorno", 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10),
    createData("Domenica -4giorno", 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10),
    createData("Lunedì -5giorno", 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10),
    createData("Martedì -6giorno", 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10),
    createData("Mercoledì -7giorno", 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10),
    createData("Giovedì -8giorno", 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10),
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    const conti = await listContiGratis();
    const cosumazioni = await listConsumazioniGratis();

    for (var i = 0; i < 8; i++) {
      

      var sum = conti?.reduce((accumulator, currentValue) => {
        if (currentValue.giorno == i+1) {
          return accumulator + currentValue.totale;
        } else {
          return accumulator
        }
        
      }, 0);
      if (!sum) sum = 0;

      var sum1 = conti?.reduce((accumulator, currentValue) => {
        if ((currentValue.giorno == i+1) && (currentValue.id_comanda == 1)) {
          return accumulator + currentValue.totale;
        } else {
          return accumulator
        }
      }, 0);
      if (!sum1) sum1 = 0;

      var sum2 = conti?.reduce((accumulator, currentValue) => {
        if ((currentValue.giorno == i+1) && (currentValue.id_comanda == 2)) {
          return accumulator + currentValue.totale;
        } else {
          return accumulator
        }
      }, 0);
      if (!sum2) sum2 = 0;

      var sum3 = conti?.reduce((accumulator, currentValue) => {
        if ((currentValue.giorno == i+1) && (currentValue.id_comanda == 3)) {
          return accumulator + currentValue.totale;
        } else {
          return accumulator
        }
      }, 0);
      if (!sum3) sum3 = 0;

      var sum4 = conti?.reduce((accumulator, currentValue) => {
        if ((currentValue.giorno == i+1) && (currentValue.id_comanda == 4)) {
          return accumulator + currentValue.totale;
        } else {
          return accumulator
        }
      }, 0);
      if (!sum4) sum4 = 0;

      var sum5 = conti?.reduce((accumulator, currentValue) => {
        if ((currentValue.giorno == i+1) && (currentValue.id_comanda == 5)) {
          return accumulator + currentValue.totale;
        } else {
          return accumulator
        }
      }, 0);
      if (!sum5) sum5 = 0;

      var sum6 = conti?.reduce((accumulator, currentValue) => {
        if ((currentValue.giorno == i+1) && (currentValue.id_comanda == 6)) {
          return accumulator + currentValue.totale;
        } else {
          return accumulator
        }
      }, 0);
      if (!sum6) sum6 = 0;

      var sum7 = conti?.reduce((accumulator, currentValue) => {
        if ((currentValue.giorno == i+1) && (currentValue.id_comanda == 7)) {
          return accumulator + currentValue.totale;
        } else {
          return accumulator
        }
      }, 0);
      if (!sum7) sum7 = 0;

      var sum8 = conti?.reduce((accumulator, currentValue) => {
        if ((currentValue.giorno == i+1) && (currentValue.id_comanda == 8)) {
          return accumulator + currentValue.totale;
        } else {
          return accumulator
        }
      }, 0);
      if (!sum8) sum8 = 0;

      var sum9 = conti?.reduce((accumulator, currentValue) => {
        if ((currentValue.giorno == i+1) && (currentValue.id_comanda == 9)) {
          return accumulator + currentValue.totale;
        } else {
          return accumulator
        }
      }, 0);
      if (!sum9) sum9 = 0;

      rows[i] = {
        ...rows[i],
        incasso: sum,
        incassopos: 0,
        incassoconto1: sum1,
        incassoconto2: sum2,
        incassoconto3: sum3,
        incassoconto4: sum4,
        incassoconto5: sum5,
        incassoconto6: sum6,
        incassoconto7: sum7,
        incassoconto8: sum8,
        incassoconto9: sum9,
      };
    }
    setRecord(rows);
    setPhase("caricato");
  };

  if (session?.user?.name == "SuperUser") {
    if (phase == "caricamento") {
      return (
        <main>
          <div className="flex flex-wrap flex-col">
            <div className="text-center py-4">
              <p className="text-5xl py-4  text-blue-600">
                Cruscotto di Sintesi conti gratis
              </p>
            </div>
            <div className="text-center ">
              <p className="text-5xl py-4  text-blue-600">
                Caricamento in corso ...
              </p>
              <CircularProgress />
            </div>
          </div>
        </main>
      );
    } else if (phase == "caricato") {
      return (
        <main>
          <div className="flex flex-wrap flex-col">
            <div className="text-center py-4">
              <p className="text-5xl py-4">Cruscotto di Sintesi conti gratis</p>
            </div>
            <TableContainer component={Paper}>
              <Table
                sx={{ minWidth: 500 }}
                size="small"
                aria-label="a dense table"
              >
                <TableHead>
                  <TableRow>
                    <StyledTableCell className="font-bold">
                      GIORNATA
                    </StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">
                      Valore&nbsp;
                    </StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">
                      <CustomTextField
                        className="p-2"
                        id="filled-size-small"
                        defaultValue={"Camerieri"}
                      />
                      <br></br>Foglietto 1&nbsp;
                    </StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">
                      <CustomTextField
                        className="p-2"
                        id="filled-size-small"
                        defaultValue={"Valore"}
                      />
                      <br></br>Foglietto 2&nbsp;
                    </StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">
                      <CustomTextField
                        className="p-2"
                        id="filled-size-small"
                        defaultValue={"Valore"}
                      />
                      <br></br>Foglietto 3&nbsp;
                    </StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">
                      <CustomTextField
                        className="p-2"
                        id="filled-size-small"
                        defaultValue={"Valore"}
                      />
                      <br></br>Foglietto 4&nbsp;
                    </StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">
                      <CustomTextField
                        className="p-2"
                        id="filled-size-small"
                        defaultValue={"Valore"}
                      />
                      <br></br>Foglietto 5&nbsp;
                    </StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">
                      <CustomTextField
                        className="p-2"
                        id="filled-size-small"
                        defaultValue={"Valore"}
                      />
                      <br></br>Foglietto 6&nbsp;
                    </StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">
                      <CustomTextField
                        className="p-2"
                        id="filled-size-small"
                        defaultValue={"Valore"}
                      />
                      <br></br>Foglietto 7&nbsp;
                    </StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">
                      <CustomTextField
                        className="p-2"
                        id="filled-size-small"
                        defaultValue={"Valore"}
                      />
                      <br></br>Foglietto 8&nbsp;
                    </StyledTableCell>
                    <StyledTableCell align="right" className="font-bold ">
                      <CustomTextField
                        className="p-2"
                        id="filled-size-small"
                        defaultValue={"Valore"}
                      />
                      <br></br>Foglietto 9&nbsp;
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {record.map((row) => (
                    <StyledTableRow key={row.giornata}>
                      <StyledTableCell
                        component="th"
                        scope="row"
                        className="font-bold "
                      >
                        {row.giornata}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <b>{row.incasso.toFixed(2)}&nbsp;&euro;</b>
                        <br></br>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {row.incassoconto1.toFixed(2)}&nbsp;&euro;
                        <br></br>
                        <b>
                          <small>N.Cons. xxxx&nbsp;&nbsp;</small>
                        </b>
                        <br></br>
                        <small>Birre xxxx&nbsp;&nbsp;</small>
                        <br></br>
                        <small>Patatine xxxx&nbsp;&nbsp;</small>
                        <br></br>
                        <small>Agnolotti xxxx&nbsp;&nbsp;</small>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {row.incassoconto2.toFixed(2)}&nbsp;&euro;
                        <br></br>
                        <b>
                          <small>N.Cons. xxxx&nbsp;&nbsp;</small>
                        </b>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {row.incassoconto3.toFixed(2)}&nbsp;&euro;
                        <br></br>
                        <b>
                          <small>N.Cons. xxxx&nbsp;&nbsp;</small>
                        </b>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {row.incassoconto4.toFixed(2)}&nbsp;&euro;
                        <br></br>
                        <b>
                          <small>N.Cons. xxxx&nbsp;&nbsp;</small>
                        </b>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {row.incassoconto5.toFixed(2)}&nbsp;&euro;
                        <br></br>
                        <b>
                          <small>N.Cons. xxxx&nbsp;&nbsp;</small>
                        </b>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {row.incassoconto6.toFixed(2)}&nbsp;&euro;
                        <br></br>
                        <b>
                          <small>N.Cons. xxxx&nbsp;&nbsp;</small>
                        </b>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {row.incassoconto7.toFixed(2)}&nbsp;&euro;
                        <br></br>
                        <b>
                          <small>N.Cons. xxxx&nbsp;&nbsp;</small>
                        </b>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {row.incassoconto8.toFixed(2)}&nbsp;&euro;
                        <br></br>
                        <b>
                          <small>N.Cons. xxxx&nbsp;&nbsp;</small>
                        </b>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        {row.incassoconto9.toFixed(2)}&nbsp;&euro;
                        <br></br>
                        <b>
                          <small>N.Cons. xxxx&nbsp;&nbsp;</small>
                        </b>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                  <TableRow>
                    <TableCell rowSpan={5} />
                    <TableCell
                      colSpan={2}
                      className="text-xl  font-extralight  text-blue-600"
                    >
                      <b>Valore totale</b>
                    </TableCell>
                    <TableCell
                      align="right"
                      className="text-xl  font-extralight  text-blue-600"
                    >
                      <b>
                        {record
                          .reduce((accumulator, currentValue) => {
                            return accumulator + currentValue.incasso;
                          }, 0)
                          .toFixed(2)}
                        &nbsp;&euro;
                      </b>
                      <br></br>
                      <small>N.Cons. xxxx&nbsp;</small>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <br></br>
          </div>
        </main>
      );
    }
  } else {
    return (
      <main>
        <div className="flex flex-wrap flex-col">
          <div className="text-center ">
            <div
              className="p-4 mb-4 text-xl text-red-800 rounded-lg bg-red-50"
              role="alert"
            >
              <span className="text-xl font-semibold">Danger alert!</span>{" "}
              Utente non autorizzato.
            </div>
          </div>
        </div>
      </main>
    );
  }
}
