// ============================================================
// UALCHAMPS — UEFA Champions League & World Cup Soccer Edition
// Layout: [Cuartos A] → [Semi A] → [GRAN FINAL] ← [Semi B] ← [Cuartos B]
// Javascript Vainilla Puro (Sin frameworks)
// ============================================================

// ---- CONFIGURACIÓN DE EQUIPOS & IDENTIDAD ----
const COLORES = {
    "PRIMERO IIS":  { bg: "#3b82f6", abbr: "1° IIS" },
    "TERCERO IIS":  { bg: "#f59e0b", abbr: "3° IIS" },
    "SEPTIMO IIS":  { bg: "#ec4899", abbr: "7° IIS" },
    "SEPTIMO ISC":  { bg: "#8b5cf6", abbr: "7° ISC" },
    "PRIMERO ISC":  { bg: "#ef4444", abbr: "1° ISC" },
    "QUINTO IIS":   { bg: "#06b6d4", abbr: "5° IIS" },
    "TERCERO ISC":  { bg: "#f97316", abbr: "3° ISC" },
    "QUINTO ISC":   { bg: "#10b981", abbr: "5° ISC" },
}

// ---- ESTADO INICIAL ----
const estadoInicial = () => ({
    cuartos: [
        { id: 0, grupo: "A", hora: "09:00 AM", cancha: "Cancha 1", eq: ["PRIMERO IIS",  "TERCERO IIS"],  ganador: null, scores: [null, null], penales: [null, null] },
        { id: 1, grupo: "A", hora: "09:00 AM", cancha: "Cancha 2", eq: ["SEPTIMO IIS",  "SEPTIMO ISC"],  ganador: null, scores: [null, null], penales: [null, null] },
        { id: 2, grupo: "B", hora: "09:30 AM", cancha: "Cancha 1", eq: ["PRIMERO ISC",  "QUINTO IIS"],   ganador: null, scores: [null, null], penales: [null, null] },
        { id: 3, grupo: "B", hora: "09:30 AM", cancha: "Cancha 2", eq: ["TERCERO ISC",  "QUINTO ISC"],   ganador: null, scores: [null, null], penales: [null, null] },
    ],
    semis: [
        { id: 0, grupo: "A", hora: "10:00 AM", cancha: "Cancha Principal", cruces: [0, 1], ganador: null, scores: [null, null], penales: [null, null] },
        { id: 1, grupo: "B", hora: "10:00 AM", cancha: "Cancha 2",         cruces: [2, 3], ganador: null, scores: [null, null], penales: [null, null] },
    ],
    final:   { hora: "10:30 AM", cancha: "Estadio Central", ganador: null, subcampeon: null, scores: [null, null], penales: [null, null] },
    tercero: { hora: "10:15 AM", cancha: "Cancha 2",         ganador: null, scores: [null, null], penales: [null, null] },
})

// Cargar estado guardado o usar inicial
let estado = cargarEstado() || estadoInicial()
let sonidoActivo = localStorage.getItem("ualchamps_sound") !== "false"

// ============================================================
// AUDIO WEB API (Sintetizador nativo de silbato y fanfarria)
// ============================================================
let audioCtx = null

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        if (AudioContextClass) audioCtx = new AudioContextClass()
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume()
    }
    return audioCtx
}

// Silbato auténtico de árbitro de fútbol
function sonarSilbato() {
    if (!sonidoActivo) return
    try {
        const ctx = getAudioContext()
        if (!ctx) return

        const now = ctx.currentTime
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()

        osc1.type = "triangle"
        osc1.frequency.setValueAtTime(2450, now)
        osc1.frequency.exponentialRampToValueAtTime(2600, now + 0.1)

        osc2.type = "sine"
        osc2.frequency.setValueAtTime(2800, now)
        osc2.frequency.exponentialRampToValueAtTime(2950, now + 0.1)

        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.18, now + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)

        osc1.start(now)
        osc2.start(now)
        osc1.stop(now + 0.3)
        osc2.stop(now + 0.3)
    } catch (e) {
        console.warn("Audio error:", e)
    }
}

