import React, { useEffect, useState, useMemo } from "react";
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

// ================== CONFIGURAÇÃO DE TEMA ================== //

const theme = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  borderSoft: "#EEF2F7",
  text: "#0F172A",
  text2: "#475569",
  muted: "#64748B",
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primarySoft: "#EFF6FF",
  danger: "#B91C1C",
  dangerSoft: "#FEF2F2",
  shadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
  shadowSoft: "0 6px 18px rgba(15, 23, 42, 0.08)",
  successText: "#065F46",
  successSoft: "#ECFDF5",
};

// ================== URLs DAS PLANILHAS ================== //

const SHEET_URL_CONTRATOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0KGsk9HAH2ZP9I612PopHCOityrQtkqNAzCTJQkT9B5FqTmbv3ecPODsZJjAN4svMUzi9ILXWc3Oq/pub?output=csv&gid=2116839656";

const SHEET_URL_PAGAMENTOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMAJWBTMJTCZ6isLPAVkN4AUp23myTBn6-FCv-h2Ntu2H1qSaxtKPiO4GIDDbWedCO5-V6XEIgzThJ/pub?output=csv";

const SHEET_URL_ORCAMENTO =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqlXQBEGw9oZWtWSVeFbPQyI1mkb0pI30Ucv7Rp7d4P7IrSfvROXjWJJ9yRwmueme9tOl8g2T2bauM/pub?output=csv";

// ================== FUNÇÕES AUXILIARES ================== //

function parseCSV(texto) {
  const resultado = Papa.parse(texto, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });
  return resultado.data;
}

function buscarPorPalavrasChave(obj, palavras) {
  const entradas = Object.entries(obj);
  const palavrasLower = palavras.map((p) => p.toLowerCase());
  const encontrado = entradas.find(([nomeColuna]) => {
    const nomeLower = nomeColuna.toLowerCase();
    return palavrasLower.some((p) => nomeLower.includes(p));
  });
  return encontrado ? String(encontrado[1]).trim() : "";
}

