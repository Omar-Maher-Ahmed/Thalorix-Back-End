import { UUID } from "crypto"

export class User {
    name: string
    email: string
    phone: string
    password: string
    cPassword: string
    role: string
    // age: number
    // gender: string
    // nationalID: string
    id?: UUID
}
