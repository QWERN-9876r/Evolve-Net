import { randomUUID } from 'node:crypto'
import { sha256 } from './index.js'

export class SmartContract {
    constructor(code, owner, name = '') {
        this.name = name || this.generateName()
        this.code = code
        this.owner = owner
    }
    generateName() {
        return (this.name = sha256(this.code + randomUUID()))
    }
}
