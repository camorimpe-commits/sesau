import { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";

// ================== URLs DAS PLANILHAS ================== //

// CONTRATOS – (já estava funcionando)
const SHEET_URL_CONTRATOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0KGsk9HAH2ZP9I612PopHCOityrQtkqNAzCTJQkT9B5FqTmbv3ecPODsZJjAN4svMUzi9ILXWc3Oq/pub?output=csv&gid=2116839656";

// PAGAMENTOS – nova_base (link público em CSV que você enviou)
const SHEET_URL_PAGAMENTOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMAJWBTMJTCZ6isLPAVkN4AUp23myTBn6-FCv-h2Ntu2H1qSaxtKPiO4GIDDbWedCO5-V6XEIgzThJ/pub?output=csv";

// ================== FUNÇÕES AUXILIARES ================== //

// Converte CSV em array de objetos usando PapaParse
function parseCSV(texto) {
  const resultado = Papa.parse(texto, {
    header: true, // primeira linha vira cabeçalho
    skipEmptyLines: true, // ignora linhas em branco
    dynamicTyping: false, // mantém tudo como string (bom para exibir)
    transformHeader: (h) => h.trim(), // tira espaços extras dos nomes de coluna
  });

  if (resultado.errors && resultado.errors.length > 0) {
    console.warn("Erros ao fazer parse do CSV:", resultado.errors);
  }

  // resultado.data já é um array de objetos { Coluna: Valor }
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

// ================== MAPEAMENTO – CONTRATOS ================== //

// Credor / empresa contratada
function getCredor(obj) {
  return (
    obj["ENTIDADE"] || // nome da coluna na planilha
    obj["CREDOR"] ||
    obj["EMPRESA CONTRATADA"] ||
    ""
  ).trim();
}

// Número do contrato
function getNumeroContrato(obj) {
  return (
    obj["Nº DO CONTRATO"] ||
    obj["NUMERO DO CONTRATO"] ||
    obj["N CONTRATO"] ||
    ""
  ).trim();
}

// Executiva (usa palavras-chave)
function getExecutiva(obj) {
  return buscarPorPalavrasChave(obj, [
    "SECRETARIA EXECUTIVA",
    "EXECUTIVA GERENCIADORA",
  ]);
}

// Gestor(a) do contrato
function getGestor(obj) {
  return (obj["GESTOR"] || obj["FISCAL"] || "").trim();
}

// Início da vigência
function getInicioVigencia(obj) {
  return (
    obj["INÍCIO DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj["INICIO DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj["INICIO VIGENCIA"] ||
    ""
  ).trim();
}

// Fim da vigência
function getFimVigencia(obj) {
  return (
    obj["FIM DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj["FIM DA VIGENCIA DO INSTRUMENTO"] ||
    obj["FIM VIGENCIA"] ||
    ""
  ).trim();
}

// Valor total do contrato
function getValorTotal(obj) {
  return (
    obj["VALOR ANUAL (R$)"] ||
    obj["VALOR GLOBAL (R$)"] ||
    obj["VALOR TOTAL (R$)"] ||
    ""
  ).trim();
}

// Valor mensal
function getValorMensal(obj) {
  return (
    obj["VALOR MENSAL (R$)"] ||
    obj["VALOR MENSAL ESTIMADO (R$)"] ||
    ""
  ).trim();
}

// Termo atual
function getTermoAtual(obj) {
  return (obj["TERMO ATUAL"] || "").trim();
}

// Dias para vencimento
function getDiasParaVencer(obj) {
  return (obj["DIAS"] || "").trim();
}

// Status da vigência
function getStatusVigencia(obj) {
  return (obj["STATUS DA VIGÊNCIA"] || "").trim();
}

// Indica se é o contrato mais recente
function getMaisRecente(obj) {
  return (obj["É O MAIS RECENTE?"] || "").trim();
}

// ================== MAPEAMENTO – PAGAMENTOS (nova_base) ================== //
//
// Colunas informadas por você:
// Fonte | Credor | PAGAMENTO | DocumentoOB | Nº Doc Fiscal | Data Pagamento
//

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

// ================== COMPONENTE PRINCIPAL ================== //

function App() {
  console.log("SESAU app carregado");

  const [contratos, setContratos] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erroContratos, setErroContratos] = useState("");
  const [erroPagamentos, setErroPagamentos] = useState("");

  const [busca, setBusca] = useState("");
  const [totalContratos, setTotalContratos] = useState(0);
  const [totalPagamentos, setTotalPagamentos] = useState(0);

  const [tipoConsulta, setTipoConsulta] = useState("contratos"); // "contratos" | "pagamentos"

  // Carrega dados das duas planilhas ao iniciar
  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErroContratos("");
        setErroPagamentos("");

        // --- CONTRATOS --- //
        console.log("Iniciando fetch da planilha de CONTRATOS...");
        const respContratos = await fetch(SHEET_URL_CONTRATOS);
        if (!respContratos.ok) {
          throw new Error("Erro ao buscar dados da planilha de contratos");
        }
        const textoContratos = await respContratos.text();
        const dadosContratos = parseCSV(textoContratos);
        console.log("Contratos carregados:", dadosContratos.length);
        if (dadosContratos[0]) {
          console.log("Primeira linha de contratos:", dadosContratos[0]);
        }
        setContratos(dadosContratos);
        setTotalContratos(dadosContratos.length);

        // --- PAGAMENTOS --- //
        try {
          console.log("Iniciando fetch da planilha de PAGAMENTOS...");
          const respPag = await fetch(SHEET_URL_PAGAMENTOS);
          if (!respPag.ok) {
            throw new Error("Erro ao buscar dados da planilha de pagamentos");
          }
          const textoPag = await respPag.text();
          const dadosPag = parseCSV(textoPag);
          console.log("Pagamentos carregados:", dadosPag.length);
          if (dadosPag[0]) {
            console.log("Primeira linha de pagamentos:", dadosPag[0]);
          }
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

  // ================== BUSCA / RESULTADOS ================== //

  const resultadosContratos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];

    return contratos.filter((c) => {
      const credor = getCredor(c).toLowerCase();
      const numeroContrato = getNumeroContrato(c).toLowerCase();
      return credor.includes(termo) || numeroContrato.includes(termo);
    });
  }, [busca, contratos]);

  const resultadosPagamentos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];

    return pagamentos.filter((p) => {
      const credor = getPagCredor(p).toLowerCase();
      const docOB = getPagDocumentoOB(p).toLowerCase();
      const docFiscal = getPagNumeroDocFiscal(p).toLowerCase();
      return (
        credor.includes(termo) ||
        docOB.includes(termo) ||
        docFiscal.includes(termo)
      );
    });
  }, [busca, pagamentos]);

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
            onClick={() => setTipoConsulta("contratos")}
            style={{
              ...styles.tabButton,
              ...(usandoContratos ? styles.tabButtonActive : {}),
            }}
          >
            Contratos
          </button>
          <button
            type="button"
            onClick={() => setTipoConsulta("pagamentos")}
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
                        <dd>{valor || "—"}</dd>
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

