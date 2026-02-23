/**
 * PII masking utilities.
 * When `visible` is false the value is redacted; true returns it unchanged.
 */

export function maskEmail(email: string | null | undefined, visible: boolean): string {
  if (!email) return '—'
  if (visible) return email
  const [local, domain] = email.split('@')
  if (!domain) return '***@***.***'
  const domainParts = domain.split('.')
  return `${local[0]}***@${'*'.repeat(domainParts[0].length)}.${domainParts.slice(1).join('.')}`
}

export function maskPatientId(id: string | null | undefined, visible: boolean): string {
  if (!id) return '—'
  if (visible) return id
  return id.slice(0, 4) + '****'
}

export function maskOrganization(org: string | null | undefined, visible: boolean): string {
  if (!org) return '—'
  if (visible) return org
  return 'Org-****'
}

/** Returns initials suitable for an avatar */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
