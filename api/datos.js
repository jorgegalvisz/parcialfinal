import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

const resultadoSchema = new mongoose.Schema({
  jugador: String,
  respuesta: String,
  fecha: { type: Date, default: Date.now }
});

const Resultado = mongoose.models.Resultado || mongoose.model("Resultado", resultadoSchema);

export default async function handler(req, res) {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(MONGO_URI);
  }

  const resultados = await Resultado.find().sort({ fecha: -1 }).limit(20);
  res.status(200).json(resultados);
}