// ================== STYLES (os mesmos que você já usa) ================== //

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fb",
    padding: "32px 16px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "32px 24px 24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },
  header: {
    marginBottom: "24px",
  },
  titulo: {
    fontSize: "2rem",
    marginBottom: "8px",
    color: "#0f172a",
  },
  subtitulo: {
    color: "#475569",
    fontSize: "0.95rem",
    maxWidth: "720px",
  },
  tabsRow: {
    display: "inline-flex",
    borderRadius: "999px",
    backgroundColor: "#e5edff",
    padding: "4px",
    marginBottom: "16px",
  },
  tabButton: {
    border: "none",
    background: "transparent",
    padding: "6px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: "#4b5563",
  },
  tabButtonActive: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: 600,
    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.4)",
  },
  formSection: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontWeight: 600,
    marginBottom: "8px",
    color: "#1f2933",
  },
  formRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
  },
  button: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },
  info: {
    fontSize: "0.9rem",
    color: "#475569",
    marginTop: "4px",
  },
  erro: {
    fontSize: "0.9rem",
    color: "#b91c1c",
    marginTop: "4px",
  },
  resultSection: {
    marginTop: "24px",
  },
  resultTitle: {
    fontSize: "1.25rem",
    marginBottom: "12px",
    color: "#0f172a",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
  },
  card: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "16px 16px 12px",
    backgroundColor: "#f9fafb",
  },
  cardHeader: {
    marginBottom: "10px",
  },
  cardTitle: {
    fontSize: "1.05rem",
    marginBottom: "2px",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: "0.9rem",
    color: "#64748b",
  },
  dl: {
    margin: 0,
    fontSize: "0.85rem",
  },
  dlRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    padding: "4px 0",
    borderBottom: "1px dashed #e2e8f0",
  },
  footer: {
    marginTop: "24px",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "12px",
    textAlign: "right",
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
};

export default App;
