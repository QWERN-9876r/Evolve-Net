import { sha256 } from "../index.js"

export class MessagesSet {
    #messages
    constructor() {
        this.#messages = new Set
    }

    add(message) {
        message = String(message)
        const hash = sha256(message)
        this.#messages.add(hash)
        setTimeout(this.#messages.delete, 120_000, hash)
    }

    has(message) {
        return this.#messages.has(sha256(String(message)))
    }
}