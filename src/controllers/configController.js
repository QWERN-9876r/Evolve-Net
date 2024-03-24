import { readFileSync, writeFile } from 'node:fs'
import { join } from 'node:path'
import { __dirname } from '../__dirname.js'

export class ConfigController {
    #path = ''
    #data = new Object()
    constructor(path = join(__dirname, '..', 'blockchain.conf.json')) {
        this.#path = path
        this.#data = path ? JSON.parse(readFileSync(path, 'utf-8') || '{}') : new Object()
    }
    #writeInFile() {
        return new Promise(res => {
            writeFile(this.#path, JSON.stringify(this.#data), 'utf-8', res.bind(this, this))
        })
    }
    create(data = '', path = join(__dirname, '..')) {
        this.#data = JSON.parse(data)
        this.#path = join(path, 'blockchain.conf.json')

        return this.#writeInFile()
    }
    add(key, value) {
        this.#data[key] = value
        if (!this.#path) return this.create(JSON.stringify(this.#data))

        return this.#writeInFile()
    }
    getData() {
        return this.#data
    }
    getPath() {
        return this.#path
    }
}
