// ===============================
// GENERAR INPUTS
// ===============================
document.addEventListener("DOMContentLoaded", function () {
    let grid = document.getElementById("inputs-grid")
    for (let i = 0; i < 16; i++) {
        let col = document.createElement("div")
        col.className = "col-6 col-md-3 mb-2"
        col.innerHTML = `<div class="input-wrapper">
            <span class="input-num">${i + 1}</span>
            <input id="t${i}" class="form-control" placeholder="Equipo ${i + 1}">
        </div>`
        grid.appendChild(col)
    }
})

// ===============================
// VARIABLES
// ===============================
let arbolIzq, arbolDer
let finalistas = [null, null]
let semifinalistas = [null, null] // perdedores de semis
let campeon = null
let segundo = null
let tercero = null

// ===============================
// ÁRBOL
// ===============================
function nodo(equipo, izq, der) {
    return { equipo, izq, der }
}

function crearArbol(equipos) {
    if (equipos.length === 1) return nodo(equipos[0], null, null)
    let mitad = equipos.length / 2
    return nodo(null, crearArbol(equipos.slice(0, mitad)), crearArbol(equipos.slice(mitad)))
}

// Devuelve el perdedor del nodo raíz del árbol (el que no avanzó a la final)
function getPerdedorSemi(arbol) {
    if (!arbol || !arbol.izq) return null
    let ganador = arbol.equipo
    if (!ganador) return null
    if (arbol.izq.equipo === ganador) return arbol.der.equipo
    return arbol.izq.equipo
}

function avanzar(n, ganador) {
    if (!n || !n.izq) return false
    if (n.izq.equipo === ganador || n.der.equipo === ganador) {
        n.equipo = ganador
        return true
    }
    return avanzar(n.izq, ganador) || avanzar(n.der, ganador)
}

// ===============================
// INICIAR TORNEO
// ===============================
function iniciar() {
    let equipos = []
    for (let i = 0; i < 16; i++) {
        let val = document.getElementById("t" + i).value
        if (val === "") return alert("Llena todos los equipos")
        equipos.push(val)
    }

    arbolIzq = crearArbol(equipos.slice(0, 8))
    arbolDer = crearArbol(equipos.slice(8))
    finalistas = [null, null]
    semifinalistas = [null, null]
    campeon = null
    segundo = null
    tercero = null

    document.getElementById("setup-form").classList.add("d-none")
    document.getElementById("tournament-bracket").classList.remove("d-none")
    document.getElementById("winner-announcement").innerHTML = ""

    dibujar()
}

// ===============================
// DIBUJAR
// ===============================
function dibujar() {
    let cont = document.getElementById("tournament-bracket")
    cont.innerHTML = ""

    cont.appendChild(lado(arbolIzq, true))
    cont.appendChild(zonacentral())
    cont.appendChild(lado(arbolDer, false))
}

function lado(arbol, esIzq) {
    let div = document.createElement("div")
    div.className = "side " + (esIzq ? "side-left" : "side-right")

    function getNiveles(n, nivel, niveles) {
        if (!n || !n.izq) return
        if (!niveles[nivel]) niveles[nivel] = []
        niveles[nivel].push(n)
        getNiveles(n.izq, nivel + 1, niveles)
        getNiveles(n.der, nivel + 1, niveles)
    }

    let niveles = []
    getNiveles(arbol, 0, niveles)
    niveles.reverse()

    let rondaNombres = ["OCTAVOS", "CUARTOS", "SEMIS"]

    niveles.forEach(function(partidos, idx) {
        let col = document.createElement("div")
        col.className = "column"

        let label = document.createElement("div")
        label.className = "round-label"
        label.textContent = rondaNombres[idx] || ""
        col.appendChild(label)

        partidos.forEach(function(n) {
            let match = document.createElement("div")
            match.className = "match"
            match.appendChild(equipoBtn(n.izq.equipo))
            match.appendChild(equipoBtn(n.der.equipo))
            col.appendChild(match)
        })

        div.appendChild(col)
    })

    return div
}

