import readline from 'node:readline'
import { getCommands, getWriteCommand } from './commands.js'
import { __dirname } from './__dirname.js'
import { BlockchainController } from './controllers/blockchainController.js'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
})
const blockchainController = new BlockchainController()
const blockchain = blockchainController.get()

const writeCommand = getWriteCommand(getCommands(blockchain), rl)

rl.question('₿ ', writeCommand)