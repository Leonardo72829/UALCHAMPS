// ============================================================
// UALCHAMPS - Bracket fijo con marcadores
// Layout: [Cuartos A] → [Semi A] → [FINAL] ← [Semi B] ← [Cuartos B]
// ============================================================

// ---- COLOR POR EQUIPO ----
const COLORES = {
    "PRIMERO IIS":  "#3b82f6",   // azul
    "TERCERO IIS":  "#f59e0b",   // ámbar
    "SEPTIMO IIS":  "#ec4899",   // rosa
    "SEPTIMO ISC":  "#8b5cf6",   // violeta
    "PRIMERO ISC":  "#ef4444",   // rojo
    "QUINTO IIS":   "#06b6d4",   // cian
    "TERCERO ISC":  "#f97316",   // naranja
    "QUINTO ISC":   "#10b981",   // esmeralda
}

// ---- DATOS FIJOS ----
// scores: [scoreA, scoreB] — null mientras no se ingresa
const estado = {
    cuartos: [
        { id: 0, grupo: "A", hora: "09:00 AM", eq: ["PRIMERO IIS",  "TERCERO IIS"],  ganador: null, scores: [null, null] },
        { id: 1, grupo: "A", hora: "09:00 AM", eq: ["SEPTIMO IIS",  "SEPTIMO ISC"],  ganador: null, scores: [null, null] },
        { id: 2, grupo: "B", hora: "09:30 AM", eq: ["PRIMERO ISC",  "QUINTO IIS"],   ganador: null, scores: [null, null] },
        { id: 3, grupo: "B", hora: "09:30 AM", eq: ["TERCERO ISC",  "QUINTO ISC"],   ganador: null, scores: [null, null] },
    ],
    semis: [
        { id: 0, grupo: "A", hora: "10:00 AM", cruces: [0, 1], ganador: null, scores: [null, null] },
        { id: 1, grupo: "B", hora: "10:00 AM", cruces: [2, 3], ganador: null, scores: [null, null] },
    ],
    final:   { hora: "10:30 AM", ganador: null, subcampeon: null, scores: [null, null] },
    tercero: { ganador: null, scores: [null, null] },
}

// ---- RENDER PRINCIPAL ----
function render() {
    // Guardar foco activo antes de redibujar
    const focoAnterior = document.activeElement ? document.activeElement.dataset.inputId : null

    const bracket = document.getElementById("bracket")
    bracket.innerHTML = ""

    bracket.appendChild(columna("CUARTOS DE FINAL", renderCuartosGrupo("A")))
    bracket.appendChild(columna("SEMIFINAL",        renderSemiGrupo("A")))
    bracket.appendChild(columnaFinal())
    bracket.appendChild(columna("SEMIFINAL",        renderSemiGrupo("B")))
    bracket.appendChild(columna("CUARTOS DE FINAL", renderCuartosGrupo("B")))

    // Restaurar foco
    if (focoAnterior) {
        const el = document.querySelector(`[data-input-id="${focoAnterior}"]`)
        if (el) { el.focus(); el.select() }
    }

    renderAnuncio()
}

// ---- COLUMNA GENÉRICA ----
function columna(titulo, ...nodos) {
    const col = document.createElement("div")
    col.className = "col"
    const label = document.createElement("div")
    label.className = "col-titulo"
    label.textContent = titulo
    col.appendChild(label)
    nodos.forEach(n => col.appendChild(n))
    return col
}

