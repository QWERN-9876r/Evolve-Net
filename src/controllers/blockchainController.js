import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { getDataFolder } from './dataFolderPath.js'
import { __dirname } from '../__dirname.js'
import { Blockchain } from '../index.js'

let data = null

export class BlockchainController {
    #readDataFromFile() {
        try {
            data = new Blockchain(readFileSync(join(__dirname, '..', getDataFolder(), 'blockChainData.json'), 'utf-8') || '[]')
        } catch {
            data = new Blockchain()
        }
    }

    #writeDataToFile() {
        if (!data) return
        writeFileSync(join(__dirname, '..', getDataFolder(), 'blockChainData.json'), JSON.stringify(data))
    }

    constructor() {
        // this.#filePath = filePath || this.#filePath
    }

    get() {
        if (!data) this.#readDataFromFile()
        const writeDataToFile = () => queueMicrotask(this.#writeDataToFile)
        data.on('change', writeDataToFile)
        return data
    }
    set(value) {
        data = value
        this.#writeDataToFile()
    }
}
