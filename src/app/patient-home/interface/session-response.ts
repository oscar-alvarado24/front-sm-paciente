export interface SessionResponse {
    country?: string,
    city?: string,
    timezone?: string,
    ip?: string,
    coordinates?: {
        latitude?: number,
        longitude?: number
    },
    email?: string,
    connectionTime?: string
}
