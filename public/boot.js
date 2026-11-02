// runs before first paint: decide if the signature intro plays (once per session)
;(function () {
  var html = document.documentElement
  html.classList.add('js')
  try {
    var seen = sessionStorage.getItem('intro-seen')
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!seen && !calm) html.classList.add('intro-on')
  } catch (e) {}
})()
