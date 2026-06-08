import { useEffect, useState } from 'react'

interface Err { id: number; message: string }

export default function ErrorOverlay() {
  const [errors, setErrors] = useState<Err[]>([])

  useEffect(() => {
    const onError = (ev: ErrorEvent) => {
      setErrors(e => [...e, { id: Date.now(), message: ev.message + ' — ' + (ev.filename || '') + ':' + (ev.lineno || '') }])
    }
    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = (ev.reason && (ev.reason.message || String(ev.reason))) || String(ev.reason)
      setErrors(e => [...e, { id: Date.now(), message: 'UnhandledRejection: ' + reason }])
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection as EventListener)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection as EventListener)
    }
  }, [])

  if (errors.length === 0) return null

  return (
    <div style={{ position: 'fixed', right: 12, top: 12, zIndex: 99999, maxWidth: 'min(420px, 90vw)' }}>
      {errors.map(err => (
        <div key={err.id} style={{ background: 'rgba(255,40,40,0.95)', color: 'white', padding: '10px 12px', borderRadius: 8, marginBottom: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.35)', fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Runtime Error</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{err.message}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button onClick={() => setErrors([])} style={{ background: 'white', color: '#b30000', padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  )
}
