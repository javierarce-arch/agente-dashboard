"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"

// ─────────────────────────────────────────────────────────────
//  Portafolio de Agentes IA · tablero vivo
//  - Editable sin tocar código (panel One Pager)
//  - Bitácora de notas con fecha por agente
//  - Mover entre estados, ajustar % de avance
//  - Persiste entre sesiones (localStorage)
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "portafolio:agentes:v2"

type EstadoKey = "desarrollo" | "produccion" | "backlog"
type PrioridadKey = "alta" | "media" | "baja"

type Nota = { id: string; fecha: string; texto: string }

type Agent = {
  id: string
  nombre: string
  creado: string
  estado: EstadoKey
  avance: number
  prioridad: PrioridadKey
  estadoActual: string
  queHace: string
  porQue: string
  metricas: string
  sponsor: string
  notas: Nota[]
}

// Capa de guardado: localStorage (v0 / Vercel).
const store = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v)
    } catch {}
  },
}

const ESTADOS: Record<EstadoKey, { label: string; color: string }> = {
  desarrollo: { label: "En desarrollo", color: "#6B5BD6" },
  produccion: { label: "En producción", color: "#1C7C54" },
  backlog: { label: "Backlog", color: "#6B7787" },
}

const PRIORIDADES: Record<PrioridadKey, { label: string; color: string }> = {
  alta: { label: "Alta", color: "#C0392B" },
  media: { label: "Media", color: "#C77D0A" },
  baja: { label: "Baja", color: "#6B7787" },
}

const uid = () => Math.random().toString(36).slice(2, 9)
const hoyISO = () => new Date().toISOString().slice(0, 10)

