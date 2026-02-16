import { useEffect, useState } from 'react'
import { EditorApp } from './editor/EditorApp'
import { DrivingScene } from './game/DrivingScene'
import { type LevelData } from './game/level/schema'
import { loadLevel, saveLevel } from './game/level/levelStore'
import { useDriveControls } from './hooks/useDriveControls'

function App() {
  const controlsRef = useDriveControls()
  const [level, setLevel] = useState<LevelData | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadLevel().then((loaded) => {
      if (!cancelled) {
        setLevel(loaded)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!level) {
    return (
      <main className="loading-shell">
        <p>Loading level...</p>
      </main>
    )
  }

  const isEditorRoute = window.location.pathname.startsWith('/editor')

  if (isEditorRoute) {
    return (
      <EditorApp
        initialLevel={level}
        onSaveLevel={async (nextLevel) => {
          const response = await saveLevel(nextLevel)
          setLevel({
            ...nextLevel,
            meta: { ...nextLevel.meta, updatedAt: response.updatedAt },
          })
          return response
        }}
        onReloadLevel={async () => {
          const nextLevel = await loadLevel()
          setLevel(nextLevel)
          return nextLevel
        }}
      />
    )
  }

  return (
    <main className="app-shell">
      <DrivingScene controlsRef={controlsRef} level={level} />

      <section className="hud">
        <h1>Stylized Isometric Driving</h1>
        <p>W / A / S / D or arrows to drive, hold space to brake.</p>
        <p className="hud-meta">{level.meta.name}</p>
        <div className="hud-links">
          <a href="/">Play</a>
          <a href="/editor">Open Editor</a>
        </div>
      </section>
    </main>
  )
}

export default App
