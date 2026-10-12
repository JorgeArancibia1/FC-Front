import type { MatchStatus } from './match'

export interface CreatedInvite {
  id: string
  matchId: string
  code: string
  token: string
  expiresAt: string
  url: string
}

/** Invitación general a la plataforma (no ligada a un partido). */
export interface CreatedPlatformInvite {
  id: string
  code: string
  token: string
  expiresAt: string
  url: string
}

export interface PlatformInviteResolution {
  invite: {
    valid: boolean
    code: string | null
    expiresAt: string | null
    uses: number
  }
  inviterName: string | null
}

export interface InviteMatchInfo {
  id: string
  place: string
  dateTime: string
  requiredPlayers: number
  status: MatchStatus
  notes?: string | null
  createdByName: string
  registeredCount: number
}

export interface InviteResolution {
  invite: {
    valid: boolean
    code: string | null
    expiresAt: string | null
    uses: number
  }
  match: InviteMatchInfo | null
}

export interface AcceptInviteResult {
  message: string
  matchId: string
}
