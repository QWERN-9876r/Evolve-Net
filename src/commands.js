import { P2P } from './p2p.js'
import { SmartContractsController } from './controllers/smartContractsController.js'
import { __dirname } from './__dirname.js'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { minify } from 'terser'
import { SmartContract } from './smartContract.js'
import { setDataFolder } from './controllers/dataFolderPath.js'
import { BlockchainController } from './controllers/blockchainController.js'

function changeDataFolder(_, folderName) {
    if (!folderName) return console.error('for change data folder need write path to folder'.bold.italic.red)
    setDataFolder(folderName)
    try {
        mkdirSync(join(__dirname, '..', folderName))
    } catch {}
    console.log(`data folder has been changed on ${folderName}`.bold.green)
}

export const getCommands = blockchain => {
    const p2p = new P2P(blockchain)
    const smartContractsController = new SmartContractsController()
    const blockchainController = new BlockchainController()

    const commands = {
        async addTransaction(o, type, ...args) {},
        async getBlockchain() {
            await p2p.connect()
            const blockchain = await p2p.getBlockchain()
            blockchainController.set(blockchain)
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
            console.log(blockchain.isValid() ? 'Valid' : 'Not Valid')
        },
        help() {
            for (const key of Object.keys(commands).sort((name1, name2) => name1.localeCompare(name2))) {
                console.log(`[] \x1b[36m${key}\x1b[0m `)
            }
        },
        createWallet() {
            console.log('this command is already not created')
        },
        async getBalances() {
            console.log(await blockchain.getBalances())
        },
        async getBalance(wallet) {
            console.log((await blockchain.getBalances())[wallet])
        },
        connect() {
            return p2p.connect()
        },
        changeDataFolder,
        cdf: changeDataFolder,
        change: getActionFunction('change'),
        get: getActionFunction('get'),
        create: getActionFunction('create'),
        exit: null,
    }
    function getActionFunction(actionName) {
        return (_, functionName, ...args) => {
            if (!functionName || !commands[actionName + functionName[0].toUpperCase() + functionName.slice(1)])
                return console.error(`Function with name ${functionName} does not exist`.red.bold)
            return commands[actionName + functionName[0].toUpperCase() + functionName.slice(1)](_, ...args)
        }
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
        rl.question('₿ ', writeCommand)
    }
    return writeCommand
}

export async function addContract() {}