function equipoBtn(nombre) {
    let div = document.createElement("div")
    div.className = nombre ? "team" : "team empty"
    div.textContent = nombre || "???"

    if (nombre) {
        div.onclick = function () {
            avanzar(arbolIzq, nombre)
            avanzar(arbolDer, nombre)

            if (arbolIzq.equipo === nombre) {
                finalistas[0] = nombre
                semifinalistas[0] = getPerdedorSemi(arbolIzq)
            }
            if (arbolDer.equipo === nombre) {
                finalistas[1] = nombre
                semifinalistas[1] = getPerdedorSemi(arbolDer)
            }

            dibujar()
        }
    }

    return div
}

// ===============================
// ZONA CENTRAL
// ===============================
function zonacentral() {
    let div = document.createElement("div")
    div.className = "center-zone"

    // --- FINAL ---
    let labelFinal = document.createElement("div")
    labelFinal.className = "round-label center-label"
    labelFinal.textContent = "FINAL"

    let trophy = document.createElement("div")
    trophy.className = "trophy-icon"
    trophy.textContent = "🏆"

    let boxFinal = document.createElement("div")
    boxFinal.className = "final-box"
    boxFinal.appendChild(eqFinal(finalistas[0]))
    let vs = document.createElement("div")
    vs.className = "vs-label"
    vs.textContent = "VS"
    boxFinal.appendChild(vs)
    boxFinal.appendChild(eqFinal(finalistas[1]))

    div.appendChild(labelFinal)
    div.appendChild(trophy)
    div.appendChild(boxFinal)

    // --- TERCER LUGAR (solo si hay semifinalistas) ---
    if (semifinalistas[0] || semifinalistas[1]) {
        let sep = document.createElement("div")
        sep.className = "third-separator"

        let labelTercero = document.createElement("div")
        labelTercero.className = "round-label center-label"
        labelTercero.textContent = "3ER LUGAR"

        let boxTercero = document.createElement("div")
        boxTercero.className = "third-box"
        boxTercero.appendChild(eqTercero(semifinalistas[0]))
        let vs3 = document.createElement("div")
        vs3.className = "vs-label"
        vs3.textContent = "VS"
        boxTercero.appendChild(vs3)
        boxTercero.appendChild(eqTercero(semifinalistas[1]))

        div.appendChild(sep)
        div.appendChild(labelTercero)
        div.appendChild(boxTercero)
    }

    return div
}

// ===============================
// BOTONES FINALES
// ===============================
function eqFinal(nombre) {
    let div = document.createElement("div")
    div.className = nombre ? "team final-team" : "team final-team empty"
    div.textContent = nombre || "???"

    if (nombre && finalistas[0] && finalistas[1]) {
        div.onclick = function () {
            campeon = nombre
            segundo = (nombre === finalistas[0]) ? finalistas[1] : finalistas[0]
            mostrarAnuncio()
            dibujar()
        }
    }
    return div
}
function eqTercero(nombre) {
    let div = document.createElement("div")
    div.className = nombre ? "third-team" : "third-team empty"
    div.textContent = nombre || "???"

    if (nombre && semifinalistas[0] && semifinalistas[1]) {
        div.onclick = function () {
            tercero = nombre
            mostrarAnuncio()
            dibujar()
        }
    }

    return div
}

// ===============================
// ANUNCIO
// ===============================
function mostrarAnuncio() {
    let html = ""
    if (campeon)  html += `<div class="anuncio-campeon">🥇 ${campeon}</div>`
    if (segundo)  html += `<div class="anuncio-segundo">🥈 ${segundo}</div>`
    if (tercero)  html += `<div class="anuncio-tercero">🥉 ${tercero}</div>`
    document.getElementById("winner-announcement").innerHTML = html
}