// ---- COLUMNA CENTRAL (FINAL + 3ER) ----
function columnaFinal() {
    const col = document.createElement("div")
    col.className = "col col--center"

    const trophy = document.createElement("div")
    trophy.className = "trophy-icon"
    trophy.textContent = "🏆"
    col.appendChild(trophy)

    const label = document.createElement("div")
    label.className = "col-titulo"
    label.textContent = "FINAL"
    col.appendChild(label)

    const eqA = estado.semis[0].ganador
    const eqB = estado.semis[1].ganador
    col.appendChild(renderPartido({
        id:      "final",
        eq:      [eqA, eqB],
        ganador: estado.final.ganador,
        scores:  estado.final.scores,
        hora:    estado.final.hora,
        tipo:    "final",
        onScore: (sA, sB) => {
            estado.final.scores = [sA, sB]
            const g = resolverGanador(eqA, eqB, sA, sB)
            estado.final.ganador    = g
            estado.final.subcampeon = g ? (g === eqA ? eqB : eqA) : null
            render()
        },
    }))

    // 3er lugar
    const perdA = perdedorSemi(0)
    const perdB = perdedorSemi(1)
    if (perdA || perdB) {
        const sep = document.createElement("div")
        sep.className = "tercero-sep"
        col.appendChild(sep)

        const labelT = document.createElement("div")
        labelT.className = "col-titulo col-titulo--small"
        labelT.textContent = "3ER LUGAR"
        col.appendChild(labelT)

        col.appendChild(renderPartido({
            id:      "tercero",
            eq:      [perdA, perdB],
            ganador: estado.tercero.ganador,
            scores:  estado.tercero.scores,
            tipo:    "tercero",
            onScore: (sA, sB) => {
                estado.tercero.scores = [sA, sB]
                estado.tercero.ganador = resolverGanador(perdA, perdB, sA, sB)
                render()
            },
        }))
    }

    return col
}

// ---- CUARTOS DE UN GRUPO ----
function renderCuartosGrupo(grupo) {
    const wrap = document.createElement("div")

    const gLabel = document.createElement("div")
    gLabel.className = "grupo-label"
    gLabel.textContent = "GRUPO " + grupo
    wrap.appendChild(gLabel)

    estado.cuartos
        .filter(p => p.grupo === grupo)
        .forEach(partido => {
            wrap.appendChild(renderPartido({
                id:      "cuarto-" + partido.id,
                eq:      partido.eq,
                ganador: partido.ganador,
                scores:  partido.scores,
                hora:    partido.hora,
                tipo:    "cuartos",
                onScore: (sA, sB) => {
                    partido.scores = [sA, sB]
                    partido.ganador = resolverGanador(partido.eq[0], partido.eq[1], sA, sB)
                    // Resetear semi y todo lo posterior
                    const semi = estado.semis.find(s => s.cruces.includes(partido.id))
                    if (semi) { semi.ganador = null; semi.scores = [null, null] }
                    estado.final.ganador    = null
                    estado.final.subcampeon = null
                    estado.final.scores     = [null, null]
                    estado.tercero.ganador  = null
                    estado.tercero.scores   = [null, null]
                    render()
                },
            }))
        })

    return wrap
}

// ---- SEMI DE UN GRUPO ----
function renderSemiGrupo(grupo) {
    const semi  = estado.semis.find(s => s.grupo === grupo)
    const eqA   = estado.cuartos[semi.cruces[0]].ganador
    const eqB   = estado.cuartos[semi.cruces[1]].ganador

    return renderPartido({
        id:      "semi-" + semi.id,
        eq:      [eqA, eqB],
        ganador: semi.ganador,
        scores:  semi.scores,
        hora:    semi.hora,
        tipo:    "semi",
        onScore: (sA, sB) => {
            semi.scores = [sA, sB]
            semi.ganador = resolverGanador(eqA, eqB, sA, sB)
            estado.final.ganador    = null
            estado.final.subcampeon = null
            estado.final.scores     = [null, null]
            estado.tercero.ganador  = null
            estado.tercero.scores   = [null, null]
            render()
        },
    })
}

// ============================================================
// RENDER GENÉRICO DE PARTIDO
// Cada fila: [nombre equipo] ··· [input score]
// ============================================================
function renderPartido({ id, eq, ganador, scores, hora, tipo, onScore }) {
    const [eqA, eqB]   = eq
    const [sA,  sB]    = scores

    const wrap = document.createElement("div")
    wrap.className = "partido-wrap"

    if (hora) {
        const h = document.createElement("div")
        h.className = "partido-hora"
        h.textContent = hora
        wrap.appendChild(h)
    }

    const card = document.createElement("div")
    card.className = "partido-card"
    if (tipo === "final")   card.classList.add("partido-card--final")
    if (tipo === "tercero") card.classList.add("partido-card--tercero")

    // Fila equipo A
    card.appendChild(filaEquipo({
        inputId: id + "-A",
        nombre:  eqA,
        score:   sA,
        ganador,
        tipo,
        onChange: (val) => {
            const nuevaSB = scores[1]
            if (val !== null && nuevaSB !== null) onScore(val, nuevaSB)
            else {
                // Score incompleto: limpiar ganador sin re-render total
                scores[0] = val
                actualizarGanador(id, eq, scores, onScore)
            }
        },
    }))

    // Separador VS con scores
    card.appendChild(separadorVS(sA, sB))

    // Fila equipo B
    card.appendChild(filaEquipo({
        inputId: id + "-B",
        nombre:  eqB,
        score:   sB,
        ganador,
        tipo,
        onChange: (val) => {
            const nuevaSA = scores[0]
            if (nuevaSA !== null && val !== null) onScore(nuevaSA, val)
            else {
                scores[1] = val
                actualizarGanador(id, eq, scores, onScore)
            }
        },
    }))

    wrap.appendChild(card)
    return wrap
}

