import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { __dirname } from '../__dirname.js'
import { getDataFolder } from './dataFolderPath.js'

let store = new Array()
const storeTable = new Object()
const getPathToFile = () => join(__dirname, '..', getDataFolder(), 'nodes.json')

export class NodesController {
    #downloadDataFromFile() {
        try {
            store = JSON.parse(readFileSync(getPathToFile(), 'utf8')) || new Array()
            for (const node of store) {
                if ( node.id ) storeTable[node.id] = node
            }
        } catch {}
    }

    #saveDataToFile() {
        writeFileSync(getPathToFile(), JSON.stringify(store), () => {
            console.log(`\x1b[97mupdate data about nodes \x1b[0m`)
        })
    }

    getNodes() {
        if (!store.length) this.#downloadDataFromFile()
        return store[Symbol.iterator]()
    }

    getNodeById(id) {
        if (!store.length) this.#downloadDataFromFile()
        return storeTable[id]
    }

    getNumberOfNodes() {
        if (!store.length) this.#downloadDataFromFile()
        return store.length
    }

    addNode(node) {
        store.push(node)
        this.#saveDataToFile()
    }

    deleteNodes(nodes) {
        store = store.filter(node => !nodes.includes(node))
        this.#saveDataToFile()
    }

    markNodeAsUnreliable(node) {
        node.unreliable = true
        this.#saveDataToFile()
    }

    getReliableNode() {
        for (const node of store) {
            if (!node.unreliable) return node
        }
        return null
    }

    changeNodeInfo(node, changes) {
        for (const [key, value] of Object.entries(changes)) {
            node[key] = value
            if ( !(node.id in storeTable) ) storeTable[node.id] = node
        }
        return this.#saveDataToFile()
    }
}