// Datos de arranque = lo que ven los visitantes hasta que publiques.
const SEED: Agent[] = [
  {
    id: "lnjzrvp",
    nombre: "Agente de FAQs",
    creado: "2026-06-24",
    estado: "desarrollo",
    avance: 70,
    prioridad: "media",
    estadoActual: "",
    queHace:
      "A partir de un listado de cursos (ID + URL), ingrese a cada ficha de curso, extraiga su información y genere automáticamente 8 preguntas frecuentes (FAQs) específicas de ese curso, las publique vía API (PUT) y deje registro auditable de cada FAQ publicada.\n",
    porQue:
      "LLMO (objetivo prioritario): posicionar el curso en respuestas de LLMs y buscadores conversacionales. Las preguntas deben emular cómo una persona real le consulta a un asistente IA y las respuestas deben ser citables, autocontenidas y factuales.\nValor para el potencial alumno: ayudar a entender el tema, por qué formarse en él y qué aporta a su desarrollo profesional, posicionando el curso como la respuesta natural.\n\nDecisión tomada: cuando haya tensión entre ambos objetivos, prevalece LLMO, sin sacrificar veracidad.\n",
    metricas:
      "LLMO\n\nAparición/citación del curso en respuestas de LLMs y buscadores con IA para queries objetivo.\nCobertura de intenciones (las 8 categorías) por curso.\n\nAlumno\n\nReducción de consultas repetidas a atención/ventas sobre temas cubiertos por las FAQs.\nTiempo en página / interacción con la sección de FAQs (si se mide).\n\nOperación / calidad\n\n% de cursos procesados sin error.\n% de FAQs marcadas needs_fix en revisión posterior (cuanto más bajo, mejor el agente).\n",
    sponsor: "Daniel Geisles/Juan Ortiz",
    notas: [
      {
        id: "cvr2368",
        fecha: "2026-06-24",
        texto:
          "24/06: Se finaliza la prueba piloto con fase 1. Hay que integrar con sofía y probar con endpoint /preview",
      },
    ],
  },
  {
    id: "79q09e7",
    nombre: "Agente Análisis de Mercado",
    creado: "2026-06-24",
    estado: "desarrollo",
    avance: 95,
    prioridad: "media",
    estadoActual: "",
    queHace:
      "Automatización del análisis técnico de propuestas formativas para eliminar el backlog, multiplicar la capacidad de procesamiento y operar 7×24. Recibe la ficha del producto y con eso arma el análisis de mercado.",
    porQue:
      "Mejora en la calidad del análisis y lo más importante, libera de hs dedicadas a armar análisis, feedback más rápido al docente en caso de que la propueta caiga en revisión y aprobación más rapida de la cursada, permitiendo manejar un caudal mayor y escalar la creación de nuevas propuestas formativas",
    metricas:
      "–83% en el ciclo completo de búsqueda, extracción, validación y armado. Libera horas-hombre para análisis estratégico.\n\nCiclo de aprobación/rechazo reducido a la mitad, permitiendo reaccionar más rápido a oportunidades del mercado.",
    sponsor: "Roberto Roberts",
    notas: [
      {
        id: "sbvaodd",
        fecha: "2026-06-24",
        texto:
          "Me reuní con Ximena García, recibí feedback y ya ajusté en base a ese feedback. Me falta configurar notificación por mail para que sepan cuando el análisis esté hecho. SE entrega a producción mañana 25/06",
      },
    ],
  },
  {
    id: "yi6w2wd",
    nombre: "Agente Reporte Diario",
    creado: "2026-06-24",
    estado: "produccion",
    avance: 100,
    prioridad: "media",
    estadoActual: "Esperando feedback del Sponsor.",
    queHace: "Genera reportes diarios de actividad de forma automática.",
    porQue: "",
    metricas: "",
    sponsor: "Nicolas Cacciavillani",
    notas: [
      {
        id: "kb6bs5a",
        fecha: "2026-06-24",
        texto: "Nico indica que otro tipo de reporte le aportaría más valor.",
      },
    ],
  },
  {
    id: "xnor3di",
    nombre: "Agente de Email Marketing",
    creado: "2026-06-24",
    estado: "backlog",
    avance: 0,
    prioridad: "media",
    estadoActual: "Fase 1 — relevando origen de los datos.",
    queHace:
      "Automatiza de punta a punta el flujo de datos de campañas. Extrae la data desde QuickSight y la carga en Marketing Cloud. Un agente toma esa misma data, arma y segmenta las audiencias y prepara las campañas de email.",
    porQue:
      "Hoy la extracción desde QuickSight y la carga en Marketing Cloud se hace 100% a mano. Los impagos son donde hay conversión para ganar de entrada. La Fase 2 se apoya sobre la Fase 1 sin rehacer nada: arrancamos simple y le sumamos inteligencia encima.",
    metricas:
      "Horas dedicadas a armar campañas (reducción), tasa de conversión (mejora) y cobertura de campañas (aumento).",
    sponsor: "Joana Scaminacci",
    notas: [
      {
        id: "8dync2j",
        fecha: "2026-06-24",
        texto:
          "Próximo paso: hablar con Carlos Maldonado y Maximiliano Aguero para conocer de dónde se extrae la data hacia QuickSight, y con eso empezar a diseñar la automatización de la Fase 1.",
      },
    ],
  },
  {
    id: "r7382t4",
    nombre: "Agente de Riesgo de Abandono",
    creado: "2026-06-24",
    estado: "backlog",
    avance: 0,
    prioridad: "media",
    estadoActual: "Esperando aprobación para iniciarlo",
    queHace:
      "Detecta alumnos en riesgo de deserción sintetizando señales de LMS, pagos y actividad; dispara intervenciones personalizadas automáticas.\n¿Qué hace? Sintetiza señales de login, progreso, pagos y foros; razona sobre patrones de deserción; notifica al tutor y dispara mensajes de retención personalizados. (Tal vez, a largo plazo, podemos integrarlo con el CRM como caso de Soporte)",
    porQue:
      "Lo justifica la evidencia empírica (Nature, 2025) de que intervenciones tempranas reducen churn hasta 30%",
    metricas: "Mide: tasa de abandono, tiempo-a-intervención, retención trimestral.",
    sponsor: "A definir",
    notas: [
      {
        id: "rjtjlc9",
        fecha: "2026-06-24",
        texto: "Propuesta iniciada por Javier Arce, a espera de aprobación",
      },
    ],
  },
  {
    id: "3hip5pw",
    nombre: "Agente de Brecha de Habilidades para Empresas",
    creado: "2026-06-24",
    estado: "backlog",
    avance: 0,
    prioridad: "media",
    estadoActual: "Esperando aprobación",
    queHace:
      "Analiza los perfiles de empleados de una empresa cliente y recomienda programas formativos alineados al gap detectado. \n¿Qué hace? Analiza descripción de puestos y perfiles de empleados provistos por la empresa (o los infiere en base a la información de la empresa); razona sobre gaps vs. oferta académica disponible; genera propuesta de capacitación personalizada. (Esto también podríamos aplicarlo con empresas que se están registrando en Talentia, en base a las ofertas que crean, la información de la empresa, etc.)",
    porQue:
      "Convierte el Portal Empresas en un consultor proactivo de L&D (Aprendizaje y Desarrollo). \n¿Por qué hacerlo? Portal Empresas carece de propuesta proactiva de valor; L&D corporativo es el segmento de mayor crecimiento en EdTech B2B 2025\n",
    metricas:
      "Métricas: Propuestas L&D generadas/mes; tasa de conversión B2B; ingresos incrementales por cuenta",
    sponsor: "A definir",
    notas: [
      {
        id: "ndmbh8s",
        fecha: "2026-06-24",
        texto: "Propuesta iniciado por Javier Arce, a espera de aprobación",
      },
    ],
  },
  {
    id: "n00oyrc",
    nombre: "Agente de SEO",
    creado: "2026-06-24",
    estado: "backlog",
    avance: 0,
    prioridad: "baja",
    estadoActual: "Incipiente, hablando con el Sponsor para tener más información",
    queHace: "",
    porQue:
      "Vamos a dar de baja la agencia de SEO\nel tema es que, no tenemos un rol interno\nquería ver la posibilidad de tener un agente para ciertas tareas\no avisos entiendo que se puede potenciar y relacionarlo con GEO también",
    metricas: "",
    sponsor: "Joana Scaminacci",
    notas: [
      {
        id: "vj02apm",
        fecha: "2026-06-24",
        texto: "Incipiente, hablando con el Sponsor para tener más información",
      },
    ],
  },
  {
    id: "zms28gs",
    nombre: "Agente de SDD",
    creado: "2026-06-24",
    estado: "backlog",
    avance: 0,
    prioridad: "baja",
    estadoActual: "",
    queHace:
      "Convierte un requerimiento de negocio en una especificación técnica implementable, leyendo los repositorios del Squad. Del requerimiento al backlog, con validación humana en cada etapa",
    porQue:
      "¿Por qué ahora?\nContexto perdido en cada paso\nEl requerimiento se reinterpreta al pasar de negocio a análisis, a arquitectura, a desarrollo. Cada handoff pierde precisión.\nTiempo experto en tareas repetitivas\nAnalistas y arquitectos invierten horas armando specs y cargando tareas a mano, en lugar de decidir.\nMadurez de la tecnología\nEl SDD asistido por IA (Kiro, spec-kit, Claude Code) ya es práctica probada. Estamos a tiempo de adoptarlo ordenadamente.\n",
    metricas: "A definir.",
    sponsor: "Nicolas Cacciavillani",
    notas: [
      {
        id: "oc9w7lw",
        fecha: "2026-06-24",
        texto:
          "Quedó despriorizado por Dani y Uli. Nico lo reflotó, pero Dani le pidió métricas de impacto en el negocio claras, pendientes de armar por parte de Nico",
      },
    ],
  },
  {
    id: "dp79rdh",
    nombre: "Agente de IA para Benchmarking Competitivo",
    creado: "2026-06-24",
    estado: "backlog",
    avance: 0,
    prioridad: "media",
    estadoActual: "",
    queHace:
      "Automatización del relevamiento y la comparación de la oferta de la competencia —precio, ejes temáticos, modalidad, duración y formato— que hoy se realiza de forma manual y esporádica, para sustentar decisiones de pricing, portfolio y posicionamiento con datos sistemáticos y actualizados\n",
    porQue:
      "¿Por qué ahora?\nDecisiones a ciegas\nSe define pricing y diseño de programas sin una referencia sistemática y actualizada del mercado..\nCosto del relevamiento manual\nEl equipo invierte tiempo experto recolectando datos de la competencia en lugar de analizarlos y priorizar\nInformación desactualizada\nCuando el comparativo está listo, el mercado ya se movió; las conclusiones llegan tarde.\nGaps no detectados\nEjes temáticos no cubiertos o ventanas de diferenciación son difíciles de ver a mano.",
    metricas:
      "–80%\nTIEMPO DE RELEVAMIENTO\nEl armado del comparativo pasa de días de trabajo manual a horas. Libera tiempo experto para análisis estratégico..\n10×\nCOMPETIDORES CUBIERTOS\nAmplía el universo relevado sin sumar headcount: más oferentes, más programas, más dimensiones.\nMensual\nFRECUENCIA DE ACTUALIZACIÓN\nDe un relevamiento esporádico a una actualización periódica que detecta movimientos del mercado a tiempo..",
    sponsor: "Ulises Martins / Roberto Roberts",
    notas: [
      {
        id: "j404g9p",
        fecha: "2026-06-24",
        texto:
          "Surgió como idea de Uli, a Cho le gustó la idea, aún pendiente de aprobación para iniciarlo",
      },
    ],
  },
  {
    id: "4fkry95",
    nombre: "Agente de IA para Optimización de Oferta Educativa",
    creado: "2026-06-24",
    estado: "backlog",
    avance: 0,
    prioridad: "baja",
    estadoActual: "",
    queHace:
      "Analiza la oferta interna completa, detecta los programas que hoy no se venden y propone ejes temáticos a ajustar para reposicionarlos y recuperar tracción.",
    porQue:
      "Oferta que no se vende\nProgramas activos sin matrícula consumen gestión y diluyen el catálogo. 300 cursadas menos en 2025 vs. el año anterior.\nEjes temáticos desactualizados\nLa demanda evolucionó, pero la oferta conserva títulos y enfoques que ya no traccionan en el mercado.\nDecisiones reactivas y muestrales\nLa revisión de oferta es manual, esporádica y parcial: se decide tarde y sobre datos incompletos.",
    metricas:
      "–80%\nCICLO DE DIAGNÓSTICO\nDe semanas a días para diagnosticar la salud de la oferta completa. Libera al equipo para análisis estratégico.\n↑ Ejes\nPROPUESTAS ACCIONABLE\nRecomendaciones concretas por programa: renombrar, fusionar, relanzar o retirar, con justificación de datos.\n↓ Solape\nMENOS CANIBALIZACIÓN\nIdentifica programas que compiten por la misma demanda y consolida la oferta para enfocar la inversión.",
    sponsor: "Roberto Roberts",
    notas: [
      {
        id: "xyc0hzo",
        fecha: "2026-06-24",
        texto:
          "Propuesta iniciada por Javier Arce, a la espera de aprobación. Hoy igual se cuenta con un data mesh. Tal vez puede linkearse con marketing para empujar conversión de estos cursos",
      },
    ],
  },
]

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');

    .pa-root *, .pa-root *::before, .pa-root *::after { box-sizing:border-box; }
    .pa-root {
      --paper:#F1F4F7; --surface:#FFFFFF; --ink:#0E1726; --ink-soft:#5B6B82;
      --line:#E3E8ED; --line-soft:#EDF1F4; --now:#9C5B1E; --now-bg:#FBF1E6;
      font-family:'Inter',system-ui,sans-serif; color:var(--ink); background:var(--paper);
      min-height:100vh; width:100%; -webkit-font-smoothing:antialiased;
    }
    .pa-wrap { max-width:1120px; margin:0 auto; padding:32px 24px 80px; }

    .pa-eyebrow { font-family:'Space Mono',monospace; font-size:11px; letter-spacing:.18em;
      text-transform:uppercase; color:var(--ink-soft); margin:0 0 10px; }
    .pa-title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:clamp(30px,5vw,46px);
      line-height:1.02; letter-spacing:-.02em; margin:0; }
    .pa-sub { color:var(--ink-soft); font-size:14px; margin:10px 0 0; }
    .pa-headrow { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; flex-wrap:wrap; }

    .pa-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin:30px 0 38px; }
    .pa-kpi { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:18px; }
    .pa-kpi .k-num { font-family:'Space Mono',monospace; font-weight:700; font-size:34px; line-height:1; letter-spacing:-.02em; }
    .pa-kpi .k-label { font-size:12px; color:var(--ink-soft); margin-top:10px; }

    .pa-sec { margin-bottom:34px; }
    .pa-sechead { display:flex; align-items:center; gap:12px; margin:0 0 16px; }
    .pa-dot { width:9px; height:9px; border-radius:50%; flex:none; }
    .pa-secname { font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:15px;
      letter-spacing:.04em; text-transform:uppercase; }
    .pa-count { font-family:'Space Mono',monospace; font-size:13px; color:var(--ink-soft); }
    .pa-secrule { flex:1; height:1px; background:var(--line); }

    .pa-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:14px; }
    .pa-card { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:18px;
      cursor:pointer; text-align:left; width:100%; font:inherit; color:inherit; position:relative;
      transition:border-color .15s, transform .15s, box-shadow .15s; }
    .pa-card:hover { border-color:#C7D0D9; transform:translateY(-2px); box-shadow:0 8px 24px -16px #0E172655; }
    .pa-card:focus-visible { outline:2px solid var(--ink); outline-offset:2px; }
    .pa-card .c-name { font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:16px;
      line-height:1.2; margin:0 0 6px; padding-right:14px; }
    .pa-card .c-desc { font-size:12.5px; color:var(--ink-soft); margin:0 0 16px; line-height:1.45; }
    .pa-card .pa-prio { display:inline-block; }
    .c-lastnote .c-notetext { display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
    .pa-card .c-foot { margin-top:14px; font-family:'Space Mono',monospace; font-size:10px;
      letter-spacing:.06em; text-transform:uppercase; color:var(--ink-soft); }

    .pa-prog { display:flex; align-items:center; gap:10px; }
    .pa-track { flex:1; display:flex; gap:2px; }
    .pa-seg { flex:1; height:7px; border-radius:2px; background:var(--line); }
    .pa-pct { font-family:'Space Mono',monospace; font-weight:700; font-size:14px; min-width:38px; text-align:right; }

    .pa-live { display:inline-flex; align-items:center; gap:7px; font-size:12.5px; color:#1C7C54; font-weight:500; }
    .pa-livedot { width:8px; height:8px; border-radius:50%; background:#1C7C54; position:relative; }
    .pa-livedot::after { content:""; position:absolute; inset:0; border-radius:50%; background:#1C7C54;
      animation:paPulse 2s ease-out infinite; }
    @keyframes paPulse { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.6);opacity:0} }

    .pa-now { margin-top:14px; padding:9px 11px; background:var(--now-bg); border-radius:9px;
      font-size:12.5px; color:var(--now); line-height:1.4; }
    .pa-now b { font-family:'Space Mono',monospace; font-size:9.5px; letter-spacing:.12em;
      display:block; margin-bottom:3px; font-weight:700; opacity:.8; }

    .pa-rows { display:flex; flex-direction:column; gap:8px; }
    .pa-row { background:var(--surface); border:1px solid var(--line); border-radius:11px;
      padding:13px 16px; cursor:pointer; display:flex; align-items:center; gap:14px;
      width:100%; font:inherit; color:inherit; text-align:left; transition:border-color .15s, background .15s; }
    .pa-row:hover { border-color:#C7D0D9; background:#FAFBFC; }
    .pa-row:focus-visible { outline:2px solid var(--ink); outline-offset:2px; }
    .pa-prio { font-family:'Space Mono',monospace; font-size:10.5px; font-weight:700; letter-spacing:.06em;
      text-transform:uppercase; padding:3px 8px; border-radius:5px; flex:none; }
    .pa-row .r-name { font-family:'Space Grotesk',sans-serif; font-weight:500; font-size:14.5px; flex:none; }
    .pa-row .r-desc { font-size:12px; color:var(--ink-soft); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

    .pa-empty { border:1px dashed var(--line); border-radius:12px; padding:22px; color:var(--ink-soft); font-size:13.5px; text-align:center; }

    .pa-btn { font:inherit; font-weight:500; font-size:13.5px; cursor:pointer; border-radius:9px;
      padding:9px 15px; border:1px solid var(--ink); background:var(--ink); color:#fff; transition:opacity .15s; }
    .pa-btn:hover { opacity:.86; }
    .pa-btn.ghost { background:transparent; color:var(--ink); border-color:var(--line); }
    .pa-btn.ghost:hover { border-color:var(--ink); opacity:1; }
    .pa-btn.danger { background:transparent; color:#C0392B; border-color:#E6C3BD; }
    .pa-btn.danger:hover { background:#FBEDEB; opacity:1; }
    .pa-btn.sm { padding:7px 12px; font-size:12.5px; }
    .pa-btn:focus-visible { outline:2px solid var(--ink); outline-offset:2px; }

    .pa-scrim { position:fixed; inset:0; background:#0E172680; z-index:40; animation:paFade .2s ease; }
    @keyframes paFade { from{opacity:0} to{opacity:1} }
    .pa-drawer { position:fixed; top:0; right:0; height:100%; width:min(540px,100%); z-index:50;
      background:var(--surface); box-shadow:-20px 0 60px -30px #0E1726; overflow-y:auto;
      animation:paSlide .25s cubic-bezier(.22,1,.36,1); }
    @keyframes paSlide { from{transform:translateX(40px);opacity:.4} to{transform:translateX(0);opacity:1} }
    .pa-dhead { position:sticky; top:0; background:var(--surface); border-bottom:1px solid var(--line);
      padding:20px 24px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px; z-index:2; }
    .pa-dbody { padding:8px 24px 28px; }
    .pa-x { border:none; background:var(--line-soft); width:32px; height:32px; border-radius:8px;
      cursor:pointer; font-size:18px; line-height:1; color:var(--ink); flex:none; }
    .pa-x:hover { background:var(--line); }

    .pa-fl { display:block; font-family:'Space Mono',monospace; font-size:10.5px; letter-spacing:.12em;
      text-transform:uppercase; color:var(--ink-soft); margin:18px 0 6px; }
    .pa-in, .pa-ta, .pa-sel { width:100%; font:inherit; font-size:14px; color:var(--ink); background:#FBFCFD;
      border:1px solid var(--line); border-radius:9px; padding:10px 12px; }
    .pa-in:focus, .pa-ta:focus, .pa-sel:focus { outline:none; border-color:var(--ink); background:#fff; }
    .pa-ta { resize:vertical; min-height:62px; line-height:1.5; }
    .pa-two { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .pa-range { width:100%; accent-color:var(--ink); }
    .pa-rangeval { font-family:'Space Mono',monospace; font-weight:700; font-size:18px; }
    .pa-dfoot { display:flex; gap:10px; margin-top:26px; padding-top:18px; border-top:1px solid var(--line); }

    .pa-statepick { display:flex; gap:8px; }
    .pa-stbtn { flex:1; font:inherit; font-size:13px; cursor:pointer; padding:9px; border-radius:8px;
      border:1px solid var(--line); background:#fff; color:var(--ink-soft); transition:all .12s; }
    .pa-stbtn[aria-pressed="true"] { color:#fff; font-weight:500; }

    /* bitácora */
    .pa-bcrow { display:flex; gap:8px; align-items:flex-start; }
    .pa-note { background:#FBFCFD; border:1px solid var(--line); border-radius:9px; padding:10px 12px; margin-top:8px; position:relative; }
    .pa-note .n-date { font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.06em; color:var(--ink-soft); }
    .pa-note .n-text { font-size:13.5px; line-height:1.45; margin-top:3px; white-space:pre-wrap; }
    .pa-note .n-del { position:absolute; top:8px; right:9px; border:none; background:none; cursor:pointer;
      color:var(--ink-soft); font-size:15px; line-height:1; padding:2px; }
    .pa-note .n-del:hover { color:#C0392B; }

    .pa-footer { color:var(--ink-soft); font-size:12px; margin-top:30px; display:flex;
      justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center; }

    @media (max-width:760px) { .pa-kpis{grid-template-columns:repeat(3,1fr);gap:8px} .pa-kpi .k-num{font-size:26px} .pa-two{grid-template-columns:1fr} }
    @media (prefers-reduced-motion:reduce) { .pa-card,.pa-row,.pa-btn{transition:none}
      .pa-livedot::after{animation:none} .pa-drawer,.pa-scrim{animation:none} }
  `}</style>
)

function Progress({ value, color }: { value: number; color: string }) {
  const segs = 10
  const filled = Math.round((value / 100) * segs)
  return (
    <div className="pa-prog">
      <div className="pa-track">
        {Array.from({ length: segs }).map((_, i) => (
          <span key={i} className="pa-seg" style={i < filled ? { background: color } : undefined} />
        ))}
      </div>
      <span className="pa-pct" style={{ color }}>
        {value}%
      </span>
    </div>
  )
}

function emptyAgent(): Agent {
  return {
    id: uid(),
    nombre: "",
    creado: hoyISO(),
    estado: "backlog",
    avance: 0,
    prioridad: "media",
    estadoActual: "",
    queHace: "",
    porQue: "",
    metricas: "",
    sponsor: "",
    notas: [],
  }
}

const fmtFecha = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })

function prioRank(p: PrioridadKey) {
  return { alta: 0, media: 1, baja: 2 }[p] ?? 1
}

function Section({
  name,
  color,
  count,
  children,
}: {
  name: string
  color: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section className="pa-sec">
      <div className="pa-sechead">
        <span className="pa-dot" style={{ background: color }} />
        <span className="pa-secname">{name}</span>
        <span className="pa-count">[{count}]</span>
        <span className="pa-secrule" />
      </div>
      {children}
    </section>
  )
}

function AgentCard({ a, onClick }: { a: Agent; onClick: () => void }) {
  const ultima = (a.notas || [])[0]
  const p = PRIORIDADES[a.prioridad] || PRIORIDADES.media
  return (
    <button className="pa-card" onClick={onClick}>
      <div className="c-name">{a.nombre}</div>
      {a.queHace && <div className="c-desc">{a.queHace}</div>}
      {a.estado === "desarrollo" && <Progress value={a.avance} color={ESTADOS.desarrollo.color} />}
      {a.estado === "produccion" && (
        <span className="pa-live">
          <span className="pa-livedot" /> en vivo
        </span>
      )}
      {a.estado === "backlog" && (
        <span className="pa-prio" style={{ color: p.color, background: p.color + "1A" }}>
          {p.label}
        </span>
      )}
      {ultima && (
        <div className="pa-now c-lastnote">
          <b>Última nota · {fmtFecha(ultima.fecha)}</b>
          <span className="c-notetext">{ultima.texto}</span>
        </div>
      )}
      <div className="c-foot">Creado {fmtFecha(a.creado)}</div>
    </button>
  )
}

export default function PortfolioBoard() {
  const [agents, setAgents] = useState<Agent[] | null>(null)
  const [draft, setDraft] = useState<Agent | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [nota, setNota] = useState("")
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const raw = store.get(STORAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as Agent[]) : SEED
      // Migración: agentes guardados antes de tener fecha de creación.
      setAgents(parsed.map((a) => ({ ...a, creado: a.creado || hoyISO() })))
    } catch {
      setAgents(SEED)
    }
  }, [])

  const persist = (next: Agent[]) => {
    setAgents(next)
    try {
      store.set(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }

  const kpis = useMemo(() => {
    const list = agents || []
    const prod = list.filter((a) => a.estado === "produccion")
    const dev = list.filter((a) => a.estado === "desarrollo")
    const back = list.filter((a) => a.estado === "backlog")
    return { activos: dev.length + prod.length, prod, dev, back }
  }, [agents])

  const openAgent = (a: Agent) => {
    setIsNew(false)
    setNota("")
    setDraft({ ...a, notas: a.notas || [] })
  }
  const newAgent = () => {
    setIsNew(true)
    setNota("")
    setDraft(emptyAgent())
  }
  const close = () => {
    setDraft(null)
    setIsNew(false)
    setNota("")
  }

  const save = () => {
    if (!draft) return
    const d: Agent = { ...draft, nombre: draft.nombre.trim() || "Agente sin nombre" }
    const exists = (agents || []).some((a) => a.id === d.id)
    const next = exists ? (agents || []).map((a) => (a.id === d.id ? d : a)) : [...(agents || []), d]
    persist(next)
    close()
  }

  const remove = () => {
    if (!draft) return
    persist((agents || []).filter((a) => a.id !== draft.id))
    close()
  }

  const exportar = async () => {
    const json = JSON.stringify(agents, null, 2)
    try {
      await navigator.clipboard.writeText(json)
    } catch {}
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "portafolio-agentes.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const addNota = () => {
    if (!nota.trim() || !draft) return
    const n: Nota = { id: uid(), fecha: hoyISO(), texto: nota.trim() }
    setDraft({ ...draft, notas: [n, ...(draft.notas || [])] })
    setNota("")
  }
  const delNota = (id: string) => {
    if (!draft) return
    setDraft({ ...draft, notas: draft.notas.filter((n) => n.id !== id) })
  }

  const isOpen = !!draft
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    drawerRef.current?.focus()
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen])

  if (agents === null) {
    return (
      <div className="pa-root">
        <Styles />
        <div className="pa-wrap" style={{ color: "#5B6B82" }}>
          Cargando portafolio…
        </div>
      </div>
    )
  }

  const semana = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long" })

  return (
    <div className="pa-root">
      <Styles />
      <div className="pa-wrap">
        <header className="pa-headrow">
          <div>
            <p className="pa-eyebrow">Transformación IA · redtecnológica</p>
            <h1 className="pa-title">Portafolio de Agentes</h1>
            <p className="pa-sub">Tablero vivo · actualizado al {semana}</p>
          </div>
          <button className="pa-btn" onClick={newAgent}>
            + Nuevo agente
          </button>
        </header>

        <section className="pa-kpis">
          <div className="pa-kpi">
            <div className="k-num">{kpis.activos}</div>
            <div className="k-label">Agentes activos</div>
          </div>
          <div className="pa-kpi">
            <div className="k-num">{kpis.prod.length}</div>
            <div className="k-label">En producción</div>
          </div>
          <div className="pa-kpi">
            <div className="k-num">{kpis.back.length}</div>
            <div className="k-label">En backlog</div>
          </div>
        </section>

        <Section name="En desarrollo" color={ESTADOS.desarrollo.color} count={kpis.dev.length}>
          {kpis.dev.length === 0 ? (
            <p className="pa-empty">Nada en desarrollo ahora mismo.</p>
          ) : (
            <div className="pa-grid">
              {kpis.dev.map((a) => (
                <AgentCard key={a.id} a={a} onClick={() => openAgent(a)} />
              ))}
            </div>
          )}
        </Section>

        <Section name="En producción" color={ESTADOS.produccion.color} count={kpis.prod.length}>
          {kpis.prod.length === 0 ? (
            <p className="pa-empty">
              Todavía no hay agentes en producción. Cuando uno se despliegue, movelo acá desde su panel.
            </p>
          ) : (
            <div className="pa-grid">
              {kpis.prod.map((a) => (
                <AgentCard key={a.id} a={a} onClick={() => openAgent(a)} />
              ))}
            </div>
          )}
        </Section>

        <Section name="Backlog priorizado" color={ESTADOS.backlog.color} count={kpis.back.length}>
          {kpis.back.length === 0 ? (
            <p className="pa-empty">Backlog vacío.</p>
          ) : (
            <div className="pa-grid">
              {[...kpis.back]
                .sort((a, b) => prioRank(a.prioridad) - prioRank(b.prioridad))
                .map((a) => (
                  <AgentCard key={a.id} a={a} onClick={() => openAgent(a)} />
                ))}
            </div>
          )}
        </Section>

        <footer className="pa-footer">
          <span>Tocá cualquier agente para ver, editar y dejar notas.</span>
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="pa-btn ghost" onClick={exportar}>
              Exportar datos
            </button>
          </span>
        </footer>
      </div>

      {draft && (
        <>
          <div className="pa-scrim" onClick={close} />
          <div className="pa-drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-label="Detalle del agente">
            <div className="pa-dhead">
              <div>
                <p className="pa-eyebrow" style={{ margin: 0 }}>
                  {isNew ? "Nuevo agente" : "One Pager"}
                </p>
                <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, margin: "6px 0 0", lineHeight: 1.1 }}>
                  {draft.nombre || "Sin nombre"}
                </h2>
              </div>
              <button className="pa-x" onClick={close} aria-label="Cerrar">
                ×
              </button>
            </div>

            <div className="pa-dbody">
              <label className="pa-fl">Nombre del agente</label>
              <input
                className="pa-in"
                value={draft.nombre}
                onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
                placeholder="Agente de…"
              />

              <label className="pa-fl">Estado</label>
              <div className="pa-statepick">
                {(Object.entries(ESTADOS) as [EstadoKey, { label: string; color: string }][]).map(([k, v]) => (
                  <button
                    key={k}
                    className="pa-stbtn"
                    aria-pressed={draft.estado === k}
                    style={draft.estado === k ? { background: v.color, borderColor: v.color } : undefined}
                    onClick={() => setDraft({ ...draft, estado: k })}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {draft.estado === "desarrollo" && (
                <>
                  <label className="pa-fl">
                    Avance — <span className="pa-rangeval">{draft.avance}%</span>
                  </label>
                  <input
                    className="pa-range"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={draft.avance}
                    onChange={(e) => setDraft({ ...draft, avance: Number(e.target.value) })}
                  />
                </>
              )}

              {draft.estado === "backlog" && (
                <>
                  <label className="pa-fl">Prioridad</label>
                  <select
                    className="pa-sel"
                    value={draft.prioridad || "media"}
                    onChange={(e) => setDraft({ ...draft, prioridad: e.target.value as PrioridadKey })}
                  >
                    {(Object.entries(PRIORIDADES) as [PrioridadKey, { label: string; color: string }][]).map(
                      ([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ),
                    )}
                  </select>
                </>
              )}

              <label className="pa-fl">Nota de estado (se ve en la card)</label>
              <input
                className="pa-in"
                value={draft.estadoActual}
                onChange={(e) => setDraft({ ...draft, estadoActual: e.target.value })}
                placeholder="ej. Esperando feedback del Sponsor"
              />

              <label className="pa-fl">Qué hace</label>
              <textarea
                className="pa-ta"
                value={draft.queHace}
                onChange={(e) => setDraft({ ...draft, queHace: e.target.value })}
                placeholder="En una o dos líneas, qué resuelve el agente"
              />

              <label className="pa-fl">Por qué hacerlo</label>
              <textarea
                className="pa-ta"
                value={draft.porQue}
                onChange={(e) => setDraft({ ...draft, porQue: e.target.value })}
                placeholder="El motivo de negocio: por qué vale la pena"
              />

              <label className="pa-fl">Métricas</label>
              <textarea
                className="pa-ta"
                value={draft.metricas}
                onChange={(e) => setDraft({ ...draft, metricas: e.target.value })}
                placeholder="Cómo se mide el éxito (hs ahorradas, % resolución, etc.)"
              />

              <label className="pa-fl">Sponsor</label>
              <input
                className="pa-in"
                value={draft.sponsor}
                onChange={(e) => setDraft({ ...draft, sponsor: e.target.value })}
                placeholder="Quién lo respalda en el negocio"
              />

              <label className="pa-fl">Bitácora</label>
              <div className="pa-bcrow">
                <textarea
                  className="pa-ta"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Qué pasó hoy con este agente…"
                  style={{ minHeight: 44 }}
                />
                <button className="pa-btn sm" onClick={addNota} style={{ flex: "none" }}>
                  Agregar
                </button>
              </div>
              {(draft.notas || []).map((n) => (
                <div key={n.id} className="pa-note">
                  <button className="n-del" onClick={() => delNota(n.id)} aria-label="Borrar nota">
                    ×
                  </button>
                  <div className="n-date">{fmtFecha(n.fecha)}</div>
                  <div className="n-text">{n.texto}</div>
                </div>
              ))}

              <div className="pa-dfoot">
                <button className="pa-btn" onClick={save} style={{ flex: 1 }}>
                  {isNew ? "Agregar agente" : "Guardar cambios"}
                </button>
                {!isNew && (
                  <button className="pa-btn danger" onClick={remove}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
