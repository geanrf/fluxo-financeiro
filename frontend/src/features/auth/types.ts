export type User = {
  id: string
  name: string
  email: string
}

export type AuthResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: User
}
