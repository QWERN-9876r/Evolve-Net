import blocksTypes from "./blocksTypes.js"
import { Block, sha256 } from "./index.js"
import { P2P } from "./p2p.js"
import { SmartContractsController } from "./controllers/smartContractsController.js"
import { __dirname } from "./__dirname.js"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { minify } from "terser";

export const getCommands = blockchain => {
    const p2p = new P2P(blockchain)
    const smartContractsController = new SmartContractsController()

    const commands = {
        addBlock(o, type, ...args ) {
            if ( args.length ) {
                if(args[0] !== '{' ){ args.unshift('{') }
                if(args[args.length-1] !== '}'){ args.push('}') }
                args = JSON.parse(args)
            }
            const constructer = blocksTypes[type] || Block
            try {
                const block = new constructer(type, !Array.isArray(args) ? args : {})
                blockchain.addBlock(block)
                p2p.connect()
                p2p.send(block)
            } catch (err) {
                console.error(err)
            }
        },
        view() {
            console.log(blockchain.blocks)
        },
        async addContract(o, contractName) {
            if(!contractName) console.error('Error: Can not add contract without name')
            const { code } = await minify(readFileSync(join(__dirname, "..", contractName), 'utf-8'))
            smartContractsController.addContract({
                name: sha256(code),
                code
            })
            p2p.connect()
            p2p.sendSmartContract(code)
        },
        validate() {
            console.log(blockchain.isValid())
        },
        help() {
            for ( const key of Object.keys(commands) ) {
                console.log(`[] \x1b[36m${key}\x1b[0m `)
            }
        },
        exit: null
    }
    return commands
}
export const getWriteCommand = (commands, rl) => {
    const writeCommand = value => {
        value = String(value)
        if ( value === 'exit' ) return rl.close()
        const tokens = value.split(' ')
        if ( tokens[0] in commands ) {
            commands[tokens[0]](...tokens)
        } else {
            console.log('Not valid command')
        }
        rl.question('Command ', writeCommand)
    }
    return writeCommand
}