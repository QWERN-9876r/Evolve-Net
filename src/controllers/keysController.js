import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { __dirname } from '../__dirname.js'
import { writeFile } from 'node:fs/promises'
import { getDataFolder } from './dataFolderPath.js'

let privateKey = ''
let publicKey = ''

export class KeysController {
    getPrivateKey() {
        try {
            if (!privateKey)
                privateKey = readFileSync(join(__dirname, '..', getDataFolder(), 'private.key'), 'utf-8')
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
            if (!publicKey) publicKey = readFileSync(join(__dirname, '..', getDataFolder(), 'public.key'), 'utf-8')
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
        return writeFile(join(__dirname, '..', getDataFolder(), 'public.key'), key)
    }
    setPrivateKey(key) {
        privateKey = key
        return writeFile(join(__dirname, '..', getDataFolder(), 'private.key'), key)
    }
    toExportFormat(key, format) {
        format = format.toUpperCase()
        return `-----BEGIN RSA ${format} KEY-----\n` + key + `\n-----END RSA ${format} KEY-----`
    }
}
