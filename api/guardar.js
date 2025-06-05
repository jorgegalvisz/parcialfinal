import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

const resultadoSchema = new mongoose.Schema({
  jugador: String,
  respuesta: String,
  fecha: { type: Date, default: Date.now }
});

const Resultado = mongoose.models.Resultado || mongoose.model("Resultado", resultadoSchema);

export default async function handler(req, res) {
  if (req.method === "POST") {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(MONGO_URI);
    }

    const { jugador, respuesta } = req.body;

    const nuevo = new Resultado({ jugador, respuesta });
    await nuevo.save();

    res.status(200).json({ ok: true, mensaje: "Dato guardado en MongoDB Atlas" });
  } else {
    res.status(405).json({ mensaje: "Método no permitido" });
  }
}
