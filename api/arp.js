import { carregarPlanilhaCSV } from "./_utils.js";

const SHEET_URL = "URL_DA_PLANILHA_ARP";

export default async function handler(req, res) {
  try {
    const { item, vigente } = req.query;

    let dados = await carregarPlanilhaCSV(SHEET_URL);

    if (item) {
      dados = dados.filter(a =>
        (a.DESCRICAO || "").toLowerCase().includes(item.toLowerCase())
      );
    }

    if (vigente === "true") {
      dados = dados.filter(a => a.STATUS === "VIGENTE");
    }

    res.status(200).json({
      total: dados.length,
      atas: dados,
    });
  } catch (e) {
    res.status(500).json({
      erro: "Erro ao consultar ARP",
      detalhe: e.message,
    });
  }
}
