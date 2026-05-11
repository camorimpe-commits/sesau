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

/* ================== URLs DAS PLANILHAS ================== */

const SHEET_URL_CONTRATOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0KGsk9HAH2ZP9I612PopHCOityrQtkqNAzCTJQkT9B5FqTmbv3ecPODsZJjAN4svMUzi9ILXWc3Oq/pub?output=csv&gid=2116839656";

const SHEET_URL_PAGAMENTOS =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMAJWBTMJTCZ6isLPAVkN4AUp23myTBn6-FCv-h2Ntu2H1qSaxtKPiO4GIDDbWedCO5-V6XEIgzThJ/pub?output=csv";

const SHEET_URL_ORCAMENTO =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSqlXQBEGw9oZWtWSVeFbPQyI1mkb0pI30Ucv7Rp7d4P7IrSfvROXjWJJ9yRwmueme9tOl8g2T2bauM/pub?output=csv";

/* ================== FUNÇÕES AUXILIARES ================== */

function parseCSV(texto) {
  const resultado = Papa.parse(texto, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => (h ?? "").toString().trim(),
  });

  if (resultado.errors?.length) {
    console.warn("Erros ao fazer parse do CSV:", resultado.errors);
  }

  return Array.isArray(resultado.data) ? resultado.data : [];
}

function buscarPorPalavrasChave(obj, palavras) {
  const entradas = Object.entries(obj || {});
  const palavrasLower = (palavras || []).map((p) => p.toLowerCase());

  const encontrado = entradas.find(([nomeColuna]) => {
    const nomeLower = (nomeColuna || "").toLowerCase();
    return palavrasLower.some((p) => nomeLower.includes(p));
  });

  return encontrado ? String(encontrado[1] ?? "").trim() : "";
}

function parseDataBR(str) {
  if (!str) return null;
  const match = String(str).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);
  if (!dia || !mes || !ano) return null;
  return new Date(ano, mes - 1, dia);
}

