import { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";

// ================== URLs DAS PLANILHAS ================== //

const SHEET_URL_CONTRATOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0KGsk9HAH2ZP9I612PopHCOityrQtkqNAzCTJQkT9B5FqTmbv3ecPODsZJjAN4svMUzi9ILXWc3Oq/pub?output=csv&gid=2116839656";

const SHEET_URL_PAGAMENTOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMAJWBTMJTCZ6isLPAVkN4AUp23myTBn6-FCv-h2Ntu2H1qSaxtKPiO4GIDDbWedCO5-V6XEIgzThJ/pub?output=csv";

// ================== FUNÇÕES AUXILIARES ================== //

// Converte CSV em array de objetos usando PapaParse
function parseCSV(texto) {
  const resultado = Papa.parse(texto, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });

  if (resultado.errors && resultado.errors.length > 0) {
    console.warn("Erros ao fazer parse do CSV:", resultado.errors);
  }

  return resultado.data;
}

// Procura um valor pela "cara" do nome da coluna (palavras-chave)
function buscarPorPalavrasChave(obj, palavras) {
  const entradas = Object.entries(obj);
  const palavrasLower = palavras.map((p) => p.toLowerCase());

  const encontrado = entradas.find(([nomeColuna]) => {
    const nomeLower = nomeColuna.toLowerCase();
    return palavrasLower.some((p) => nomeLower.includes(p));
  });

  return encontrado ? String(encontrado[1]).trim() : "";
}

// Converte "dd/mm/aaaa" em Date
function parseDataBR(str) {
  if (!str) return null;
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const dia = Number(match[1]);
  const mes = Number(match[2]); // 1–12
  const ano = Number(match[3]);
  if (!dia || !mes || !ano) return null;
  return new Date(ano, mes - 1, dia);
}

// ================== MAPEAMENTO – CONTRATOS ================== //

function getCredor(obj) {
  return (
    obj["ENTIDADE"] ||
    obj["CREDOR"] ||
    obj["EMPRESA CONTRATADA"] ||
    ""
  ).trim();
}

function getNumeroContrato(obj) {
  return (
    obj["Nº DO CONTRATO"] ||
    obj["NUMERO DO CONTRATO"] ||
    obj["N CONTRATO"] ||
    ""
  ).trim();
}

function getExecutiva(obj) {
  return buscarPorPalavrasChave(obj, [
    "SECRETARIA EXECUTIVA",
    "EXECUTIVA GERENCIADORA",
  ]);
}

function getGestor(obj) {
  return (obj["GESTOR"] || obj["FISCAL"] || "").trim();
}

