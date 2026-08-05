import { useCouple } from '../context/CoupleContext'

export function usePhotostrips() {
  const ctx = useCouple()
  return {
    strips: ctx.strips,
    ready: ctx.stripsReady,
    busy: ctx.stripsBusy,
    error: ctx.stripsError,
    addFromFile: ctx.addStripFromFile,
    addFromDataUrl: ctx.addStripFromDataUrl,
    rename: ctx.renameStrip,
    remove: ctx.removeStrip,
    setError: ctx.clearStripsError,
  }
}
