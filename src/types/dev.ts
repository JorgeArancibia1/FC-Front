export interface DevSystem {
  environment: string
  uptimeSeconds: number
  mailConfigured: boolean
  totals: {
    users: number
    activeUsers: number
    matches: number
    registrations: number
    invites: number
  }
  roleCounts: Record<string, number>
  matchesByStatus: Record<string, number>
}
