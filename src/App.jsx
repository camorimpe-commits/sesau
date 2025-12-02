import { useEffect, useState, useMemo } from "react";

import Papa from "papaparse";


// URL pública da planilha da SESAU (formato CSV)
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0KGsk9HAH2ZP9I612PopHCOityrQtkqNAzCTJQkT9B5FqTmbv3ecPODsZJjAN4svMUzi9ILXWc3Oq/pub?output=csv&gid=2116839656";

// Converte CSV em array de objetos
function parseCSV(texto) {
  const linhas = texto.trim().split("\n");
  if (linhas.length < 2) return [];

  // Detecta separador (vírgula ou ponto e vírgula)
  const separador =
    (linhas[0].match(/;/g) || []).length > (linhas[0].match(/,/g) || []).length
      ? ";"
      : ",";

  const cabecalhos = linhas[0].split(separador).map((h) => h.trim());

  const dados = linhas.slice(1).map((linha) => {
    if (!linha.trim()) return null;

    const valores = linha.split(separador);
    const obj = {};

    cabecalhos.forEach((cab, idx) => {
      obj[cab] = (valores[idx] || "").trim();
    });

    return obj;
  });

  return dados.filter(Boolean);
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

// === FUNÇÕES DE MAPEAMENTO DAS COLUNAS DA PLANILHA ===

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
    ""
  ).trim();
}

// Executiva (usa palavras-chave porque o cabeçalho é grande)
function getExecutiva(obj) {
  // reutiliza a função genérica de busca
  return buscarPorPalavrasChave(obj, ["SECRETARIA EXECUTIVA", "SECRETARIA EXECUTIVA"]);
}

// Gestor(a) do contrato
function getGestor(obj) {
  return (
    obj["GESTOR"] ||
    obj["FISCAL"] || // se em algum caso vier no campo FISCAL
    ""
  ).trim();
}

// Início da vigência
function getInicioVigencia(obj) {
  return (
    obj["INÍCIO DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj["INICIO DA VIGÊNCIA DO INSTRUMENTO"] || // variação sem acento, se existir
    ""
  ).trim();
}

// Fim da vigência
function getFimVigencia(obj) {
  return (
    obj["FIM DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj["FIM DA VIGENCIA DO INSTRUMENTO"] ||
    ""
  ).trim();
}

// Valor total do contrato (vou considerar o valor anual como total)
function getValorTotal(obj) {
  return (
    obj["VALOR ANUAL (R$)"] ||
    obj["VALOR GLOBAL (R$)"] ||
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

// Status da vigência (AGORA só pega a coluna certa, não mais a de formalização)
function getStatusVigencia(obj) {
  return (obj["STATUS DA VIGÊNCIA"] || "").trim();
}

// Indica se é o contrato mais recente
function getMaisRecente(obj) {
  return (obj["É O MAIS RECENTE?"] || "").trim();
}



function App() {
  console.log("SESAU app carregado");

  const [contratos, setContratos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [totalContratos, setTotalContratos] = useState(0);

  // Carrega dados da planilha ao iniciar
  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        console.log("Iniciando fetch da planilha SESAU...");
        const resp = await fetch(SHEET_URL);
        if (!resp.ok) {
          throw new Error("Erro ao buscar dados da planilha");
        }

        const texto = await resp.text();
        const dados = parseCSV(texto);

        console.log("Contratos carregados:", dados.length);
        if (dados[0]) {
          console.log("Primeira linha de exemplo:", dados[0]);
        }

        setContratos(dados);
        setTotalContratos(dados.length);
      } catch (e) {
        console.error("Erro ao carregar planilha:", e);
        setErro(
          "Não foi possível carregar os contratos. Verifique a planilha ou tente novamente mais tarde."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  // Filtra contratos pela busca (credor ou número do contrato)
  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];

    return contratos.filter((c) => {
      const credor = getCredor(c).toLowerCase();
      const numeroContrato = getNumeroContrato(c).toLowerCase();
      return credor.includes(termo) || numeroContrato.includes(termo);
    });
  }, [busca, contratos]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.titulo}>SESAU – Consulta de Contratos Públicos</h1>
          <p style={styles.subtitulo}>
            Digite o número do contrato ou o nome da entidade/empresa para consultar
            informações oficiais de contratos da Secretaria de Saúde do Recife.
          </p>
        </header>

        <section style={styles.formSection}>
          <label htmlFor="busca" style={styles.label}>
            Número do contrato ou nome da empresa:
          </label>
          <div style={styles.formRow}>
            <input
              id="busca"
              type="text"
              placeholder="Ex: 2025-001 ou ADLIM"
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

          {carregando && <p style={styles.info}>Carregando contratos...</p>}
          {!carregando && !erro && (
            <p style={styles.info}>
              Contratos carregados da planilha: <strong>{totalContratos}</strong>
            </p>
          )}
          {erro && <p style={styles.erro}>{erro}</p>}
          {!carregando && !erro && busca && resultados.length === 0 && (
            <p style={styles.info}>Nenhum resultado encontrado para a busca informada.</p>
          )}
        </section>

        {/* Resultados */}
        {resultados.length > 0 && (
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
                      <h3 style={styles.cardTitle}>{credor || "Credor não informado"}</h3>
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

        <footer style={styles.footer}>
          <small>
            SESAU Recife – Consulta pública de contratos · Dados provenientes de planilha
            oficial da Secretaria de Saúde.
          </small>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fb",
    padding: "32px 16px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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


