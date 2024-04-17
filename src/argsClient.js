import { Blockchain } from './index.js'
import { getCommands } from './commands.js'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { __dirname } from './__dirname.js'

const blockChainDataPath = join(__dirname, '..', 'data', 'blockChainData.json')

let blockchain
try {
    blockchain = new Blockchain(readFileSync(blockChainDataPath, 'utf-8'))
} catch {
    blockchain = new Blockchain()
}

console.log(process.argv)
// console.log(process.argv[2])
try {
    getCommands(blockchain)[process.argv[2]](...process.argv.slice(2))
} catch {
    console.error(`command ${process.argv[2].italic.bold} is not defined`.red)
}

writeFileSync(blockChainDataPath, JSON.stringify(blockchain), 'utf-8')
