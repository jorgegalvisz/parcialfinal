import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import fetch from "node-fetch";

const port = new SerialPort({ path: "COM6", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

parser.on("data", async (data) => {
  console.log("Arduino:", data);
  await fetch("https://TUBACKEND.vercel.app/api/guardar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jugador: "Jugador1",
      respuesta: data.trim()
    })
  });
});