function getInicioVigencia(obj) {
  return (
    obj["INÍCIO DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj["INICIO DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj["INICIO VIGENCIA"] ||
    ""
  ).trim();
}

function getFimVigencia(obj) {
  return (
    obj["FIM DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj["FIM DA VIGENCIA DO INSTRUMENTO"] ||
    obj["FIM VIGENCIA"] ||
    ""
  ).trim();
}

function getValorTotal(obj) {
  return (
    obj["VALOR ANUAL (R$)"] ||
    obj["VALOR GLOBAL (R$)"] ||
    obj["VALOR TOTAL (R$)"] ||
    ""
  ).trim();
}

function getValorMensal(obj) {
  return (
    obj["VALOR MENSAL (R$)"] ||
    obj["VALOR MENSAL ESTIMADO (R$)"] ||
    ""
  ).trim();
}

function getTermoAtual(obj) {
  return (obj["TERMO ATUAL"] || "").trim();
}

function getDiasParaVencer(obj) {
  return (obj["DIAS"] || "").trim();
}

function getStatusVigencia(obj) {
  return (obj["STATUS DA VIGÊNCIA"] || "").trim();
}

function getMaisRecente(obj) {
  return (obj["É O MAIS RECENTE?"] || "").trim();
}

// ================== MAPEAMENTO – PAGAMENTOS (nova_base) ================== //
// Fonte | Credor | PAGAMENTO | DocumentoOB | Nº Doc Fiscal | Data Pagamento

function getPagFonte(obj) {
  return (obj["Fonte"] || "").trim();
}

function getPagCredor(obj) {
  return (obj["Credor"] || "").trim();
}

function getPagValorPagamento(obj) {
  return (obj["PAGAMENTO"] || "").trim();
}

function getPagDocumentoOB(obj) {
  return (obj["DocumentoOB"] || "").trim();
}

function getPagNumeroDocFiscal(obj) {
  return (obj["Nº Doc Fiscal"] || obj["Nº Doc Fiscal "] || "").trim();
}

function getPagDataPagamento(obj) {
  return (obj["Data Pagamento"] || "").trim();
}

// ================== CONSTANTE – MESES ================== //

const MESES = [
  { num: 1, label: "Jan" },
  { num: 2, label: "Fev" },
  { num: 3, label: "Mar" },
  { num: 4, label: "Abr" },
  { num: 5, label: "Mai" },
  { num: 6, label: "Jun" },
  { num: 7, label: "Jul" },
  { num: 8, label: "Ago" },
  { num: 9, label: "Set" },
  { num: 10, label: "Out" },
  { num: 11, label: "Nov" },
  { num: 12, label: "Dez" },
];

// ================== COMPONENTE PRINCIPAL ================== //

function App() {
  const [contratos, setContratos] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erroContratos, setErroContratos] = useState("");
  const [erroPagamentos, setErroPagamentos] = useState("");

  const [busca, setBusca] = useState("");
  const [totalContratos, setTotalContratos] = useState(0);
  const [totalPagamentos, setTotalPagamentos] = useState(0);

  const [tipoConsulta, setTipoConsulta] = useState("contratos"); // "contratos" | "pagamentos"
  const [mesFiltro, setMesFiltro] = useState(null); // 1–12 ou null

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErroContratos("");
        setErroPagamentos("");

        // CONTRATOS
        const respContratos = await fetch(SHEET_URL_CONTRATOS);
        if (!respContratos.ok) {
          throw new Error("Erro ao buscar dados da planilha de contratos");
        }
        const textoContratos = await respContratos.text();
        const dadosContratos = parseCSV(textoContratos);
        setContratos(dadosContratos);
        setTotalContratos(dadosContratos.length);

        // PAGAMENTOS
        try {
          const respPag = await fetch(SHEET_URL_PAGAMENTOS);
          if (!respPag.ok) {
            throw new Error("Erro ao buscar dados da planilha de pagamentos");
          }
          const textoPag = await respPag.text();
          const dadosPag = parseCSV(textoPag);
          setPagamentos(dadosPag);
          setTotalPagamentos(dadosPag.length);
        } catch (e) {
          console.error("Erro ao carregar PAGAMENTOS:", e);
          setErroPagamentos(
            "Não foi possível carregar os pagamentos. Verifique a planilha 'nova_base'."
          );
        }
      } catch (e) {
        console.error("Erro ao carregar CONTRATOS:", e);
        setErroContratos(
          "Não foi possível carregar os contratos. Verifique a planilha ou tente novamente mais tarde."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  // ---------- BUSCA CONTRATOS ---------- //

  const resultadosContratos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];

    return contratos.filter((c) => {
      const credor = getCredor(c).toLowerCase();
      const numeroContrato = getNumeroContrato(c).toLowerCase();
      return credor.includes(termo) || numeroContrato.includes(termo);
    });
  }, [busca, contratos]);

  // ---------- BUSCA + ORDEM + FILTRO – PAGAMENTOS ---------- //

  const resultadosPagamentos = useMemo(() => {
    // 1) ordena por Data Pagamento (mais recente primeiro)
    let lista = [...pagamentos].sort((a, b) => {
      const da = parseDataBR(getPagDataPagamento(a));
      const db = parseDataBR(getPagDataPagamento(b));
      if (!da && !db) return 0;
      if (!da) return 1; // sem data vai para o final
      if (!db) return -1;
      return db - da; // desc
    });

    const termo = busca.trim().toLowerCase();

    // 2) filtro de texto
    if (termo) {
      lista = lista.filter((p) => {
        const credor = getPagCredor(p).toLowerCase();
        const docOB = getPagDocumentoOB(p).toLowerCase();
        const docFiscal = getPagNumeroDocFiscal(p).toLowerCase();
        return (
          credor.includes(termo) ||
          docOB.includes(termo) ||
          docFiscal.includes(termo)
        );
      });
    }

    // 3) filtro por mês
    if (mesFiltro) {
      lista = lista.filter((p) => {
        const data = parseDataBR(getPagDataPagamento(p));
        if (!data) return false;
        return data.getMonth() + 1 === mesFiltro; // getMonth 0–11
      });
    }

    return lista;
  }, [pagamentos, busca, mesFiltro]);

  const usandoContratos = tipoConsulta === "contratos";
  const resultados = usandoContratos ? resultadosContratos : resultadosPagamentos;
  const erro = usandoContratos ? erroContratos : erroPagamentos;
  const totalRegistros = usandoContratos ? totalContratos : totalPagamentos;

  // ================== RENDER ================== //

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.titulo}>SESAU – Consulta de Contratos Públicos</h1>
          <p style={styles.subtitulo}>
            Digite o número do contrato, documento ou o nome da
            entidade/empresa para consultar informações oficiais de contratos e
            pagamentos da Secretaria de Saúde do Recife.
          </p>
        </header>

        {/* Abas de tipo de consulta */}
        <div style={styles.tabsRow}>
          <button
            type="button"
            onClick={() => {
              setTipoConsulta("contratos");
              setMesFiltro(null);
            }}
            style={{
              ...styles.tabButton,
              ...(usandoContratos ? styles.tabButtonActive : {}),
            }}
          >
            Contratos
          </button>
          <button
            type="button"
            onClick={() => {
              setTipoConsulta("pagamentos");
            }}
            style={{
              ...styles.tabButton,
              ...(!usandoContratos ? styles.tabButtonActive : {}),
            }}
          >
            Pagamentos
          </button>
        </div>

        <section style={styles.formSection}>
          <label htmlFor="busca" style={styles.label}>
            {usandoContratos
              ? "Número do contrato ou nome da empresa:"
              : "Nome da empresa, Documento OB ou Nº Doc Fiscal:"}
          </label>
          <div style={styles.formRow}>
            <input
              id="busca"
              type="text"
              placeholder={
                usandoContratos
                  ? "Ex: 2025-001 ou ADLIM"
                  : "Ex: ADLIM, Nº OB ou Nº Nota Fiscal"
              }
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={styles.input}
            />
            <button
              type="button"
              style={styles.button}
              onClick={() => setBusca(busca.trim())}
            >
              Buscar
            </button>
          </div>

          {/* Filtro por mês – aparece só na aba Pagamentos */}
          {!usandoContratos && (
            <div style={styles.monthFilterRow}>
              <span style={styles.monthFilterLabel}>
                Filtrar por mês de pagamento:
              </span>
              <div style={styles.monthButtonsContainer}>
                {MESES.map((m) => (
                  <button
                    key={m.num}
                    type="button"
                    onClick={() =>
                      setMesFiltro(mesFiltro === m.num ? null : m.num)
                    }
                    style={{
                      ...styles.monthButton,
                      ...(mesFiltro === m.num ? styles.monthButtonActive : {}),
                    }}
                  >
                    {m.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMesFiltro(null)}
                  style={styles.monthClearButton}
                >
                  Limpar
                </button>
              </div>
            </div>
          )}

          {carregando && (
            <p style={styles.info}>
              Carregando {usandoContratos ? "contratos" : "pagamentos"}...
            </p>
          )}

          {!carregando && !erro && (
            <p style={styles.info}>
              {usandoContratos ? "Contratos" : "Registros de pagamento"}{" "}
              carregados da planilha: <strong>{totalRegistros}</strong>
            </p>
          )}

          {erro && <p style={styles.erro}>{erro}</p>}

          {!carregando && !erro && busca && resultados.length === 0 && (
            <p style={styles.info}>
              Nenhum resultado encontrado para a busca informada.
            </p>
          )}
        </section>

        {/* Resultados – CONTRATOS */}
        {resultados.length > 0 && usandoContratos && (
          <section style={styles.resultSection}>
            <h2 style={styles.resultTitle}>
              Resultados ({resultados.length} contrato
              {resultados.length > 1 ? "s" : ""})
            </h2>

            <div style={styles.cardGrid}>
              {resultados.map((c, idx) => {
                const credor = getCredor(c);
                const numeroContrato = getNumeroContrato(c);
                const executiva = getExecutiva(c);
                const gestor = getGestor(c);
                const inicioVigencia = getInicioVigencia(c);
                const fimVigencia = getFimVigencia(c);
                const valorTotal = getValorTotal(c);
                const valorMensal = getValorMensal(c);
                const termoAtual = getTermoAtual(c);
                const diasParaVencer = getDiasParaVencer(c);
                const statusVigencia = getStatusVigencia(c);
                const maisRecente = getMaisRecente(c);

                return (
                  <article key={idx} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <h3 style={styles.cardTitle}>
                        {credor || "Credor não informado"}
                      </h3>
                      <p style={styles.cardSubtitle}>
                        Contrato: <strong>{numeroContrato || "—"}</strong>
                      </p>
                    </div>

                    <dl style={styles.dl}>
                      <div style={styles.dlRow}>
                        <dt>Executiva</dt>
                        <dd>{executiva || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Gestor(a) do contrato</dt>
                        <dd>{gestor || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Início da vigência</dt>
                        <dd>{inicioVigencia || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Fim da vigência</dt>
                        <dd>{fimVigencia || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Valor total do contrato</dt>
                        <dd>{valorTotal || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Valor mensal</dt>
                        <dd>{valorMensal || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Termo atual</dt>
                        <dd>{termoAtual || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Dias para vencimento</dt>
                        <dd>{diasParaVencer || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Status da vigência</dt>
                        <dd>{statusVigencia || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Contrato mais recente?</dt>
                        <dd>{maisRecente || "—"}</dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Resultados – PAGAMENTOS */}
        {resultados.length > 0 && !usandoContratos && (
          <section style={styles.resultSection}>
            <h2 style={styles.resultTitle}>
              Resultados ({resultados.length} pagamento
              {resultados.length > 1 ? "s" : ""})
            </h2>

            <div style={styles.cardGrid}>
              {resultados.map((p, idx) => {
                const fonte = getPagFonte(p);
                const credor = getPagCredor(p);
                const valor = getPagValorPagamento(p);
                const docOB = getPagDocumentoOB(p);
                const docFiscal = getPagNumeroDocFiscal(p);
                const data = getPagDataPagamento(p);

                return (
                  <article key={idx} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <h3 style={styles.cardTitle}>
                        {credor || "Credor não informado"}
                      </h3>
                      <p style={styles.cardSubtitle}>
                        Documento OB: <strong>{docOB || "—"}</strong>
                      </p>
                    </div>

                    <dl style={styles.dl}>
                      <div style={styles.dlRow}>
                        <dt>Fonte</dt>
                        <dd>{fonte || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Valor do pagamento</dt>
                        <dd>{valor ? <span className="valuePill">{valor}</span> : "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Nº Doc Fiscal</dt>
                        <dd>{docFiscal || "—"}</dd>
                      </div>
                      <div style={styles.dlRow}>
                        <dt>Data do pagamento</dt>
                        <dd>{data || "—"}</dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <footer style={styles.footer}>
          <small>
            SESAU Recife – Consulta pública de contratos e pagamentos · Dados
            provenientes de planilhas oficiais da Secretaria de Saúde.
          </small>
        </footer>
      </div>
    </div>
  );
}

// ================== STYLES ================== //

// ================== STYLES (ATUALIZADO) ================== //

const theme = {
  bg: "#F8FAFC",          // fundo da página (mais leve)
  surface: "#FFFFFF",     // superfície (container/cards)
  border: "#E2E8F0",      // bordas neutras
  borderSoft: "#EEF2F7",  // divisórias bem suaves
  text: "#0F172A",        // texto principal
  text2: "#475569",       // texto secundário
  muted: "#64748B",       // legendas
  primary: "#2563EB",     // azul principal
  primaryHover: "#1D4ED8",
  primarySoft: "#EFF6FF", // azul clarinho (fundos/ativos leves)
  danger: "#B91C1C",
  dangerSoft: "#FEF2F2",
  shadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
  shadowSoft: "0 6px 18px rgba(15, 23, 42, 0.08)",
  successText: "#065F46",
  successSoft: "#ECFDF5",
};

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: theme.bg,
    padding: "32px 16px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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

  header: {
    marginBottom: "20px",
  },

  titulo: {
    fontSize: "2rem",
    marginBottom: "8px",
    color: theme.text,
    letterSpacing: "-0.02em",
  },

  subtitulo: {
    color: theme.text2,
    fontSize: "0.95rem",
    maxWidth: "760px",
    lineHeight: 1.4,
  },

  // Tabs
  tabsRow: {
    display: "inline-flex",
    borderRadius: "999px",
    backgroundColor: "#EEF2FF",
    padding: "4px",
    marginBottom: "16px",
    border: `1px solid ${theme.border}`,
    gap: "6px",
  },

  tabButton: {
    border: "none",
    background: "transparent",
    padding: "8px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: theme.text2,
    fontWeight: 600,
  },

  tabButtonActive: {
    backgroundColor: theme.primary,
    color: "#ffffff",
    fontWeight: 700,
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.28)",
  },

  // Form
  formSection: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    fontWeight: 700,
    marginBottom: "8px",
    color: theme.text,
  },

  formRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "8px",
  },

  input: {
    flex: 1,
    padding: "12px 12px",
    borderRadius: "12px",
    border: `1px solid ${theme.border}`,
    fontSize: "0.95rem",
    outline: "none",
    backgroundColor: "#fff",
    color: theme.text,
  },

  button: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: theme.primary,
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(37, 99, 235, 0.20)",
  },

  info: {
    fontSize: "0.9rem",
    color: theme.text2,
    marginTop: "6px",
  },

  erro: {
    fontSize: "0.9rem",
    color: theme.danger,
    marginTop: "6px",
    backgroundColor: theme.dangerSoft,
    border: "1px solid #FECACA",
    padding: "10px 12px",
    borderRadius: "12px",
    fontWeight: 700,
  },

  // Resultados
  resultSection: {
    marginTop: "18px",
  },

  resultTitle: {
    fontSize: "1.25rem",
    marginBottom: "12px",
    color: theme.text,
    letterSpacing: "-0.01em",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "14px",
  },

  card: {
    borderRadius: "14px",
    border: `1px solid ${theme.border}`,
    padding: "16px 16px 12px",
    backgroundColor: theme.surface,
    boxShadow: theme.shadowSoft,
  },

  cardHeader: {
    marginBottom: "10px",
  },

  cardTitle: {
    fontSize: "1.05rem",
    marginBottom: "4px",
    color: theme.text,
    fontWeight: 800,
  },

  cardSubtitle: {
    fontSize: "0.9rem",
    color: theme.muted,
  },

  dl: {
    margin: 0,
    fontSize: "0.85rem",
  },

  dlRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    padding: "6px 0",
    borderBottom: `1px dashed ${theme.borderSoft}`,
    color: theme.text2,
  },

  // Filtro por mês
  monthFilterRow: {
    marginTop: "10px",
    marginBottom: "10px",
  },

  monthFilterLabel: {
    fontSize: "0.85rem",
    color: theme.text2,
    marginRight: "8px",
    display: "block",
    marginBottom: "6px",
    fontWeight: 700,
  },

  monthButtonsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  monthButton: {
    borderRadius: "999px",
    border: `1px solid ${theme.border}`,
    backgroundColor: "#ffffff",
    padding: "6px 12px",
    fontSize: "0.82rem",
    cursor: "pointer",
    color: theme.text2,
    fontWeight: 700,
  },

  monthButtonActive: {
    backgroundColor: theme.primarySoft, // ativo mais leve (melhor leitura)
    color: theme.primaryHover,
    borderColor: "rgba(37, 99, 235, 0.45)",
  },

  monthClearButton: {
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#F1F5F9",
    padding: "6px 12px",
    fontSize: "0.82rem",
    cursor: "pointer",
    color: theme.text,
    fontWeight: 800,
  },

  footer: {
    marginTop: "24px",
    borderTop: `1px solid ${theme.borderSoft}`,
    paddingTop: "12px",
    textAlign: "right",
    fontSize: "0.75rem",
    color: "#94A3B8",
  },
};

export default App;