function parseValorBR(valor) {
  if (valor === null || valor === undefined) return 0;
  const s = String(valor).trim();
  if (!s) return 0;

  // remove "R$", espaços, etc.
  const limpo = s.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

function formatBRL(num) {
  const n = Number(num) || 0;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/* ================== MAPEAMENTO – CONTRATOS ================== */

function getCredor(obj) {
  return (
    obj?.["ENTIDADE"] ||
    obj?.["CREDOR"] ||
    obj?.["EMPRESA CONTRATADA"] ||
    ""
  )
    .toString()
    .trim();
}

function getNumeroContrato(obj) {
  return (
    obj?.["Nº DO CONTRATO"] ||
    obj?.["NUMERO DO CONTRATO"] ||
    obj?.["N CONTRATO"] ||
    ""
  )
    .toString()
    .trim();
}

function getExecutiva(obj) {
  return buscarPorPalavrasChave(obj, [
    "SECRETARIA EXECUTIVA",
    "EXECUTIVA GERENCIADORA",
    "EXECUTIVA",
  ]);
}

function getGestor(obj) {
  return (obj?.["GESTOR"] || obj?.["FISCAL"] || "").toString().trim();
}

function getInicioVigencia(obj) {
  return (
    obj?.["INÍCIO DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj?.["INICIO DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj?.["INICIO VIGENCIA"] ||
    ""
  )
    .toString()
    .trim();
}

function getFimVigencia(obj) {
  return (
    obj?.["FIM DA VIGÊNCIA DO INSTRUMENTO"] ||
    obj?.["FIM DA VIGENCIA DO INSTRUMENTO"] ||
    obj?.["FIM VIGENCIA"] ||
    ""
  )
    .toString()
    .trim();
}

function getValorTotal(obj) {
  return (
    obj?.["VALOR ANUAL (R$)"] ||
    obj?.["VALOR GLOBAL (R$)"] ||
    obj?.["VALOR TOTAL (R$)"] ||
    ""
  )
    .toString()
    .trim();
}

function getValorMensal(obj) {
  return (
    obj?.["VALOR MENSAL (R$)"] ||
    obj?.["VALOR MENSAL ESTIMADO (R$)"] ||
    ""
  )
    .toString()
    .trim();
}

function getTermoAtual(obj) {
  return (obj?.["TERMO ATUAL"] || "").toString().trim();
}

function getDiasParaVencer(obj) {
  return (obj?.["DIAS"] || "").toString().trim();
}

function getStatusVigencia(obj) {
  return (obj?.["STATUS DA VIGÊNCIA"] || "").toString().trim();
}

function getMaisRecente(obj) {
  return (obj?.["É O MAIS RECENTE?"] || "").toString().trim();
}

/* ================== MAPEAMENTO – PAGAMENTOS ================== */

function getPagFonte(obj) {
  return (obj?.["Fonte"] || "").toString().trim();
}
function getPagCredor(obj) {
  return (obj?.["Credor"] || "").toString().trim();
}
function getPagValorPagamento(obj) {
  return (obj?.["PAGAMENTO"] || "").toString().trim();
}
function getPagDocumentoOB(obj) {
  return (obj?.["DocumentoOB"] || "").toString().trim();
}
function getPagNumeroDocFiscal(obj) {
  return (obj?.["Nº Doc Fiscal"] || obj?.["Nº Doc Fiscal "] || "")
    .toString()
    .trim();
}
function getPagDataPagamento(obj) {
  return (obj?.["Data Pagamento"] || "").toString().trim();
}

/* ================== MESES ================== */

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

const ANOS_PAGAMENTO = [2025, 2026];

/* ================== UI COMPONENTES (NO MESMO ARQUIVO) ================== */

function StatPill({ label, value, sub }) {
  return (
    <div style={styles.statPill}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
      {sub ? <div style={styles.statSub}>{sub}</div> : null}
    </div>
  );
}

function ExecucaoOrcamentaria({
  totalPago,
  orcamentoTotal,
  titulo = "Execução orçamentária 2026",
}) {
  const percentual = orcamentoTotal > 0 ? (totalPago / orcamentoTotal) * 100 : 0;
  const pctClamped = Math.min(Math.max(percentual, 0), 100);

  return (
    <div style={styles.execucaoContainer}>
      <div style={styles.execucaoHeader}>
        <span>{titulo}</span>
        <span style={{ fontWeight: 900 }}>{pctClamped.toFixed(1)}%</span>
      </div>

      <div style={styles.progressBarBackground}>
        <div style={{ ...styles.progressBarFill, width: `${pctClamped}%` }} />
      </div>

      <div style={styles.execucaoValores}>
        <span>Pago: R$ {formatBRL(totalPago)}</span>
        <span>Orçamento: R$ {formatBRL(orcamentoTotal)}</span>
      </div>
    </div>
  );
}

/* ================== APP ================== */

function App() {
  const [contratos, setContratos] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [orcamentoTotal, setOrcamentoTotal] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [erroContratos, setErroContratos] = useState("");
  const [erroPagamentos, setErroPagamentos] = useState("");
  const [erroOrcamento, setErroOrcamento] = useState("");

  const [busca, setBusca] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("contratos"); // "contratos" | "pagamentos"
  const [mesFiltro, setMesFiltro] = useState(null); // 1–12 ou null
  const [anoFiltro, setAnoFiltro] = useState(null); // 2025, 2026 ou null
  
  // Carregamento (refatorado e com erros separados)
  useEffect(() => {
    let ativo = true;

    async function carregarContratos() {
      const resp = await fetch(SHEET_URL_CONTRATOS);
      if (!resp.ok) throw new Error("Erro ao buscar dados da planilha de contratos");
      const texto = await resp.text();
      const dados = parseCSV(texto);
      if (!ativo) return;
      setContratos(dados);
    }

    async function carregarPagamentos() {
      const resp = await fetch(SHEET_URL_PAGAMENTOS);
      if (!resp.ok) throw new Error("Erro ao buscar dados da planilha de pagamentos");
      const texto = await resp.text();
      const dados = parseCSV(texto);
      if (!ativo) return;
      setPagamentos(dados);
    }

    async function carregarOrcamento() {
      const resp = await fetch(SHEET_URL_ORCAMENTO);
      if (!resp.ok) throw new Error("Erro ao buscar dados da planilha de orçamento");
      const texto = await resp.text();
      const dados = parseCSV(texto);

      // Soma todos os valores da coluna "Dot. Atual" (mesmo que o header venha com variações)
      const soma = dados.reduce((acc, row) => {
        const dotAtual = buscarPorPalavrasChave(row, ["dot", "atual"]);
        return acc + parseValorBR(dotAtual);
      }, 0);

      if (!ativo) return;
      setOrcamentoTotal(soma);
    }

    async function carregarTudo() {
      try {
        setCarregando(true);
        setErroContratos("");
        setErroPagamentos("");
        setErroOrcamento("");

        // Contratos é “crítico” para a página (se falhar, exibimos erro principal)
        await carregarContratos();

        // Pagamentos e orçamento podem falhar sem derrubar tudo
        try {
          await carregarPagamentos();
        } catch (e) {
          console.error(e);
          if (ativo) {
            setErroPagamentos(
              "Não foi possível carregar os pagamentos. Verifique a planilha 'nova_base'."
            );
            setPagamentos([]);
          }
        }

        try {
          await carregarOrcamento();
        } catch (e) {
          console.error(e);
          if (ativo) {
            setErroOrcamento(
              "Não foi possível carregar o orçamento. Verifique a planilha do orçamento."
            );
            setOrcamentoTotal(0);
          }
        }
      } catch (e) {
        console.error(e);
        if (ativo) {
          setErroContratos(
            "Não foi possível carregar os contratos. Verifique a planilha ou tente novamente mais tarde."
          );
          setContratos([]);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarTudo();

    return () => {
      ativo = false;
    };
  }, []);

  const usandoContratos = tipoConsulta === "contratos";
  const erroPrincipal = usandoContratos ? erroContratos : erroPagamentos;

  /* ================== BUSCAS/FILTROS ================== */

  const resultadosContratos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return contratos.filter((c) => {
      const credor = getCredor(c).toLowerCase();
      const numero = getNumeroContrato(c).toLowerCase();
      return credor.includes(termo) || numero.includes(termo);
    });
  }, [busca, contratos]);

  const resultadosPagamentos = useMemo(() => {
    let lista = [...pagamentos].sort((a, b) => {
      const da = parseDataBR(getPagDataPagamento(a));
      const db = parseDataBR(getPagDataPagamento(b));
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db - da;
    });

    const termo = busca.trim().toLowerCase();
    if (termo) {
      lista = lista.filter((p) => {
        const credor = getPagCredor(p).toLowerCase();
        const ob = getPagDocumentoOB(p).toLowerCase();
        const nf = getPagNumeroDocFiscal(p).toLowerCase();
        return credor.includes(termo) || ob.includes(termo) || nf.includes(termo);
      });
    }

    if (mesFiltro) {
      lista = lista.filter((p) => {
        const data = parseDataBR(getPagDataPagamento(p));
        return data && data.getMonth() + 1 === mesFiltro;
      });
    }

    if (anoFiltro) {
      lista = lista.filter((p) => {
        const data = parseDataBR(getPagDataPagamento(p));
        return data && data.getFullYear() === anoFiltro;
      });
    }

return lista;
}, [pagamentos, busca, mesFiltro, anoFiltro]);

  const resultados = usandoContratos ? resultadosContratos : resultadosPagamentos;

  

  /* ================== KPIs – CONTRATOS ================== */

  const valorGlobalContratos = useMemo(() => {
    return contratos.reduce((acc, c) => {
      const valor = parseValorBR(getValorTotal(c));
      return acc + valor;
    }, 0);
  }, [contratos]);
  
  const valorMensalContratos = useMemo(() => {
    return contratos.reduce((acc, c) => {
      const valor = parseValorBR(getValorMensal(c));
      return acc + valor;
    }, 0);
  }, [contratos]);
  
  const contratosVencendo60Dias = useMemo(() => {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(hoje.getDate() + 60);
  
    return contratos.filter((c) => {
      const fim = parseDataBR(getFimVigencia(c));
      return fim && fim >= hoje && fim <= limite;
    }).length;
  }, [contratos]);

  
  const totalValorPagamentos = useMemo(() => {
    return resultadosPagamentos.reduce((acc, p) => {
      return acc + parseValorBR(getPagValorPagamento(p));
    }, 0);
  }, [resultadosPagamentos]);

  const percentualExecutado = useMemo(() => {
    if (!orcamentoTotal) return 0;
    return (totalValorPagamentos / orcamentoTotal) * 100;
  }, [totalValorPagamentos, orcamentoTotal]);

  const totalPorMes = useMemo(() => {
    const mapa = {};
    resultadosPagamentos.forEach((p) => {
      const data = parseDataBR(getPagDataPagamento(p));
      if (!data) return;
      const mes = data.getMonth() + 1;
      const valor = parseValorBR(getPagValorPagamento(p));
      mapa[mes] = (mapa[mes] || 0) + valor;
    });

    return MESES.map((m) => ({
      mes: m.label,
      valor: mapa[m.num] || 0,
    }));
  }, [resultadosPagamentos]);

  const totalContratos = contratos.length;
  const totalPagamentos = pagamentos.length;

  /* ================== RENDER ================== */

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.titulo}>SEAF – Conecta</h1>
          <p style={styles.subtitulo}>
            Consulta e análise dos contratos e pagamentos da SEAF/SESAU.
          </p>
        </header>

        {/* Tabs */}
        <div style={styles.tabsRow}>
          <button
            type="button"
            onClick={() => {
              setTipoConsulta("contratos");
              setMesFiltro(null);
              setAnoFiltro(null);
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
            onClick={() => setTipoConsulta("pagamentos")}
            style={{
              ...styles.tabButton,
              ...(!usandoContratos ? styles.tabButtonActive : {}),
            }}
          >
            Pagamentos
          </button>
        </div>

        {/* Form / Filtros */}
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
              onClick={() => setBusca((b) => b.trim())}
            >
              Buscar
            </button>
          </div>

          {/* Filtros por mês e ano (Pagamentos) */}
          {!usandoContratos && (
            <div style={styles.paymentFiltersRow}>
              <div>
                <span style={styles.monthFilterLabel}>
                  Filtrar por mês de pagamento:
                </span>
          
                <div style={styles.monthButtonsContainer}>
                  {MESES.map((m) => (
                    <button
                      key={m.num}
                      type="button"
                      onClick={() =>
                        setMesFiltro((prev) => (prev === m.num ? null : m.num))
                      }
                      style={{
                        ...styles.monthButton,
                        ...(mesFiltro === m.num ? styles.monthButtonActive : {}),
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
          
              <div style={styles.yearFilterBox}>
                <span style={styles.monthFilterLabel}>
                  Filtrar por ano:
                </span>
          
                <div style={styles.monthButtonsContainer}>
                  {ANOS_PAGAMENTO.map((ano) => (
                    <button
                      key={ano}
                      type="button"
                      onClick={() =>
                        setAnoFiltro((prev) => (prev === ano ? null : ano))
                      }
                      style={{
                        ...styles.monthButton,
                        ...(anoFiltro === ano ? styles.monthButtonActive : {}),
                      }}
                    >
                      {ano}
                    </button>
                  ))}
          
                  <button
                    type="button"
                    onClick={() => {
                      setMesFiltro(null);
                      setAnoFiltro(null);
                    }}
                    style={styles.monthClearButton}
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          {carregando && (
            <p style={styles.info}>
              Carregando {usandoContratos ? "contratos" : "pagamentos"}...
            </p>
          )}

          {!carregando && erroContratos && (
            <p style={styles.erro}>{erroContratos}</p>
          )}

          {!carregando && !erroContratos && (
            <>
              {/* KPIs rápidos (topo, “30 segundos”) */}
              <div style={styles.kpiRow}>
                {usandoContratos ? (
                  <>
                    <StatPill
                      label="Contratos vigentes"
                      value={String(totalContratos)}
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
                      value={String(contratosVencendo60Dias)}
                    />
                  </>
                ) : (
                  <>
                    <StatPill
                      label="Pagamentos carregados"
                      value={String(totalPagamentos)}
                    />
              
                    <StatPill
                      label="Total pago (filtro atual)"
                      value={`R$ ${formatBRL(totalValorPagamentos)}`}
                      sub="Respeita busca, mês e ano"
                    />
              
                    <StatPill
                      label="Execução"
                      value={
                        orcamentoTotal > 0
                          ? `${percentualExecutado.toFixed(1)}%`
                          : "—"
                      }
                      sub={erroOrcamento ? "Orçamento indisponível" : "Pago/Orçamento"}
                    />
                  </>
                )}
              </div>

              {/* Execução Orçamentária (barra) apenas na aba Pagamentos */}
              {!usandoContratos && orcamentoTotal > 0 && (
                <ExecucaoOrcamentaria
                  totalPago={totalValorPagamentos}
                  orcamentoTotal={orcamentoTotal}
                />
              )}

              {!usandoContratos && erroOrcamento && (
                <p style={{ ...styles.info, marginTop: 10 }}>
                  {erroOrcamento}
                </p>
              )}

              {!usandoContratos && erroPagamentos && (
                <p style={styles.erro}>{erroPagamentos}</p>
              )}
            </>
          )}

          {!carregando && !erroPrincipal && busca && resultados.length === 0 && (
            <p style={styles.info}>Nenhum resultado encontrado para a busca informada.</p>
          )}
        </section>

        {/* RESULTADOS – CONTRATOS */}
        {usandoContratos && resultados.length > 0 && (
          <section style={styles.resultSection}>
            <h2 style={styles.resultTitle}>
              Resultados ({resultados.length} contrato{resultados.length > 1 ? "s" : ""})
            </h2>

            <div style={styles.cardGrid}>
              {resultados.map((c, idx) => (
                <article key={idx} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{getCredor(c) || "Credor não informado"}</h3>
                    <p style={styles.cardSubtitle}>
                      Contrato: <strong>{getNumeroContrato(c) || "—"}</strong>
                    </p>
                  </div>

                  <dl style={styles.dl}>
                    <div style={styles.dlRow}>
                      <dt>Executiva</dt>
                      <dd>{getExecutiva(c) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Gestor(a)</dt>
                      <dd>{getGestor(c) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Início</dt>
                      <dd>{getInicioVigencia(c) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Fim</dt>
                      <dd>{getFimVigencia(c) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Valor total</dt>
                      <dd>{getValorTotal(c) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Valor mensal</dt>
                      <dd>{getValorMensal(c) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Termo atual</dt>
                      <dd>{getTermoAtual(c) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Dias p/ vencer</dt>
                      <dd>{getDiasParaVencer(c) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Status</dt>
                      <dd>{getStatusVigencia(c) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Mais recente?</dt>
                      <dd>{getMaisRecente(c) || "—"}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* RESULTADOS – PAGAMENTOS */}
        {!usandoContratos && resultados.length > 0 && (
          <section style={styles.resultSection}>
            <div style={{ marginBottom: 18 }}>
              <h2 style={styles.resultTitle}>Evolução mensal dos pagamentos</h2>

              <div style={styles.chartCard}>
                <ResponsiveContainer>
                  <LineChart data={totalPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 12, fill: theme.muted }}
                    />
                    <YAxis
                      width={44}
                      tick={{ fontSize: 11, fill: theme.muted }}
                      tickFormatter={(value) => {
                        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} mi`;
                        if (value >= 1_000) return `${(value / 1_000).toFixed(0)} mil`;
                        return `${value}`;
                      }}
                    />
                    <Tooltip
                      formatter={(value) =>
                        `R$ ${Number(value).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke={theme.primary}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <h2 style={styles.resultTitle}>
              Resultados ({resultados.length} pagamento{resultados.length > 1 ? "s" : ""})
            </h2>

            <div style={styles.cardGrid}>
              {resultados.map((p, idx) => (
                <article key={idx} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{getPagCredor(p) || "Credor não informado"}</h3>
                    <p style={styles.cardSubtitle}>
                      Documento OB: <strong>{getPagDocumentoOB(p) || "—"}</strong>
                    </p>
                  </div>

                  <dl style={styles.dl}>
                    <div style={styles.dlRow}>
                      <dt>Fonte</dt>
                      <dd>{getPagFonte(p) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Valor</dt>
                      <dd>{getPagValorPagamento(p) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Nº Doc Fiscal</dt>
                      <dd>{getPagNumeroDocFiscal(p) || "—"}</dd>
                    </div>
                    <div style={styles.dlRow}>
                      <dt>Data</dt>
                      <dd>{getPagDataPagamento(p) || "—"}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer style={styles.footer}>
          <small>
            SESAU Recife – Consulta de contratos e pagamentos · Dados provenientes de planilhas oficiais.
          </small>
        </footer>
      </div>
    </div>
  );
}

/* ================== STYLES (PROD) ================== */

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

  header: { marginBottom: 18 },

  titulo: {
    fontSize: "2rem",
    marginBottom: 6,
    color: theme.text,
    letterSpacing: "-0.02em",
  },

  subtitulo: {
    color: theme.text2,
    fontSize: "0.95rem",
    maxWidth: 760,
    lineHeight: 1.4,
  },

  tabsRow: {
    display: "inline-flex",
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    padding: 4,
    marginBottom: 16,
    border: `1px solid ${theme.border}`,
    gap: 6,
  },

  tabButton: {
    border: "none",
    background: "transparent",
    padding: "8px 16px",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: "0.9rem",
    color: theme.text2,
    fontWeight: 700,
  },

  tabButtonActive: {
    backgroundColor: theme.primary,
    color: "#ffffff",
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.28)",
  },

  formSection: { marginBottom: 18 },

  label: {
    display: "block",
    fontWeight: 800,
    marginBottom: 8,
    color: theme.text,
  },

  formRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  input: {
    flex: 1,
    padding: "12px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    fontSize: "0.95rem",
    outline: "none",
    backgroundColor: "#fff",
    color: theme.text,
  },

  button: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    backgroundColor: theme.primary,
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 18px rgba(37, 99, 235, 0.20)",
  },

  monthFilterRow: { marginTop: 8, marginBottom: 10 },

  paymentFiltersRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 10,
  },
  
  yearFilterBox: {
    marginLeft: "auto",
  },

  monthFilterLabel: {
    fontSize: "0.85rem",
    color: theme.text2,
    display: "block",
    marginBottom: 6,
    fontWeight: 800,
  },

  monthButtonsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  monthButton: {
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    backgroundColor: "#ffffff",
    padding: "6px 12px",
    fontSize: "0.82rem",
    cursor: "pointer",
    color: theme.text2,
    fontWeight: 800,
  },

  monthButtonActive: {
    backgroundColor: theme.primarySoft,
    color: theme.primaryHover,
    borderColor: "rgba(37, 99, 235, 0.45)",
  },

  monthClearButton: {
    borderRadius: 999,
    border: "none",
    backgroundColor: "#F1F5F9",
    padding: "6px 12px",
    fontSize: "0.82rem",
    cursor: "pointer",
    color: theme.text,
    fontWeight: 900,
  },

  info: { fontSize: "0.9rem", color: theme.text2, marginTop: 6 },

  erro: {
    fontSize: "0.9rem",
    color: theme.danger,
    marginTop: 8,
    backgroundColor: theme.dangerSoft,
    border: "1px solid #FECACA",
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 800,
  },

  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
    marginTop: 12,
  },

  statPill: {
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    backgroundColor: "#fff",
    padding: "12px 12px",
    boxShadow: theme.shadowSoft,
  },
  statLabel: { fontSize: 12, color: theme.muted, fontWeight: 900 },
  statValue: { fontSize: 18, color: theme.text, fontWeight: 1000, marginTop: 2 },
  statSub: { fontSize: 12, color: theme.text2, marginTop: 2 },

  resultSection: { marginTop: 18 },

  resultTitle: {
    fontSize: "1.2rem",
    marginBottom: 12,
    color: theme.text,
    letterSpacing: "-0.01em",
    fontWeight: 950,
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 14,
  },

  card: {
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    padding: "16px 16px 12px",
    backgroundColor: theme.surface,
    boxShadow: theme.shadowSoft,
  },

  cardHeader: { marginBottom: 10 },

  cardTitle: {
    fontSize: "1.05rem",
    marginBottom: 4,
    color: theme.text,
    fontWeight: 950,
  },

  cardSubtitle: { fontSize: "0.9rem", color: theme.muted },

  dl: { margin: 0, fontSize: "0.85rem" },

  dlRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "6px 0",
    borderBottom: `1px dashed ${theme.borderSoft}`,
    color: theme.text2,
  },

  chartCard: {
    width: "100%",
    height: 260,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    border: `1px solid ${theme.border}`,
    boxShadow: theme.shadowSoft,
  },

  execucaoContainer: {
    marginTop: 14,
    padding: "14px 16px",
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    backgroundColor: "#fff",
    boxShadow: theme.shadowSoft,
  },

  execucaoHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: "0.9rem",
    color: theme.text,
    fontWeight: 900,
  },

  progressBarBackground: {
    width: "100%",
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: theme.primary,
    transition: "width 0.6s ease",
  },

  execucaoValores: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.78rem",
    marginTop: 8,
    color: theme.text2,
    fontWeight: 800,
  },

  footer: {
    marginTop: 24,
    borderTop: `1px solid ${theme.borderSoft}`,
    paddingTop: 12,
    textAlign: "right",
    fontSize: "0.75rem",
    color: "#94A3B8",
  },
};

export default App;
