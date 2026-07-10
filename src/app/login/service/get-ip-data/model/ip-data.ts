export interface IpData {
    ip: string,
    location:LocationData
}

export interface LocationData {
    city: string,
    country: string,
    latitude: number,
    longitude: number,
    timezone: string,
    localtime: string
}
