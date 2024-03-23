import { readFileSync, writeFile } from "node:fs"
import { join } from "node:path"
import { __dirname } from "../__dirname.js"

let store = new Array
const pathToFile = join(__dirname, '..', 'data', 'nodes.json')

export class NodesController {
    #downloadDataFromFile() {
        try {
            store = JSON.parse(readFileSync(pathToFile, 'utf8')) || new Array
        } catch {}
    }

    #saveDataToFile() {
        // writeFile(pathToFile, JSON.stringify(store), () => {
        //     console.log(`\x1b[97mupdate data about nodes \x1b[0m`)
        // })
    }

    getNodes() {
        if (!store.length) this.#downloadDataFromFile()
        return store[Symbol.iterator]()
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
        for ( const node of store ) {
            if (!node.unreliable ) return node
        }
        return null
    }

    changeNodeInfo(node, changes) {
        for ( const [key, value] of Object.entries(changes) ) {
            node[key] = value
        }
        return this.#saveDataToFile()
    }
}