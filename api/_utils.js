import Papa from "papaparse";

export async function carregarPlanilhaCSV(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error("Erro ao buscar planilha");
  }

  const texto = await resp.text();
  const parsed = Papa.parse(texto, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  });

  return parsed.data;
}

export function parseDataBR(str) {
  if (!str) return null;
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1]);
}

export function parseValorBR(valor) {
  if (!valor) return 0;
  return (
    Number(
      valor
        .toString()
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0
  );
}