// Fanfarria triunfal de campeón
function sonarCampeonFanfarria() {
    if (!sonidoActivo) return
    try {
        const ctx = getAudioContext()
        if (!ctx) return

        const notas = [523.25, 659.25, 783.99, 1046.50] // Do, Mi, Sol, Do alto
        const now = ctx.currentTime

        notas.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = "sawtooth"
            osc.frequency.setValueAtTime(freq, now + idx * 0.14)

            gain.gain.setValueAtTime(0, now + idx * 0.14)
            gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.14 + 0.04)
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.7)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start(now + idx * 0.14)
            osc.stop(now + idx * 0.14 + 0.8)
        })
    } catch (e) {
        console.warn("Audio error:", e)
    }
}

// ============================================================
// CONFETI NATIVO DE CAMPEÓN (HTML5 CANVAS)
// ============================================================
let confettiParticles = []
let confettiAnimId = null

function lanzarConfeti() {
    const canvas = document.getElementById("confetti-canvas")
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colores = ["#fbbf24", "#fde047", "#22c55e", "#4ade80", "#00ff87", "#ffffff"]
    confettiParticles = []

    for (let i = 0; i < 150; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height * 0.5,
            size: Math.random() * 8 + 5,
            color: colores[Math.floor(Math.random() * colores.length)],
            speedY: Math.random() * 3.5 + 2.5,
            speedX: (Math.random() - 0.5) * 3,
            rot: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 6,
            shape: Math.random() > 0.4 ? "rect" : "circle"
        })
    }

    if (confettiAnimId) cancelAnimationFrame(confettiAnimId)

    let frameCount = 0
    function animar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        let vivas = 0

        confettiParticles.forEach(p => {
            p.y += p.speedY
            p.x += Math.sin(frameCount * 0.03) * 1.5 + p.speedX
            p.rot += p.rotSpeed

            if (p.y < canvas.height + 20) vivas++

            ctx.save()
            ctx.translate(p.x, p.y)
            ctx.rotate((p.rot * Math.PI) / 180)
            ctx.fillStyle = p.color

            if (p.shape === "rect") {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
            } else {
                ctx.beginPath()
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
                ctx.fill()
            }
            ctx.restore()
        })

        frameCount++
        if (vivas > 0 && frameCount < 350) {
            confettiAnimId = requestAnimationFrame(animar)
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
    }
    animar()
}

// Redimensionar canvas de confeti
window.addEventListener("resize", () => {
    const canvas = document.getElementById("confetti-canvas")
    if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }
})

// ============================================================
// PERSISTENCIA (LOCALSTORAGE)
// ============================================================
function guardarEstado() {
    try {
        localStorage.setItem("ualchamps_state_v2", JSON.stringify(estado))
    } catch (e) {
        console.warn("Storage error:", e)
    }
}

function cargarEstado() {
    try {
        const raw = localStorage.getItem("ualchamps_state_v2")
        return raw ? JSON.parse(raw) : null
    } catch (e) {
        return null
    }
}

// ============================================================
// RENDER PRINCIPAL
// ============================================================
function render() {
    // Guardar foco activo antes de reconstruir
    const focoAnterior = document.activeElement ? document.activeElement.dataset.inputId : null

    const bracket = document.getElementById("bracket")
    bracket.innerHTML = ""

    bracket.appendChild(columna("CUARTOS DE FINAL", renderCuartosGrupo("A"), "col--cuartos"))
    bracket.appendChild(columna("SEMIFINAL",        renderSemiGrupo("A"),    "col--semi"))
    bracket.appendChild(columnaFinal())
    bracket.appendChild(columna("SEMIFINAL",        renderSemiGrupo("B"),    "col--semi"))
    bracket.appendChild(columna("CUARTOS DE FINAL", renderCuartosGrupo("B"), "col--cuartos"))

    // Restaurar foco
    if (focoAnterior) {
        const el = document.querySelector(`[data-input-id="${focoAnterior}"]`)
        if (el) {
            el.focus()
            if (el.select) el.select()
        }
    }

    renderAnuncio()
    guardarEstado()
}

