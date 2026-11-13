export const BIRTHDAY_APP_PASSCODE = '140092'

const SESSION_KEY = 'birthday-app-unlocked'

export function isBirthdayAppUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function unlockBirthdayApp(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* private mode / storage blocked */
  }
}
