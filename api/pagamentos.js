import { carregarPlanilhaCSV, parseDataBR, parseValorBR } from "./_utils.js";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMAJWBTMJTCZ6isLPAVkN4AUp23myTBn6-FCv-h2Ntu2H1qSaxtKPiO4GIDDbWedCO5-V6XEIgzThJ/pub?output=csv";

export default async function handler(req, res) {
  try {
    const { credor, mes, ano } = req.query;

    let dados = await carregarPlanilhaCSV(SHEET_URL);

    // Filtro por credor
    if (credor) {
      dados = dados.filter(p =>
        (p.Credor || "").toLowerCase().includes(credor.toLowerCase())
      );
    }

    // Filtro por mês/ano
    if (mes || ano) {
      dados = dados.filter(p => {
        const data = parseDataBR(p["Data Pagamento"]);
        if (!data) return false;

        if (mes && data.getMonth() + 1 !== Number(mes)) return false;
        if (ano && data.getFullYear() !== Number(ano)) return false;

        return true;
      });
    }

    const total = dados.reduce(
      (s, p) => s + parseValorBR(p.PAGAMENTO),
      0
    );

    res.status(200).json({
      total_registros: dados.length,
      valor_total: total,
      pagamentos: dados,
    });
  } catch (e) {
    res.status(500).json({
      erro: "Erro ao processar pagamentos",
      detalhe: e.message,
    });
  }
}
