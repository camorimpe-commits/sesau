import { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ================== URLs ================== */

const SHEET_URL_CONTRATOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0KGsk9HAH2ZP9I612PopHCOityrQtkqNAzCTJQkT9B5FqTmbv3ecPODsZJjAN4svMUzi9ILXWc3Oq/pub?output=csv&gid=2116839656";

const SHEET_URL_PAGAMENTOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMAJWBTMJTCZ6isLPAVkN4AUp23myTBn6-FCv-h2Ntu2H1qSaxtKPiO4GIDDbWedCO5-V6XEIgzThJ/pub?output=csv";

const SHEET_URL_ORCAMENTO =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqlXQBEGw9oZWtWSVeFbPQyI1mkb0pI30Ucv7Rp7d4P7IrSfvROXjWJJ9yRwmueme9tOl8g2T2bauM/pub?output=csv";

/* ================== UTIL ================== */

const parseCSV = (texto) =>
  Papa.parse(texto, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  }).data;

const parseValorBR = (valor) =>
  Number(valor?.toString().replace(/\./g, "").replace(",", ".")) || 0;

const parseDataBR = (str) => {
  if (!str) return null;
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return new Date(match[3], match[2] - 1, match[1]);
};

/* ================== TEMA ================== */

const theme = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  borderSoft: "#EEF2F7",
  text: "#0F172A",
  text2: "#475569",
  muted: "#64748B",
  primary: "#2563EB",
  primarySoft: "#EFF6FF",
  shadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
  shadowSoft: "0 6px 18px rgba(15, 23, 42, 0.08)",
};

/* ================== STYLES ================== */

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: theme.bg,
    padding: "32px 16px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: theme.text,
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    backgroundColor: theme.surface,
    borderRadius: "16px",
    padding: "32px 24px 24px",
    boxShadow: theme.shadow,
    border: `1px solid ${theme.borderSoft}`,
  },
  titulo: {
    fontSize: "2rem",
    marginBottom: "8px",
  },
  subtitulo: {
    color: theme.text2,
    fontSize: "0.95rem",
  },
  card: {
    borderRadius: "14px",
    border: `1px solid ${theme.border}`,
    padding: "16px",
    backgroundColor: theme.surface,
    boxShadow: theme.shadowSoft,
    marginBottom: "16px",
  },
  execucaoContainer: {
    marginTop: "16px",
    padding: "14px 16px",
    borderRadius: "14px",
    border: `1px solid ${theme.border}`,
  },
  progressBarBackground: {
    width: "100%",
    height: "10px",
    backgroundColor: "#E5E7EB",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.primary,
    transition: "width 0.6s ease",
  },
  footer: {
    marginTop: "32px",
    borderTop: `1px solid ${theme.borderSoft}`,
    paddingTop: "12px",
    textAlign: "right",
    fontSize: "0.75rem",
    color: "#94A3B8",
  },
};

/* ================== COMPONENTE ================== */

function App() {
  const [pagamentos, setPagamentos] = useState([]);
  const [orcamentoTotal, setOrcamentoTotal] = useState(0);

  useEffect(() => {
    async function carregar() {
      const pagResp = await fetch(SHEET_URL_PAGAMENTOS);
      const pagText = await pagResp.text();
      setPagamentos(parseCSV(pagText));

      const orcResp = await fetch(SHEET_URL_ORCAMENTO);
      const orcText = await orcResp.text();
      const dados = parseCSV(orcText);

      const soma = dados.reduce((acc, row) => {
        const valor = Object.values(row).find((v) =>
          v?.toString().includes(",")
        );
        return acc + parseValorBR(valor);
      }, 0);

      setOrcamentoTotal(soma);
    }

    carregar();
  }, []);

  const totalPagamentos = useMemo(
    () =>
      pagamentos.reduce(
        (acc, p) => acc + parseValorBR(p["PAGAMENTO"]),
        0
      ),
    [pagamentos]
  );

  const percentual = orcamentoTotal
    ? (totalPagamentos / orcamentoTotal) * 100
    : 0;

  const totalPorMes = useMemo(() => {
    const mapa = {};

    pagamentos.forEach((p) => {
      const data = parseDataBR(p["Data Pagamento"]);
      if (!data) return;
      const mes = data.getMonth();
      mapa[mes] = (mapa[mes] || 0) + parseValorBR(p["PAGAMENTO"]);
    });

    return Array.from({ length: 12 }).map((_, i) => ({
      mes: i + 1,
      valor: mapa[i] || 0,
    }));
  }, [pagamentos]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.titulo}>SEAF – Conecta</h1>
        <p style={styles.subtitulo}>
          Execução orçamentária e pagamentos da Secretaria.
        </p>

        <div style={styles.card}>
          <p>
            Total Pago:{" "}
            <strong>
              R$ {totalPagamentos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </strong>
          </p>
          <p>
            Orçamento Total:{" "}
            <strong>
              R$ {orcamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </strong>
          </p>

          <div style={styles.execucaoContainer}>
            <p>
              Execução: <strong>{percentual.toFixed(1)}%</strong>
            </p>
            <div style={styles.progressBarBackground}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width: `${Math.min(percentual, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h3>Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={totalPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip
                formatter={(value) =>
                  `R$ ${value.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`
                }
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke={theme.primary}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <footer style={styles.footer}>
          SESAU Recife – Dados provenientes de planilhas oficiais.
        </footer>
      </div>
    </div>
  );
}

export default App;
