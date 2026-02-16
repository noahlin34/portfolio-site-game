import { DrivingScene } from './game/DrivingScene'
import { useDriveControls } from './hooks/useDriveControls'

function App() {
  const controlsRef = useDriveControls()

  return (
    <main className="app-shell">
      <DrivingScene controlsRef={controlsRef} />

      <section className="hud">
        <h1>Stylized Isometric Driving</h1>
        <p>W / A / S / D or arrows to drive, hold space to brake.</p>
      </section>
    </main>
  )
}

export default App
