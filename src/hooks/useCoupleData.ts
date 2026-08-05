import { useCouple } from '../context/CoupleContext'

export function useCoupleData() {
  const ctx = useCouple()
  return {
    notes: ctx.notes,
    addNote: ctx.addNote,
    removeNote: ctx.removeNote,
    bucket: ctx.bucket,
    addBucketItem: ctx.addBucketItem,
    toggleBucketItem: ctx.toggleBucketItem,
    removeBucketItem: ctx.removeBucketItem,
    ideas: ctx.ideas,
    addIdea: ctx.addIdea,
    removeIdea: ctx.removeIdea,
    events: ctx.events,
    addEvent: ctx.addEvent,
    removeEvent: ctx.removeEvent,
    nextEvent: ctx.nextEvent,
    moods: ctx.moods,
    todayMood: ctx.todayMood,
    setMood: ctx.setMood,
    answers: ctx.answers,
    saveAnswer: ctx.saveAnswer,
  }
}

export { daysUntil } from './useCoupleData.utils'
