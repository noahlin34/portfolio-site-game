import { DrivingScene } from './game/DrivingScene'
import { useDriveControls } from './hooks/useDriveControls'

function App() {
  const controlsRef = useDriveControls()

  return (
    <main className="app-shell">
      <DrivingScene controlsRef={controlsRef} />

      <section className="hud">
        <h1>R3F Driving Sandbox</h1>
        <p>W / A / S / D or arrow keys to drive. Hold space to brake.</p>
      </section>
    </main>
  )
}

export default App
