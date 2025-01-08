import crypto from 'node:crypto'
import { __dirname } from './__dirname.js'
import { KeysController } from './controllers/keysController.js'

export class RSA {
    #privateKey
    #publicKey

    #generateKeyPair() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 512,
        })
        this.#privateKey = privateKey.export({ type: 'pkcs1', format: 'pem' })
        this.#publicKey = publicKey.export({ type: 'pkcs1', format: 'pem' })
    }

    constructor(publicKey, privateKey) {
        this.#privateKey = privateKey || this.#privateKey || KeysController.getPrivateKey()
        this.#publicKey = publicKey || this.#publicKey || KeysController.getPublicKey()

        if (!this.#privateKey || !this.#publicKey) {
            this.#generateKeyPair()
            KeysController.setPrivateKey(this.#privateKey)
            KeysController.setPublicKey(this.#publicKey)
        }
    }

    getPublicKey() {
        return this.#publicKey.split('-----BEGIN RSA PUBLIC KEY-----\n')[1].split('-----END RSA PUBLIC KEY-----')[0]
    }
    getPrivateKey() {
        return this.#privateKey
        // .split('-----BEGIN RSA PRIVATE KEY-----\n')[1].split('-----END RSA PRIVATE KEY-----')[0]
    }

    encrypt(data, key) {
        return crypto.publicEncrypt(
            {
                key: key || this.#publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            Buffer.from(data),
        )
    }

    decrypt(data, key) {
        return crypto.privateDecrypt(
            {
                key: key || this.#privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            Buffer.from(data),
        )
    }
}
