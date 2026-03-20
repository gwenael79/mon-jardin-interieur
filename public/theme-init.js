// /public/theme-init.js
// ─────────────────────────────────────────────────────────────────────────────
//  Script d'initialisation du thème — s'exécute AVANT React
//
//  Ajouter dans index.html, dans <head> AVANT le bundle Vite :
//    <script src="/theme-init.js"></script>
//
//  S'exécutant de façon synchrone, il applique les CSS vars depuis
//  localStorage AVANT le premier rendu React → zéro flash visible.
// ─────────────────────────────────────────────────────────────────────────────
;(function () {
  try {
    var raw = localStorage.getItem('mji_theme_vars')
    if (!raw) return
    var data = JSON.parse(raw)
    var vars = data && data.vars
    if (!vars) return

    var VARS = [
      '--bg','--bg2','--bg3',
      '--text','--text2','--text3','--cream',
      '--green','--green2','--green3','--greenT',
      '--gold','--gold-warm',
      '--border','--border2',
      '--red','--red2','--redT',
      '--zone-roots','--zone-stem','--zone-leaves','--zone-flowers','--zone-breath',
    ]

    var root = document.documentElement
    for (var i = 0; i < VARS.length; i++) {
      if (vars[VARS[i]]) root.style.setProperty(VARS[i], vars[VARS[i]])
    }

    // Dériver --green2/3/T si --green est un hex et absent du cache
    var g = vars['--green']
    if (g && g.charAt(0) === '#' && g.length === 7) {
      var r  = parseInt(g.slice(1, 3), 16)
      var gr = parseInt(g.slice(3, 5), 16)
      var b  = parseInt(g.slice(5, 7), 16)
      var rgb = r + ',' + gr + ',' + b
      if (!vars['--green2']) root.style.setProperty('--green2', 'rgba(' + rgb + ',0.22)')
      if (!vars['--green3']) root.style.setProperty('--green3', 'rgba(' + rgb + ',0.11)')
      if (!vars['--greenT']) root.style.setProperty('--greenT', 'rgba(' + rgb + ',0.48)')
    }
  } catch (e) {}
})()
