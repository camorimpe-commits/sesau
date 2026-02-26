import { useEffect, useMemo, useState } from "react";
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
  Number(
    String(valor || "")
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  ) || 0;

const parseDataBR = (str) => {
  if (!str) return null;
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return new Date(match[3], match[2] - 1, match[1]);
};

const formatBRL = (num) =>
  Number(num || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  });

/* ================== GETTERS ================== */

const getCredor = (o) =>
  (o?.["ENTIDADE"] ||
    o?.["CREDOR"] ||
    o?.["EMPRESA CONTRATADA"] ||
    "").trim();

const getNumeroContrato = (o) =>
  (o?.["Nº DO CONTRATO"] ||
    o?.["NUMERO DO CONTRATO"] ||
    o?.["N CONTRATO"] ||
    "").trim();

const getValorTotal = (o) =>
  (o?.["VALOR ANUAL (R$)"] ||
    o?.["VALOR GLOBAL (R$)"] ||
    o?.["VALOR TOTAL (R$)"] ||
    "").trim();

const getValorMensal = (o) =>
  (o?.["VALOR MENSAL (R$)"] ||
    o?.["VALOR MENSAL ESTIMADO (R$)"] ||
    "").trim();

const getFimVigencia = (o) =>
  (o?.["FIM DA VIGÊNCIA DO INSTRUMENTO"] ||
    o?.["FIM DA VIGENCIA DO INSTRUMENTO"] ||
    o?.["FIM VIGENCIA"] ||
    "").trim();

const getPagValor = (o) => (o?.["PAGAMENTO"] || "").trim();
const getPagData = (o) => (o?.["Data Pagamento"] || "").trim();
const getPagCredor = (o) => (o?.["Credor"] || "").trim();

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
  shadow: "0 12px 28px rgba(15,23,42,0.10)",
  shadowSoft: "0 6px 18px rgba(15,23,42,0.08)",
};

/* ================== APP ================== */

function App() {
  const [contratos, setContratos] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [orcamentoTotal, setOrcamentoTotal] = useState(0);
  const [tipoConsulta, setTipoConsulta] = useState("contratos");
  const [busca, setBusca] = useState("");
  const [mesFiltro, setMesFiltro] = useState(null);

  useEffect(() => {
    async function carregar() {
      const c = await fetch(SHEET_URL_CONTRATOS).then((r) => r.text());
      const p = await fetch(SHEET_URL_PAGAMENTOS).then((r) => r.text());
      const o = await fetch(SHEET_URL_ORCAMENTO).then((r) => r.text());

      setContratos(parseCSV(c));
      setPagamentos(parseCSV(p));

      const dadosOrc = parseCSV(o);
      const soma = dadosOrc.reduce((acc, row) => {
        const valor = Object.values(row).find((v) =>
          String(v).includes(",")
        );
        return acc + parseValorBR(valor);
      }, 0);

      setOrcamentoTotal(soma);
    }

    carregar();
  }, []);

  const usandoContratos = tipoConsulta === "contratos";

  /* ================== KPIs CONTRATOS ================== */

  const valorGlobalContratos = useMemo(
    () =>
      contratos.reduce(
        (acc, c) => acc + parseValorBR(getValorTotal(c)),
        0
      ),
    [contratos]
  );

  const valorMensalContratos = useMemo(
    () =>
      contratos.reduce(
        (acc, c) => acc + parseValorBR(getValorMensal(c)),
        0
      ),
    [contratos]
  );

  const contratosVencendo60Dias = useMemo(() => {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(hoje.getDate() + 60);

    return contratos.filter((c) => {
      const fim = parseDataBR(getFimVigencia(c));
      return fim && fim >= hoje && fim <= limite;
    }).length;
  }, [contratos]);

  /* ================== PAGAMENTOS ================== */

  const pagamentosFiltrados = useMemo(() => {
    let lista = [...pagamentos];

    if (busca) {
      lista = lista.filter((p) =>
        getPagCredor(p).toLowerCase().includes(busca.toLowerCase())
      );
    }

    if (mesFiltro) {
      lista = lista.filter((p) => {
        const d = parseDataBR(getPagData(p));
        return d && d.getMonth() + 1 === mesFiltro;
      });
    }

    return lista;
  }, [pagamentos, busca, mesFiltro]);

  const totalPago = useMemo(
    () =>
      pagamentosFiltrados.reduce(
        (acc, p) => acc + parseValorBR(getPagValor(p)),
        0
      ),
    [pagamentosFiltrados]
  );

  const percentualExecucao =
    orcamentoTotal > 0 ? (totalPago / orcamentoTotal) * 100 : 0;

  /* ================== RENDER ================== */

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.titulo}>SEAF – Conecta</h1>

        {/* TABS */}
        <div style={styles.tabsRow}>
          <button
            onClick={() => setTipoConsulta("contratos")}
            style={{
              ...styles.tabButton,
              ...(usandoContratos ? styles.tabButtonActive : {}),
            }}
          >
            Contratos
          </button>

          <button
            onClick={() => setTipoConsulta("pagamentos")}
            style={{
              ...styles.tabButton,
              ...(!usandoContratos ? styles.tabButtonActive : {}),
            }}
          >
            Pagamentos
          </button>
        </div>

        {/* KPIs */}
        <div style={styles.kpiRow}>
          {usandoContratos ? (
            <>
              <StatPill
                label="Contratos carregados"
                value={contratos.length}
              />
              <StatPill
                label="Valor global dos contratos"
                value={`R$ ${formatBRL(valorGlobalContratos)}`}
              />
              <StatPill
                label="Valor mensal estimado"
                value={`R$ ${formatBRL(valorMensalContratos)}`}
              />
              <StatPill
                label="Vencendo em até 60 dias"
                value={contratosVencendo60Dias}
              />
            </>
          ) : (
            <>
              <StatPill
                label="Pagamentos carregados"
                value={pagamentos.length}
              />
              <StatPill
                label="Total pago (filtro atual)"
                value={`R$ ${formatBRL(totalPago)}`}
              />
              <StatPill
                label="Execução"
                value={`${percentualExecucao.toFixed(1)}%`}
              />
            </>
          )}
        </div>

        <footer style={styles.footer}>
          SESAU Recife – Dados provenientes de planilhas oficiais.
        </footer>
      </div>
    </div>
  );
}

/* ================== COMPONENTE STAT ================== */

function StatPill({ label, value }) {
  return (
    <div style={styles.statPill}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

/* ================== STYLES ================== */

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: theme.bg,
    padding: 32,
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    backgroundColor: theme.surface,
    padding: 24,
    borderRadius: 16,
    border: `1px solid ${theme.borderSoft}`,
    boxShadow: theme.shadow,
  },
  titulo: { marginBottom: 16 },
  tabsRow: { display: "flex", gap: 10, marginBottom: 20 },
  tabButton: {
    padding: "8px 16px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    background: "#e5e7eb",
  },
  tabButtonActive: { backgroundColor: theme.primary, color: "#fff" },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 14,
  },
  statPill: {
    background: "#fff",
    border: `1px solid ${theme.border}`,
    padding: 16,
    borderRadius: 12,
    boxShadow: theme.shadowSoft,
  },
  statLabel: { fontSize: 12, color: theme.muted },
  statValue: { fontSize: 18, fontWeight: 700 },
  footer: { marginTop: 30, fontSize: 12, textAlign: "right" },
};

export default App;
