import { readFileSync, writeFileSync } from 'node:fs'
import readline from 'node:readline'
import { Blockchain } from './index.js'
import { getCommands, getWriteCommand } from './commands.js'
import { join } from 'node:path'
import { __dirname } from './__dirname.js'

const blockChainDataPath = join(__dirname, '..', 'data', 'blockChainData.json')
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

let blockchain
try {
    blockchain = new Blockchain(readFileSync(blockChainDataPath, 'utf-8'))
} catch {
    blockchain = new Blockchain()
}
const writeCommand = getWriteCommand(getCommands(blockchain), rl)

rl.question('Command ', writeCommand)

writeFileSync(blockChainDataPath, JSON.stringify(blockchain.blocks), 'utf-8')