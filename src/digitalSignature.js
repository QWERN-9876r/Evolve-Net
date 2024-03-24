import { __dirname } from './__dirname.js'
import { createSign } from 'node:crypto'
import { KeysController } from './controllers/keysController.js'
import { RSA } from './RSA.js'

export class DigitalSignature {
    #signature = ''

    constructor(data, privateKey) {
        const keysController = new KeysController()
        const sign = createSign('RSA-SHA256')

        privateKey = privateKey || keysController.getPrivateKey() || new RSA().getPrivateKey()

        sign.update(data, 'utf-8')
        this.#signature = sign.sign(privateKey, 'base64')
    }
    [Symbol.toString]() {
        return this.#signature
    }

    export() {
        return this.#signature
    }
}
export function verifySignature(signature, data, publicKey) {
    if (signature instanceof DigitalSignature) signature = signature.export()

    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(data)
    return verify.verify(publicKey, signature, 'base64')
}
