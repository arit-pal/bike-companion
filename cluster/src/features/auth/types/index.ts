export type RegisterStep1Payload = {
  email: string
  password: string
  confirmPassword: string
}

export type RegisterStep2Payload = {
  makeModel: string
  year: number
  odometer: string
  odometerUnit: 'KM'
  category: string
  vin?: string
}

export type RegisterPayload = RegisterStep1Payload & RegisterStep2Payload

export type LoginPayload = {
  email: string
  password: string
}

export type AuthResponse = {
  token: string
  user: { email: string }
}
