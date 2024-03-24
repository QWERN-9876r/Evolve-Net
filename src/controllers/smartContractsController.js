import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { __dirname } from '../__dirname.js'
import { writeFile } from 'node:fs'
import colors from 'colors'

const contracts = new Array()
const store = new Object()

export class SmartContractsController {
    #downloadDataFromFolder() {
        try {
            contracts =
                contracts ||
                JSON.parse(readdirSync(join(__dirname, '..', 'data', 'smartContracts'))).map(name =>
                    name.slice(0, name.length - 3),
                )
        } catch {}
    }
    #checkOnValid(contract) {
        return !contract.match(/import|console|setTimeout|setInterval/gm)
    }
    addContract(contract) {
        if (!this.#checkOnValid(contract.code)) return false
        if (!contracts.length) {
            this.#downloadDataFromFolder()
        }
        contracts.push(contract.name)
        store[contract.name] = contract.code
        writeFile(join(__dirname, '..', 'data', 'smartContracts', `${contract.name}.js`), contract.code, () =>
            console.log(`added smart contract with name ${contract.name}`.white),
        )

        return true
    }
    async getContract(name) {
        if (!contracts.length) {
            this.#downloadDataFromFolder()
        }
        if (!contracts.includes(name)) return null
        if (name in store) return store[name]

        const contract = await import(join(__dirname, '..', 'data', 'smartContracts', `${name}.js`))
        store[name] = contract

        return contract
    }
}