// Actualiza ganador parcialmente sin propagar si algún score falta
function actualizarGanador(id, eq, scores, onScore) {
    const [sA, sB] = scores
    if (sA !== null && sB !== null) {
        onScore(sA, sB)
    }
    // si falta alguno, solo guardamos el valor — no resolvemos
}

// ---- FILA DE EQUIPO ----
function filaEquipo({ inputId, nombre, score, ganador, tipo, onChange }) {
    const fila = document.createElement("div")
    fila.className = "equipo-fila"
    if (tipo === "final")   fila.classList.add("equipo-fila--final")
    if (tipo === "tercero") fila.classList.add("equipo-fila--tercero")

    const esVacio    = !nombre
    const esGanador  = nombre && ganador === nombre
    const esPerdedor = nombre && ganador && ganador !== nombre

    if (esGanador)  fila.classList.add("equipo-fila--ganador")
    if (esPerdedor) fila.classList.add("equipo-fila--perdedor")
    if (esVacio)    fila.classList.add("equipo-fila--vacio")

    // Círculo de color del equipo
    if (nombre) {
        const dot = document.createElement("span")
        dot.className = "equipo-dot"
        dot.style.background = COLORES[nombre] || "#555"
        fila.appendChild(dot)
    }

    // Nombre
    const nombreEl = document.createElement("span")
    nombreEl.className = "equipo-nombre"
    nombreEl.textContent = nombre || "???"
    fila.appendChild(nombreEl)

    // Input de score (solo si el equipo existe)
    if (nombre) {
        const input = document.createElement("input")
        input.type            = "number"
        input.min             = "0"
        input.max             = "99"
        input.className       = "score-input"
        input.dataset.inputId = inputId
        if (score !== null) input.value = score
        input.placeholder = "—"
        if (esPerdedor) input.classList.add("score-input--perdedor")
        if (esGanador)  input.classList.add("score-input--ganador")

        input.addEventListener("input", () => {
            const raw = input.value.trim()
            const val = raw === "" ? null : parseInt(raw, 10)
            onChange(isNaN(val) ? null : val)
        })

        // Seleccionar todo al enfocar
        input.addEventListener("focus", () => input.select())

        fila.appendChild(input)
    }

    return fila
}

// ---- SEPARADOR VS ----
function separadorVS(sA, sB) {
    const div = document.createElement("div")
    div.className = "vs-label"

    const ambosTienen = sA !== null && sB !== null
    if (ambosTienen) {
        div.textContent = `${sA} — ${sB}`
        div.classList.add("vs-label--score")
    } else {
        div.textContent = "VS"
    }

    return div
}

// ---- DETERMINAR GANADOR ----
function resolverGanador(eqA, eqB, sA, sB) {
    if (!eqA || !eqB || sA === null || sB === null) return null
    if (sA === sB) return null      // empate — no hay ganador aún
    return sA > sB ? eqA : eqB
}

// ---- HELPERS ----
function perdedorSemi(idx) {
    const semi = estado.semis[idx]
    if (!semi.ganador) return null
    const a = estado.cuartos[semi.cruces[0]].ganador
    const b = estado.cuartos[semi.cruces[1]].ganador
    return semi.ganador === a ? b : a
}

// ---- ANUNCIO ----
function renderAnuncio() {
    const el = document.getElementById("winner-announcement")
    let html = ""
    if (estado.final.ganador)    html += `<div class="anuncio-campeon">🥇 ${estado.final.ganador}</div>`
    if (estado.final.subcampeon) html += `<div class="anuncio-segundo">🥈 ${estado.final.subcampeon}</div>`
    if (estado.tercero.ganador)  html += `<div class="anuncio-tercero">🥉 ${estado.tercero.ganador}</div>`
    el.innerHTML = html
}

// ---- ARRANQUE ----
render()
