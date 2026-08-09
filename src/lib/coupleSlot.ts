import {
  detailsFromJson,
  normalizePerson,
  personDetailsOnly,
  type PersonDetailsPayload,
} from './personProfile'
import type { Carer, CoupleProfile, MoodEntry, MoodKey, PersonProfile } from '../types'

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
  memberA?: Partial<PersonProfile> | null,
  memberB?: Partial<PersonProfile> | null,
): CoupleProfile {
  const personA = normalizePerson(memberA)
  const personB = normalizePerson(memberB)
  if (mySlot === 'a') {
    return {
      nameYou: memberAName,
      namePartner: memberBName,
      since: since ?? '',
      you: personA,
      partner: personB,
    }
  }
  return {
    nameYou: memberBName,
    namePartner: memberAName,
    since: since ?? '',
    you: personB,
    partner: personA,
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

export function profileToCoupleDetails(
  profile: CoupleProfile,
  mySlot: MemberSlot,
): { member_a_details: PersonDetailsPayload; member_b_details: PersonDetailsPayload } {
  if (mySlot === 'a') {
    return {
      member_a_details: personDetailsOnly(profile.you),
      member_b_details: personDetailsOnly(profile.partner),
    }
  }
  return {
    member_a_details: personDetailsOnly(profile.partner),
    member_b_details: personDetailsOnly(profile.you),
  }
}

export function coupleDetailsToPersons(
  memberADetails: unknown,
  memberBDetails: unknown,
  memberAPhoto: string,
  memberBPhoto: string,
  mySlot: MemberSlot,
): { you: PersonProfile; partner: PersonProfile } {
  const personA = normalizePerson({ ...detailsFromJson(memberADetails), photo: memberAPhoto })
  const personB = normalizePerson({ ...detailsFromJson(memberBDetails), photo: memberBPhoto })
  if (mySlot === 'a') return { you: personA, partner: personB }
  return { you: personB, partner: personA }
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
