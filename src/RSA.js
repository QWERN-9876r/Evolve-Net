import crypto from "node:crypto"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { __dirname } from "./__dirname.js"
import { KeysController } from "./controllers/keysController.js"

export class RSA {
    #privateKey
    #publicKey

    #generateKeyPair() {
        const {publicKey, privateKey} = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048,
        })
        this.#privateKey = privateKey.export({type: 'pkcs1', format: 'pem'})
        this.#publicKey = publicKey.export({type: 'pkcs1', format: 'pem'})
    }

    constructor(publicKey, privateKey) {
        const keysController = new KeysController

        this.#privateKey = privateKey || this.#privateKey || keysController.getPrivateKey()
        this.#publicKey = publicKey || this.#publicKey || keysController.getPublicKey()

        console.log(this.#publicKey);

        if ( !this.#privateKey || !this.#publicKey ) {
            this.#generateKeyPair()
            keysController.setPrivateKey(this.#privateKey)
            keysController.setPublicKey(this.#publicKey)
        }
    }

    getPublicKey() {
        return this.#publicKey
        .split('-----BEGIN RSA PUBLIC KEY-----\n')[1]
        .split('-----END RSA PUBLIC KEY-----')[0]
    }
    getPrivateKey() {
        return this.#privateKey
        .split('-----BEGIN RSA PRIVATE KEY-----\n')[1]
        .split('-----END RSA PRIVATE KEY-----')[0]
    }

    encrypt(data, key) {
        return crypto.publicEncrypt(
            {
                key: key || this.#publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(data)
        )
    }

    decrypt(data, key) {
        return crypto.privateDecrypt(
            {
                key: key || this.#privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(data)
        )
    }

}


console.log(new RSA().encrypt('сообщение').toString('base64'))