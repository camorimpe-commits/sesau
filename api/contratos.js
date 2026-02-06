import { carregarPlanilhaCSV } from "./_utils.js";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0KGsk9HAH2ZP9I612PopHCOityrQtkqNAzCTJQkT9B5FqTmbv3ecPODsZJjAN4svMUzi9ILXWc3Oq/pub?output=csv";

export default async function handler(req, res) {
  try {
    const { credor, contrato } = req.query;

    let dados = await carregarPlanilhaCSV(SHEET_URL);

    if (credor) {
      dados = dados.filter(c =>
        (c.CREDOR || c.ENTIDADE || "")
          .toLowerCase()
          .includes(credor.toLowerCase())
      );
    }

    if (contrato) {
      dados = dados.filter(c =>
        (c["Nº DO CONTRATO"] || "").includes(contrato)
      );
    }

    res.status(200).json({
      total: dados.length,
      contratos: dados,
    });
  } catch (e) {
    res.status(500).json({
      erro: "Erro ao consultar contratos",
      detalhe: e.message,
    });
  }
}
