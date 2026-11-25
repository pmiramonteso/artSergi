import type { H3Event } from 'h3'
import { normalizeClientIpHeader, resolveClientIp } from '#shared/utils/client-ip'

export function clientIpHeader(event?: H3Event) {
  return normalizeClientIpHeader(useRuntimeConfig(event).clientIpHeader)
}

export function clientIp(event: H3Event): string {
  const header = clientIpHeader(event)
  return resolveClientIp(
    header,
    header ? getRequestHeader(event, header) : null,
    event.node.req.socket?.remoteAddress,
  )
}
