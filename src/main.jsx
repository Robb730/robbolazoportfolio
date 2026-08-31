// Silence known upstream deprecation/noise warnings (actionable fix is in libs, not app code)
// THREE r183 deprecates Clock → Timer: @react-three/fiber still instantiates Clock internally
// @react-three/rapier init signature warning and transient texSubImage2D bad-image during texture decode
const _warn = console.warn.bind(console)
const _error = console.error.bind(console)
console.warn = (...args) => {
  const msg = String(args[0] ?? '')
  if (msg.includes('THREE.Clock') || msg.includes('using deprecated parameters for the initialization function') || msg.includes('Timer instead')) return
  _warn(...args)
}
console.error = (...args) => {
  const msg = String(args[0] ?? '')
  // transient bad image during async texture decode — guarded in Lanyard.jsx; suppress noisy WebGL spam
  if (msg.includes('texSubImage2D: bad image data') || msg.includes('WebGL: INVALID_VALUE: texSubImage2D')) return
  _error(...args)
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