function parseDataBR(str) {
  if (!str) return null;
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

function parseValorBR(valor) {
  if (!valor) return 0;
  const limpo = valor.toString().replace(/\./g, "").replace(",", ".");
  return parseFloat(limpo) || 0;
}

// ================== MAPEAMENTOS ================== //

const getCredor = (obj) => (obj["ENTIDADE"] || obj["CREDOR"] || obj["EMPRESA CONTRATADA"] || "").trim();
const getNumeroContrato = (obj) => (obj["Nº DO CONTRATO"] || obj["NUMERO DO CONTRATO"] || obj["N CONTRATO"] || "").trim();
const getExecutiva = (obj) => buscarPorPalavrasChave(obj, ["SECRETARIA EXECUTIVA", "EXECUTIVA GERENCIADORA"]);
const getGestor = (obj) => (obj["GESTOR"] || obj["FISCAL"] || "").trim();
const getInicioVigencia = (obj) => (obj["INÍCIO DA VIGÊNCIA DO INSTRUMENTO"] || obj["INICIO DA VIGÊNCIA DO INSTRUMENTO"] || "").trim();
const getFimVigencia = (obj) => (obj["FIM DA VIGÊNCIA DO INSTRUMENTO"] || obj["FIM DA VIGENCIA DO INSTRUMENTO"] || "").trim();
const getValorTotal = (obj) => (obj["VALOR ANUAL (R$)"] || obj["VALOR GLOBAL (R$)"] || "").trim();
const getValorMensal = (obj) => (obj["VALOR MENSAL (R$)"] || "").trim();
const getTermoAtual = (obj) => (obj["TERMO ATUAL"] || "").trim();
const getDiasParaVencer = (obj) => (obj["DIAS"] || "").trim();
const getStatusVigencia = (obj) => (obj["STATUS DA VIGÊNCIA"] || "").trim();
const getMaisRecente = (obj) => (obj["É O MAIS RECENTE?"] || "").trim();

const getPagFonte = (obj) => (obj["Fonte"] || "").trim();
const getPagCredor = (obj) => (obj["Credor"] || "").trim();
const getPagValorPagamento = (obj) => (obj["PAGAMENTO"] || "").trim();
const getPagDocumentoOB = (obj) => (obj["DocumentoOB"] || "").trim();
const getPagNumeroDocFiscal = (obj) => (obj["Nº Doc Fiscal"] || obj["Nº Doc Fiscal "] || "").trim();
const getPagDataPagamento = (obj) => (obj["Data Pagamento"] || "").trim();

const MESES = [
  { num: 1, label: "Jan" }, { num: 2, label: "Fev" }, { num: 3, label: "Mar" },
  { num: 4, label: "Abr" }, { num: 5, label: "Mai" }, { num: 6, label: "Jun" },
  { num: 7, label: "Jul" }, { num: 8, label: "Ago" }, { num: 9, label: "Set" },
  { num: 10, label: "Out" }, { num: 11, label: "Nov" }, { num: 12, label: "Dez" },
];

// ================== ESTILOS ================== //

const styles = {
  page: { minHeight: "100vh", backgroundColor: theme.bg, padding: "32px 16px", fontFamily: "sans-serif", color: theme.text },
  container: { maxWidth: "1100px", margin: "0 auto", backgroundColor: theme.surface, borderRadius: "16px", padding: "32px 24px", boxShadow: theme.shadow, border: `1px solid ${theme.borderSoft}` },
  header: { marginBottom: "20px" },
  titulo: { fontSize: "2rem", marginBottom: "8px" },
  subtitulo: { color: theme.text2, fontSize: "0.95rem" },
  tabsRow: { display: "inline-flex", borderRadius: "999px", backgroundColor: "#EEF2FF", padding: "4px", marginBottom: "16px", border: `1px solid ${theme.border}`, gap: "6px" },
  tabButton: { border: "none", background: "transparent", padding: "8px 16px", borderRadius: "999px", cursor: "pointer", fontSize: "0.9rem", color: theme.text2, fontWeight: 600 },
  tabButtonActive: { backgroundColor: theme.primary, color: "#ffffff", boxShadow: "0 8px 18px rgba(37, 99, 235, 0.28)" },
  formSection: { marginBottom: "18px" },
  label: { display: "block", fontWeight: 700, marginBottom: "8px" },
  formRow: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" },
  input: { flex: 1, padding: "12px", borderRadius: "12px", border: `1px solid ${theme.border}` },
  button: { padding: "12px 18px", borderRadius: "12px", border: "none", backgroundColor: theme.primary, color: "#ffffff", fontWeight: 800, cursor: "pointer" },
  info: { fontSize: "0.9rem", color: theme.text2, marginTop: "6px" },
  resultSection: { marginTop: "18px" },
  resultTitle: { fontSize: "1.25rem", marginBottom: "12px" },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" },
  card: { borderRadius: "14px", border: `1px solid ${theme.border}`, padding: "16px", backgroundColor: theme.surface, boxShadow: theme.shadowSoft },
  cardTitle: { fontSize: "1.05rem", fontWeight: 800, marginBottom: "4px" },
  cardSubtitle: { fontSize: "0.9rem", color: theme.muted },
  dlRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px dashed ${theme.borderSoft}`, fontSize: "0.85rem" },
  monthButtonsContainer: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" },
  monthButton: { borderRadius: "999px", border: `1px solid ${theme.border}`, padding: "6px 12px", cursor: "pointer", fontSize: "0.82rem" },
  monthButtonActive: { backgroundColor: theme.primarySoft, color: theme.primary, borderColor: theme.primary },
  execucaoContainer: { marginTop: "16px", padding: "14px", borderRadius: "14px", border: `1px solid ${theme.border}` },
  progressBarBackground: { width: "100%", height: "10px", backgroundColor: "#E5E7EB", borderRadius: "999px", overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: theme.primary, transition: "width 0.6s ease" },
  footer: { marginTop: "24px", textAlign: "right", fontSize: "0.75rem", color: "#94A3B8" }
};

// ================== COMPONENTE PRINCIPAL ================== //

export default function App() {
  const [contratos, setContratos] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [orcamentoTotal, setOrcamentoTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("contratos");
  const [mesFiltro, setMesFiltro] = useState(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        const [resC, resP, resO] = await Promise.all([
          fetch(SHEET_URL_CONTRATOS).then(r => r.text()),
          fetch(SHEET_URL_PAGAMENTOS).then(r => r.text()),
          fetch(SHEET_URL_ORCAMENTO).then(r => r.text())
        ]);

        const dadosC = parseCSV(resC);
        const dadosP = parseCSV(resP);
        const dadosO = parseCSV(resO);

        setContratos(dadosC);
        setPagamentos(dadosP);

        const somaOrc = dadosO.reduce((acc, lin) => acc + parseValorBR(buscarPorPalavrasChave(lin, ["dot", "atual"])), 0);
        setOrcamentoTotal(somaOrc);
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  const resultadosContratos = useMemo(() => {
    const t = busca.toLowerCase();
    return contratos.filter(c => getCredor(c).toLowerCase().includes(t) || getNumeroContrato(c).toLowerCase().includes(t));
  }, [busca, contratos]);

  const resultadosPagamentos = useMemo(() => {
    let lista = [...pagamentos].sort((a, b) => (parseDataBR(getPagDataPagamento(b)) - parseDataBR(getPagDataPagamento(a))));
    if (busca) {
      const t = busca.toLowerCase();
      lista = lista.filter(p => getPagCredor(p).toLowerCase().includes(t) || getPagDocumentoOB(p).toLowerCase().includes(t));
    }
    if (mesFiltro) {
      lista = lista.filter(p => {
        const d = parseDataBR(getPagDataPagamento(p));
        return d && d.getMonth() + 1 === mesFiltro;
      });
    }
    return lista;
  }, [pagamentos, busca, mesFiltro]);

  const totalValorPagamentos = useMemo(() => 
    resultadosPagamentos.reduce((acc, p) => acc + parseValorBR(getPagValorPagamento(p)), 0)
  , [resultadosPagamentos]);

  const totalPorMes = useMemo(() => {
    const mapa = {};
    resultadosPagamentos.forEach(p => {
      const d = parseDataBR(getPagDataPagamento(p));
      if (d) {
        const m = d.getMonth() + 1;
        mapa[m] = (mapa[m] || 0) + parseValorBR(getPagValorPagamento(p));
      }
    });
    return MESES.map(m => ({ mes: m.label, valor: mapa[m.num] || 0 }));
  }, [resultadosPagamentos]);

  const usandoContratos = tipoConsulta === "contratos";
  const resultados = usandoContratos ? resultadosContratos : resultadosPagamentos;
  const percentualExecutado = orcamentoTotal > 0 ? (totalValorPagamentos / orcamentoTotal) * 100 : 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.titulo}>SEAF – Conecta</h1>
          <p style={styles.subtitulo}>Consulta e análise dos contratos e pagamentos da SEAF/SESAU.</p>
        </header>

        <div style={styles.tabsRow}>
          <button style={{...styles.tabButton, ...(usandoContratos ? styles.tabButtonActive : {})}} onClick={() => setTipoConsulta("contratos")}>Contratos</button>
          <button style={{...styles.tabButton, ...(!usandoContratos ? styles.tabButtonActive : {})}} onClick={() => setTipoConsulta("pagamentos")}>Pagamentos</button>
        </div>

        <section style={styles.formSection}>
          <label style={styles.label}>{usandoContratos ? "Empresa ou Contrato:" : "Empresa ou Documento:"}</label>
          <div style={styles.formRow}>
            <input style={styles.input} type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar..." />
          </div>

          {!usandoContratos && (
            <div style={styles.monthButtonsContainer}>
              {MESES.map(m => (
                <button key={m.num} style={{...styles.monthButton, ...(mesFiltro === m.num ? styles.monthButtonActive : {})}} onClick={() => setMesFiltro(mesFiltro === m.num ? null : m.num)}>
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </section>

        {!carregando && !usandoContratos && (
          <div style={styles.execucaoContainer}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold'}}>
              <span>Execução Orçamentária 2026</span>
              <span>{percentualExecutado.toFixed(1)}%</span>
            </div>
            <div style={styles.progressBarBackground}>
              <div style={{...styles.progressBarFill, width: `${Math.min(percentualExecutado, 100)}%`}} />
            </div>
          </div>
        )}

        <section style={styles.resultSection}>
          <h2 style={styles.resultTitle}>Resultados ({resultados.length})</h2>
          
          {!usandoContratos && (
             <div style={{height: 200, marginBottom: 20, background: '#fff', padding: 10, borderRadius: 10, border: '1px solid #ddd'}}>
                <ResponsiveContainer>
                  <LineChart data={totalPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis hide />
                    <Tooltip formatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`} />
                    <Line type="monotone" dataKey="valor" stroke={theme.primary} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
          )}

          <div style={styles.cardGrid}>
            {resultados.map((item, i) => (
              <article key={i} style={styles.card}>
                <h3 style={styles.cardTitle}>{usandoContratos ? getCredor(item) : getPagCredor(item)}</h3>
                <p style={styles.cardSubtitle}>{usandoContratos ? `Contrato: ${getNumeroContrato(item)}` : `OB: ${getPagDocumentoOB(item)}`}</p>
                <div style={{marginTop: 10}}>
                   <div style={styles.dlRow}><span>{usandoContratos ? 'Vencimento' : 'Data'}</span><span>{usandoContratos ? getFimVigencia(item) : getPagDataPagamento(item)}</span></div>
                   <div style={styles.dlRow}><span>Valor</span><span style={{color: theme.primary, fontWeight: 'bold'}}>{usandoContratos ? getValorTotal(item) : getPagValorPagamento(item)}</span></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer style={styles.footer}>
          <small>SESAU Recife · 2026</small>
        </footer>
      </div>
    </div>
  );
}
