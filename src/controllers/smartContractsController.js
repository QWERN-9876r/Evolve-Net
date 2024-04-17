import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { __dirname } from '../__dirname.js'
import { writeFile } from 'node:fs'
import colors from 'colors'
import { getDataFolder } from './dataFolderPath.js'

let contracts = new Array()
const store = new Object()

export class SmartContractsController {
    #downloadDataFromFolder() {
        try {
            contracts = readdirSync(join(__dirname, '..', getDataFolder(), 'smartContracts')).map(name =>
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
        writeFile(join(__dirname, '..', getDataFolder(), 'smartContracts', `${contract.name}.js`), contract.code, () =>
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

        const contract = await import(join('..', '..', getDataFolder(), 'smartContracts', `${name}.js`))
        store[name] = contract.default

        return contract.default
    }
}
