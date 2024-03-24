import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { __dirname } from '../__dirname.js'
import { writeFile } from 'node:fs/promises'

let privateKey = ''
let publicKey = ''

export class KeysController {
    getPrivateKey() {
        try {
            if (!privateKey) privateKey = readFileSync(join(__dirname, '..', 'data', 'privateKey.key'), 'utf-8')
        } catch {
            return ''
        }
        return privateKey
        // .split('-----BEGIN RSA PRIVATE KEY-----\n')[1]
        // .split('-----END RSA PRIVATE KEY-----')[0]
        // .replaceAll('\n', '')
    }

    getPublicKey() {
        try {
            if (!publicKey) publicKey = readFileSync(join(__dirname, '..', 'data', 'publicKey.key'), 'utf-8')
        } catch {
            return ''
        }
        return publicKey
            .split('-----BEGIN RSA PUBLIC KEY-----\n')[1]
            .split('-----END RSA PUBLIC KEY-----')[0]
            .replaceAll('\n', '')
    }

    setPublicKey(key) {
        publicKey = key
        return writeFile(join(__dirname, '..', 'data', 'public.key'), key)
    }
    setPrivateKey(key) {
        privateKey = key
        return writeFile(join(__dirname, '..', 'data', 'private.key'), key)
    }
}
