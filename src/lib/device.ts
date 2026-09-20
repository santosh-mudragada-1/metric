import type { DeviceType } from '@shared/types'

/**
 * Best-effort device classification from the browser — used to show a device icon next to
 * each party player and to gate games where touch vs. mouse/keyboard is an unfair advantage.
 */
export function detectDeviceType(): DeviceType {
  if (typeof navigator === 'undefined') return 'desktop'

  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  const ua = navigator.userAgent

  // iPadOS reports as "Macintosh" in the UA string but exposes multi-touch.
  const isIPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1
  if (isIPadOS || /iPad|Tablet|PlayBook|Silk/i.test(ua)) return 'tablet'
  // Android tablets omit "Mobile" from the UA string; Android phones include it.
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet'

  if (uaData?.mobile || /Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile'

  return 'desktop'
}