// ---- COLUMNA GENÉRICA ----
function columna(titulo, contenido, extraClass = "") {
    const col = document.createElement("div")
    col.className = `col ${extraClass}`.trim()

    const headerBox = document.createElement("div")
    headerBox.className = "col-header-box"

    const label = document.createElement("div")
    label.className = "col-titulo"
    label.textContent = titulo

    headerBox.appendChild(label)
    col.appendChild(headerBox)

    if (Array.isArray(contenido)) {
        contenido.forEach(n => col.appendChild(n))
    } else if (contenido) {
        col.appendChild(contenido)
    }

    return col
}

// ---- COLUMNA CENTRAL (FINAL + 3ER LUGAR) ----
function columnaFinal() {
    const col = document.createElement("div")
    col.className = "col col--center"

    const headerBox = document.createElement("div")
    headerBox.className = "col-header-box"

    // Escenario y animación del Trofeo UEFA / Mundial
    const trophyStage = document.createElement("div")
    trophyStage.className = "trophy-stage"

    const trophyAura = document.createElement("div")
    trophyAura.className = "trophy-aura"
    trophyStage.appendChild(trophyAura)

    const trophySvgWrap = document.createElement("div")
    trophySvgWrap.className = "trophy-svg-wrap"
    trophySvgWrap.innerHTML = `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Orejas del trofeo -->
            <path d="M12 18 C6 18 4 30 14 36 C18 38 20 34 20 30" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M52 18 C58 18 60 30 50 36 C46 38 44 34 44 30" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/>
            <!-- Copa principal -->
            <path d="M18 14 H46 V32 C46 42 38 48 32 48 C26 48 18 42 18 32 Z" fill="url(#cupGrad)" stroke="#fbbf24" stroke-width="2"/>
            <!-- Base / Pedestal -->
            <path d="M28 48 H36 V54 H28 Z" fill="#b45309" stroke="#fbbf24" stroke-width="1.5"/>
            <path d="M22 54 H42 V60 H22 Z" fill="#78350f" stroke="#fbbf24" stroke-width="2"/>
            <!-- Estrella central -->
            <polygon points="32,24 34,29 39,29 35,32 37,37 32,34 27,37 29,32 25,29 30,29" fill="#fef08a"/>
            <defs>
                <linearGradient id="cupGrad" x1="18" y1="14" x2="46" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#fde047"/>
                    <stop offset="0.6" stop-color="#f59e0b"/>
                    <stop offset="1" stop-color="#b45309"/>
                </linearGradient>
            </defs>
        </svg>
    `
    trophyStage.appendChild(trophySvgWrap)
    headerBox.appendChild(trophyStage)

    const label = document.createElement("div")
    label.className = "col-titulo col-titulo--gold"
    label.textContent = "GRAN FINAL"
    headerBox.appendChild(label)

    col.appendChild(headerBox)

    const eqA = estado.semis[0].ganador
    const eqB = estado.semis[1].ganador

    col.appendChild(renderPartido({
        id:      "final",
        eq:      [eqA, eqB],
        ganador: estado.final.ganador,
        scores:  estado.final.scores,
        penales: estado.final.penales,
        hora:    estado.final.hora,
        cancha:  estado.final.cancha,
        tipo:    "final",
        onScore: (sA, sB, pA, pB) => {
            const eraCampeonAntes = estado.final.ganador
            estado.final.scores  = [sA, sB]
            estado.final.penales = [pA, pB]
            const g = resolverGanador(eqA, eqB, sA, sB, pA, pB)
            estado.final.ganador    = g
            estado.final.subcampeon = g ? (g === eqA ? eqB : eqA) : null

            if (g && g !== eraCampeonAntes) {
                sonarSilbato()
                setTimeout(() => {
                    sonarCampeonFanfarria()
                    lanzarConfeti()
                }, 300)
            }
            render()
        },
    }))

    // Partido por el 3er Lugar
    const perdA = perdedorSemi(0)
    const perdB = perdedorSemi(1)
    if (perdA || perdB) {
        const sep = document.createElement("div")
        sep.className = "tercero-sep"
        col.appendChild(sep)

        const labelT = document.createElement("div")
        labelT.className = "col-titulo col-titulo--small"
        labelT.textContent = "🥉 PARTIDO 3ER LUGAR"
        col.appendChild(labelT)

        col.appendChild(renderPartido({
            id:      "tercero",
            eq:      [perdA, perdB],
            ganador: estado.tercero.ganador,
            scores:  estado.tercero.scores,
            penales: estado.tercero.penales,
            hora:    estado.tercero.hora,
            cancha:  estado.tercero.cancha,
            tipo:    "tercero",
            onScore: (sA, sB, pA, pB) => {
                estado.tercero.scores  = [sA, sB]
                estado.tercero.penales = [pA, pB]
                estado.tercero.ganador = resolverGanador(perdA, perdB, sA, sB, pA, pB)
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
                penales: partido.penales,
                hora:    partido.hora,
                cancha:  partido.cancha,
                tipo:    "cuartos",
                onScore: (sA, sB, pA, pB) => {
                    const gAnterior = partido.ganador
                    partido.scores  = [sA, sB]
                    partido.penales = [pA, pB]
                    partido.ganador = resolverGanador(partido.eq[0], partido.eq[1], sA, sB, pA, pB)

                    if (partido.ganador && partido.ganador !== gAnterior) {
                        sonarSilbato()
                    }

                    // Resetear fases posteriores dependientes
                    const semi = estado.semis.find(s => s.cruces.includes(partido.id))
                    if (semi) {
                        semi.ganador = null
                        semi.scores  = [null, null]
                        semi.penales = [null, null]
                    }
                    estado.final.ganador    = null
                    estado.final.subcampeon = null
                    estado.final.scores     = [null, null]
                    estado.final.penales    = [null, null]
                    estado.tercero.ganador  = null
                    estado.tercero.scores   = [null, null]
                    estado.tercero.penales  = [null, null]
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
        penales: semi.penales,
        hora:    semi.hora,
        cancha:  semi.cancha,
        tipo:    "semi",
        onScore: (sA, sB, pA, pB) => {
            const gAnterior = semi.ganador
            semi.scores  = [sA, sB]
            semi.penales = [pA, pB]
            semi.ganador = resolverGanador(eqA, eqB, sA, sB, pA, pB)

            if (semi.ganador && semi.ganador !== gAnterior) {
                sonarSilbato()
            }

            estado.final.ganador    = null
            estado.final.subcampeon = null
            estado.final.scores     = [null, null]
            estado.final.penales    = [null, null]
            estado.tercero.ganador  = null
            estado.tercero.scores   = [null, null]
            estado.tercero.penales  = [null, null]
            render()
        },
    })
}

// ============================================================
// RENDER GENÉRICO DE PARTIDO (TARJETA BROADCAST)
// ============================================================
function renderPartido({ id, eq, ganador, scores, penales = [null, null], hora, cancha, tipo, onScore }) {
    const [eqA, eqB] = eq
    const [sA,  sB]  = scores
    const [pA,  pB]  = penales

    const wrap = document.createElement("div")
    wrap.className = "partido-wrap"

    const card = document.createElement("div")
    card.className = "partido-card"
    if (tipo === "final")   card.classList.add("partido-card--final")
    if (tipo === "tercero") card.classList.add("partido-card--tercero")

    // Meta: Hora, Cancha y Badge de Estado
    const meta = document.createElement("div")
    meta.className = "partido-meta"

    const infoL = document.createElement("span")
    infoL.textContent = `${hora || ""} ${cancha ? "• " + cancha : ""}`.trim()
    meta.appendChild(infoL)

    const badgeStatus = document.createElement("span")
    badgeStatus.className = "partido-badge-status"

    const tieneAmbosEquipos = !!(eqA && eqB)
    const hayGanador = !!ganador
    const enJuego = tieneAmbosEquipos && !hayGanador && (sA !== null || sB !== null)

    if (hayGanador) {
        badgeStatus.textContent = "FINAL"
        badgeStatus.classList.add("partido-badge-status--done")
    } else if (enJuego) {
        badgeStatus.textContent = "EN VIVO"
        badgeStatus.classList.add("partido-badge-status--live")
    } else {
        badgeStatus.textContent = "POR JUGAR"
        badgeStatus.classList.add("partido-badge-status--pend")
    }
    meta.appendChild(badgeStatus)
    card.appendChild(meta)

    // Fila Equipo A
    card.appendChild(filaEquipo({
        inputId: id + "-A",
        nombre:  eqA,
        score:   sA,
        ganador,
        tipo,
        onChange: (val) => {
            const nuevaSB = scores[1]
            scores[0] = val
            onScore(scores[0], nuevaSB, penales[0], penales[1])
        },
    }))

    // Separador VS con marcador digital
    card.appendChild(separadorVS(sA, sB, pA, pB))

    // Fila Equipo B
    card.appendChild(filaEquipo({
        inputId: id + "-B",
        nombre:  eqB,
        score:   sB,
        ganador,
        tipo,
        onChange: (val) => {
            const nuevaSA = scores[0]
            scores[1] = val
            onScore(nuevaSA, scores[1], penales[0], penales[1])
        },
    }))

    // Tanda de Penales (solo si hay empate en tiempo regular con ambos scores)
    const esEmpate = (sA !== null && sB !== null && sA === sB && eqA && eqB)
    if (esEmpate) {
        const penalesBox = document.createElement("div")
        penalesBox.className = "penales-container"

        const penalesHeader = document.createElement("div")
        penalesHeader.className = "penales-header"
        penalesHeader.innerHTML = `<span>⚽ DESEMPATE POR PENALES</span>`
        penalesBox.appendChild(penalesHeader)

        const inputsRow = document.createElement("div")
        inputsRow.className = "penales-inputs"

        const labelA = document.createElement("span")
        labelA.className = "penal-team-label"
        labelA.textContent = (COLORES[eqA] ? COLORES[eqA].abbr : eqA)
        inputsRow.appendChild(labelA)

        // Input Penal A
        const inPA = document.createElement("input")
        inPA.type = "number"
        inPA.min = "0"
        inPA.max = "30"
        inPA.className = "penal-input"
        inPA.dataset.inputId = id + "-pA"
        if (pA !== null) inPA.value = pA
        inPA.placeholder = "P"
        inPA.addEventListener("input", () => {
            const raw = inPA.value.trim()
            const val = raw === "" ? null : parseInt(raw, 10)
            penales[0] = isNaN(val) ? null : val
            onScore(scores[0], scores[1], penales[0], penales[1])
        })
        inPA.addEventListener("focus", () => inPA.select())
        inputsRow.appendChild(inPA)

        const penalVs = document.createElement("span")
        penalVs.className = "penal-vs"
        penalVs.textContent = "—"
        inputsRow.appendChild(penalVs)

        // Input Penal B
        const inPB = document.createElement("input")
        inPB.type = "number"
        inPB.min = "0"
        inPB.max = "30"
        inPB.className = "penal-input"
        inPB.dataset.inputId = id + "-pB"
        if (pB !== null) inPB.value = pB
        inPB.placeholder = "P"
        inPB.addEventListener("input", () => {
            const raw = inPB.value.trim()
            const val = raw === "" ? null : parseInt(raw, 10)
            penales[1] = isNaN(val) ? null : val
            onScore(scores[0], scores[1], penales[0], penales[1])
        })
        inPB.addEventListener("focus", () => inPB.select())
        inputsRow.appendChild(inPB)

        const labelB = document.createElement("span")
        labelB.className = "penal-team-label penal-team-label--right"
        labelB.textContent = (COLORES[eqB] ? COLORES[eqB].abbr : eqB)
        inputsRow.appendChild(labelB)

        penalesBox.appendChild(inputsRow)
        card.appendChild(penalesBox)
    }

    wrap.appendChild(card)
    return wrap
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

    // Insignia/Escudo de equipo con siglas
    if (nombre) {
        const badge = document.createElement("div")
        badge.className = "equipo-badge"
        const infoEq = COLORES[nombre] || { bg: "#4b5563", abbr: "FC" }
        badge.style.backgroundColor = infoEq.bg
        badge.textContent = infoEq.abbr.split(" ")[0] || "⚽"
        badge.title = nombre
        fila.appendChild(badge)
    }

    // Nombre de equipo
    const nombreEl = document.createElement("span")
    nombreEl.className = "equipo-nombre"
    nombreEl.textContent = nombre || "Por Definir"

    if (esGanador) {
        const star = document.createElement("span")
        star.className = "winner-star"
        star.textContent = " ★"
        nombreEl.appendChild(star)
    }

    fila.appendChild(nombreEl)

    // Input de marcador digital (solo si el equipo está definido)
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

        input.addEventListener("focus", () => input.select())
        fila.appendChild(input)
    }

    return fila
}

// ---- SEPARADOR VS ----
function separadorVS(sA, sB, pA, pB) {
    const div = document.createElement("div")
    div.className = "vs-label"

    const ambosTienen = sA !== null && sB !== null
    if (ambosTienen) {
        let texto = `${sA} : ${sB}`
        if (sA === sB && pA !== null && pB !== null) {
            texto += ` (${pA}-${pB} pen)`
        }
        div.textContent = texto
        div.classList.add("vs-label--score")
    } else {
        div.textContent = "VS"
    }

    return div
}

// ---- DETERMINAR GANADOR ----
function resolverGanador(eqA, eqB, sA, sB, pA = null, pB = null) {
    if (!eqA || !eqB || sA === null || sB === null) return null
    if (sA > sB) return eqA
    if (sB > sA) return eqB

    // Caso de empate: se decide por penales
    if (sA === sB) {
        if (pA !== null && pB !== null && pA !== pB) {
            return pA > pB ? eqA : eqB
        }
    }
    return null
}

// ---- HELPERS ----
function perdedorSemi(idx) {
    const semi = estado.semis[idx]
    if (!semi.ganador) return null
    const a = estado.cuartos[semi.cruces[0]].ganador
    const b = estado.cuartos[semi.cruces[1]].ganador
    return semi.ganador === a ? b : a
}

// ============================================================
// CEREMONIA DE PREMIACIÓN & PODIO
// ============================================================
function renderAnuncio() {
    const el = document.getElementById("winner-announcement")
    if (!estado.final.ganador) {
        el.innerHTML = ""
        return
    }

    const campeon    = estado.final.ganador
    const subcampeon = estado.final.subcampeon
    const tercero    = estado.tercero.ganador

    el.innerHTML = `
        <div class="podium-card">
            <div class="podium-stars">★ ★ ★ ★ ★</div>
            <div class="podium-title">CAMPEÓN DE LA UALCHAMPS 2026</div>
            <div class="podium-champion-name">${campeon}</div>
            
            <div class="podium-grid">
                ${subcampeon ? `
                    <div class="podium-step podium-step--silver">
                        <div class="podium-medal">🥈</div>
                        <div class="podium-pos">SUBCAMPEÓN</div>
                        <div class="podium-team">${subcampeon}</div>
                    </div>
                ` : ""}

                <div class="podium-step podium-step--gold">
                    <div class="podium-medal">🏆</div>
                    <div class="podium-pos">CAMPEÓN SUPREMO</div>
                    <div class="podium-team">${campeon}</div>
                </div>

                ${tercero ? `
                    <div class="podium-step podium-step--bronze">
                        <div class="podium-medal">🥉</div>
                        <div class="podium-pos">3ER LUGAR</div>
                        <div class="podium-team">${tercero}</div>
                    </div>
                ` : ""}
            </div>
        </div>
    `
}

// ============================================================
// HERRAMIENTAS DEL TORNEO (SIMULAR, REINICIAR, SONIDO)
// ============================================================

// Generador de marcador de fútbol realista
function generarMarcadorAleatorio() {
    const r = Math.random()
    if (r < 0.35) return [2, 1]
    if (r < 0.60) return [1, 0]
    if (r < 0.80) return [3, 2]
    if (r < 0.92) return [3, 1]
    return [2, 2] // Empate para forzar penales emocionantes
}

function simularTorneo() {
    sonarSilbato()

    // 1. Simular Cuartos de Final
    estado.cuartos.forEach(partido => {
        let [sA, sB] = generarMarcadorAleatorio()
        if (Math.random() > 0.5) [sA, sB] = [sB, sA]
        partido.scores = [sA, sB]

        if (sA === sB) {
            const pA = Math.floor(Math.random() * 3) + 3
            const pB = pA + (Math.random() > 0.5 ? 1 : -1)
            partido.penales = [pA, pB]
        } else {
            partido.penales = [null, null]
        }
        partido.ganador = resolverGanador(partido.eq[0], partido.eq[1], partido.scores[0], partido.scores[1], partido.penales[0], partido.penales[1])
    })

    // 2. Simular Semis
    estado.semis.forEach(semi => {
        const eqA = estado.cuartos[semi.cruces[0]].ganador
        const eqB = estado.cuartos[semi.cruces[1]].ganador
        let [sA, sB] = generarMarcadorAleatorio()
        if (Math.random() > 0.5) [sA, sB] = [sB, sA]
        semi.scores = [sA, sB]

        if (sA === sB) {
            const pA = 4
            const pB = Math.random() > 0.5 ? 5 : 3
            semi.penales = [pA, pB]
        } else {
            semi.penales = [null, null]
        }
        semi.ganador = resolverGanador(eqA, eqB, semi.scores[0], semi.scores[1], semi.penales[0], semi.penales[1])
    })

    // 3. Simular 3er Lugar
    const perdA = perdedorSemi(0)
    const perdB = perdedorSemi(1)
    if (perdA && perdB) {
        let [sA, sB] = [3, 2]
        if (Math.random() > 0.5) [sA, sB] = [2, 3]
        estado.tercero.scores = [sA, sB]
        estado.tercero.penales = [null, null]
        estado.tercero.ganador = resolverGanador(perdA, perdB, sA, sB)
    }

    // 4. Simular Gran Final
    const finA = estado.semis[0].ganador
    const finB = estado.semis[1].ganador
    let [fA, fB] = [2, 1]
    if (Math.random() > 0.5) [fA, fB] = [1, 3]
    estado.final.scores = [fA, fB]
    estado.final.penales = [null, null]
    const campeon = resolverGanador(finA, finB, fA, fB)
    estado.final.ganador = campeon
    estado.final.subcampeon = campeon === finA ? finB : finA

    render()

    setTimeout(() => {
        sonarCampeonFanfarria()
        lanzarConfeti()
    }, 300)
}

let resetConfirmando = false
let resetTimer = null

function reiniciarTorneo() {
    const btnRes = document.getElementById("btn-reset")
    if (!resetConfirmando) {
        resetConfirmando = true
        if (btnRes) {
            btnRes.innerHTML = `<span class="btn-icon">⚠️</span><span class="btn-text">¿Confirmar?</span>`
            btnRes.classList.add("btn-action--confirming")
        }
        resetTimer = setTimeout(() => {
            resetConfirmando = false
            if (btnRes) {
                btnRes.innerHTML = `<span class="btn-icon">↺</span><span class="btn-text">Reiniciar</span>`
                btnRes.classList.remove("btn-action--confirming")
            }
        }, 3500)
        return
    }

    // Segunda pulsación confirmada
    clearTimeout(resetTimer)
    resetConfirmando = false
    if (btnRes) {
        btnRes.innerHTML = `<span class="btn-icon">↺</span><span class="btn-text">Reiniciar</span>`
        btnRes.classList.remove("btn-action--confirming")
    }

    estado = estadoInicial()
    guardarEstado()
    render()
    sonarSilbato()
}

function alternarSonido() {
    sonidoActivo = !sonidoActivo
    localStorage.setItem("ualchamps_sound", sonidoActivo ? "true" : "false")
    actualizarBotonSonido()
    if (sonidoActivo) sonarSilbato()
}

function actualizarBotonSonido() {
    const icon = document.getElementById("sound-icon")
    const text = document.getElementById("sound-text")
    if (icon && text) {
        icon.textContent = sonidoActivo ? "🔊" : "🔇"
        text.textContent = sonidoActivo ? "Sonido: ON" : "Sonido: OFF"
    }
}

// Configurar Event Listeners de la Barra de Herramientas
document.addEventListener("DOMContentLoaded", () => {
    const btnSim = document.getElementById("btn-simular")
    if (btnSim) btnSim.addEventListener("click", simularTorneo)

    const btnRes = document.getElementById("btn-reset")
    if (btnRes) btnRes.addEventListener("click", reiniciarTorneo)

    const btnSnd = document.getElementById("btn-sound")
    if (btnSnd) btnSnd.addEventListener("click", alternarSonido)

    actualizarBotonSonido()
})

// ---- ARRANQUE INICIAL ----
render()
actualizarBotonSonido()
