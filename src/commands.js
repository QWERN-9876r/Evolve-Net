import { Block } from './index.js'
import { P2P } from './p2p.js'
import { SmartContractsController } from './controllers/smartContractsController.js'
import { __dirname } from './__dirname.js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { minify } from 'terser'
import { SmartContract } from './smartContract.js'

export const getCommands = blockchain => {
    const p2p = new P2P(blockchain)
    const smartContractsController = new SmartContractsController()

    const commands = {
        async addTransaction(o, type, ...args) {},
        async getBlockchain() {
            await p2p.connect()
            await p2p.getBlockchain()
        },
        view() {
            console.log(blockchain.blocks)
        },
        async addContract(o, pathToFile) {
            //addContract ./blockchain/contract.test.js
            if (!pathToFile) console.error('Error: Can not add contract without name')
            try {
                const { code } = await minify(readFileSync(join(__dirname, '..', '..', pathToFile), 'utf-8'))
                const contract = new SmartContract(code)

                smartContractsController.addContract(contract)
                await p2p.connect()
                p2p.sendSmartContract(code)
            } catch (err) {
                console.error(err)
            }
        },
        validate() {
            console.log(blockchain.isValid())
        },
        help() {
            for (const key of Object.keys(commands)) {
                console.log(`[] \x1b[36m${key}\x1b[0m `)
            }
        },
        createWallet() {
            console.log('this command is already not created')
        },
        exit: null,
    }
    return commands
}
export const getWriteCommand = (commands, rl) => {
    const writeCommand = async value => {
        value = String(value)
        if (value === 'exit') return rl.close()
        const tokens = value.split(' ')
        if (tokens[0] in commands) {
            await commands[tokens[0]](...tokens)
        } else {
            console.log('Not valid command')
        }
        rl.question('Command ', writeCommand)
    }
    return writeCommand
}
