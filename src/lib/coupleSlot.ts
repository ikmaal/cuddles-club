import type { Carer, CoupleProfile, MoodEntry, MoodKey } from '../types'

export type MemberSlot = 'a' | 'b'

export function carerToSlot(carer: Carer, mySlot: MemberSlot): MemberSlot {
  if (carer === 'you') return mySlot
  return mySlot === 'a' ? 'b' : 'a'
}

export function slotToCarer(slot: MemberSlot, mySlot: MemberSlot): Carer {
  return slot === mySlot ? 'you' : 'partner'
}

export function profileFromCouple(
  memberAName: string,
  memberBName: string,
  since: string | null,
  mySlot: MemberSlot,
): CoupleProfile {
  if (mySlot === 'a') {
    return {
      nameYou: memberAName,
      namePartner: memberBName,
      since: since ?? '',
    }
  }
  return {
    nameYou: memberBName,
    namePartner: memberAName,
    since: since ?? '',
  }
}

export function profileToCoupleNames(
  profile: CoupleProfile,
  mySlot: MemberSlot,
): { member_a_name: string; member_b_name: string; since: string | null } {
  if (mySlot === 'a') {
    return {
      member_a_name: profile.nameYou,
      member_b_name: profile.namePartner,
      since: profile.since || null,
    }
  }
  return {
    member_a_name: profile.namePartner,
    member_b_name: profile.nameYou,
    since: profile.since || null,
  }
}

export function moodRowToEntry(
  day: string,
  moodA: MoodKey | null,
  moodB: MoodKey | null,
  mySlot: MemberSlot,
): MoodEntry {
  const myMood = mySlot === 'a' ? moodA : moodB
  const partnerMood = mySlot === 'a' ? moodB : moodA
  return {
    day,
    ...(myMood ? { you: myMood } : {}),
    ...(partnerMood ? { partner: partnerMood } : {}),
  }
}

export function moodEntryToRow(entry: MoodEntry, mySlot: MemberSlot) {
  return {
    day: entry.day,
    mood_a: (mySlot === 'a' ? entry.you : entry.partner) ?? null,
    mood_b: (mySlot === 'b' ? entry.you : entry.partner) ?? null,
  }
}
