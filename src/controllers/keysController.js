import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { __dirname } from '../__dirname.js'
import { writeFile } from 'node:fs/promises'
import { getDataFolder } from './dataFolderPath.js'

export class KeysController {
    static #privateKey = ''
    static #publicKey = ''

    static getPrivateKey() {
        try {
            if (!this.#privateKey)
                this.#privateKey = readFileSync(join(__dirname, '..', getDataFolder(), 'private.key'), 'utf-8')
        } catch {
            return ''
        }
        return this.#privateKey
    }

    static getPublicKey() {
        try {
            if (!this.#publicKey)
                this.#publicKey = readFileSync(join(__dirname, '..', getDataFolder(), 'public.key'), 'utf-8')
        } catch {
            return ''
        }
        return this.#publicKey
            .split('-----BEGIN RSA PUBLIC KEY-----\n')[1]
            .split('-----END RSA PUBLIC KEY-----')[0]
            .replaceAll('\n', '')
    }

    static setPublicKey(key) {
        this.#publicKey = key
        return writeFile(join(__dirname, '..', getDataFolder(), 'public.key'), key)
    }
    static setPrivateKey(key) {
        this.#privateKey = key
        return writeFile(join(__dirname, '..', getDataFolder(), 'private.key'), key)
    }
    static toExportFormat(key, format) {
        format = format.toUpperCase()
        return `-----BEGIN RSA ${format} KEY-----\n` + key + `\n-----END RSA ${format} KEY-----`
    }
}
