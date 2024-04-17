import { __dirname } from './__dirname.js'
import { createSign, createVerify } from 'node:crypto'
import { KeysController } from './controllers/keysController.js'
import { RSA } from './RSA.js'

const keysController = new KeysController()

export class DigitalSignature {
    #signature = ''

    constructor(data, privateKey) {
        const sign = createSign('RSA-SHA256')

        privateKey = privateKey || keysController.getPrivateKey() || new RSA().getPrivateKey()

        sign.update(data, 'utf-8')
        this.#signature = sign.sign(privateKey, 'base64')
    }
    [Symbol.toString]() {
        return this.#signature
    }
    toJSON() {
        return this.#signature
    }

    export() {
        return this.#signature
    }
}
export function verifySignature(signature, data, publicKey) {
    if (signature instanceof DigitalSignature) signature = signature.export()

    const verifier = createVerify('SHA256')

    verifier.update(data)

    publicKey = keysController.toExportFormat(publicKey, 'public')

    const verification = verifier.verify(publicKey, signature, 'base64')

    // const verify = createVerify('RSA-SHA256')

    // return verify('RSA-PSS', Buffer.from(publicKey), Buffer.from(signature), Buffer.from(data))
    return verification
}
