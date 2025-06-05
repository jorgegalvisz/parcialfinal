const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Modelo
const Resultado = mongoose.model("Resultado", {
  jugador: String,
  resultado: String,
  patron: [String],
  fecha: { type: Date, default: Date.now }
});

// Configura puerto serial
const port = new SerialPort({ path: "COM6", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

let patronActual = [];
let nivel = 1;
let turno = "jugador1"; // Empieza Jugador 1
let respuestas = {
  jugador1: [],
  jugador2: []
};
let jugador1Nombre = "";
let jugador2Nombre = "";

// Generar patrón
function generarPatron(nivel) {
  const opciones = ["UP", "DOWN", "LEFT", "RIGHT"];
  const patron = [];
  for (let i = 0; i < nivel; i++) {
    const aleatorio = opciones[Math.floor(Math.random() * opciones.length)];
    patron.push(aleatorio);
  }
  return patron;
}

// Cuando se conecta el navegador
io.on("connection", (socket) => {
  console.log("Jugador conectado (navegador)");

  // Enviar patrón inicial
  patronActual = generarPatron(nivel);
  socket.emit("patron", patronActual);

  // Recibir nombres de jugadores
  socket.on("nombres", (data) => {
    jugador1Nombre = data.jugador1;
    jugador2Nombre = data.jugador2;
  });

  // Recibir jugada de Jugador 2 (PC)
  socket.on("jugada", (data) => {
    if (turno !== "jugador2") return;

    const { jugador, respuesta } = data;
    respuestas.jugador2.push(respuesta);
    console.log("Jugador 2:", respuesta);

    // Verifica si Jugador 2 completó
    if (respuestas.jugador2.length === patronActual.length) {
      verificarResultados(socket);
    }
  });
});

// Arduino (Jugador 1)
parser.on("data", (data) => {
  const tecla = data.trim();
  if (turno !== "jugador1") return;

  console.log("Jugador 1:", tecla);
  respuestas.jugador1.push(tecla);

  // Verifica si Jugador 1 completó
  if (respuestas.jugador1.length === patronActual.length) {
    turno = "jugador2";
    io.emit("turno-jugador2");
  }
});

// Verificar resultados y decidir ganador
function verificarResultados(socket) {
  const correctoA = JSON.stringify(respuestas.jugador1) === JSON.stringify(patronActual);
  const correctoB = JSON.stringify(respuestas.jugador2) === JSON.stringify(patronActual);

  if (correctoA && !correctoB) {
    io.emit("ganador", jugador1Nombre);
  } else if (!correctoA && correctoB) {
    io.emit("ganador", jugador2Nombre);
  } else if (correctoA && correctoB) {
    nivel++;
    io.emit("ambos-correcto", nivel);
  } else {
    io.emit("ninguno", nivel);
  }

  // Reinicia para siguiente ronda
  turno = "jugador1";
  respuestas = { jugador1: [], jugador2: [] };
  patronActual = generarPatron(nivel);
  io.emit("patron", patronActual);
}

// Servir frontend
app.use(express.static("public"));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
