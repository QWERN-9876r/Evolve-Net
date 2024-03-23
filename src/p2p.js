import readline from 'node:readline'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { ConfigController } from './controllers/configController.js'
import { NodesController } from './controllers/nodesControllers.js'
import { SmartContractsController } from './controllers/smartContractsController.js'
import { Block, Blockchain, sha256 } from './index.js'
import Client from 'socket.io-client'
import { MessagesSet } from './helpers/messagesSet.js'
import { verifySignature } from './digitalSignature.js'
import { KeysController } from './controllers/keysController.js'
import { RSA } from './RSA.js'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
const nodesController = new NodesController
const smartContractsController = new SmartContractsController
const configController = new ConfigController
const messagesSet = new MessagesSet
const keysController = new KeysController
const server = createServer()
const io = new Server(server)

export class P2P {
    #blockchain = new Blockchain

    #sendRequest(node, {type, data}) {
        const ws = new Client(`ws://${node.ip}:${node.port}`)
        const id = keysController.getPublicKey() || new RSA().getPublicKey()

        ws.emit(type, JSON.stringify({data, id}))
    }

    #sendAll(type, data) {
        const id = keysController.getPublicKey() || new RSA().getPublicKey()
        // console.log('send\n', data)

        messagesSet.add(data)
        io.sockets.emit(type, JSON.stringify({data, id}))
    }

    #onSendBlock(json) {
        const {id, data} = JSON.parse(json)
        const block = new Block(data)
        // console.log('get\n', data)

        if ( messagesSet.has(block) ) return

        // console.log('id:', id)
        // console.log('Отправил блок:\n', block)

        this.#blockchain.addBlock(block)
        messagesSet.add(block)
        this.#sendAll('sendBlock', block)
    }
    #onSendContract(data) {
        const {data: contract, id} = JSON.parse(data)
        if ( messagesSet.has(contract) ) return

        smartContractsController.addContract({
            name: sha256(contract),
            code: contract
        })
        this.#sendAll('sendContract', contract)
        messagesSet.add(contract)
    }
    #onGetBlockchainHash({utf8Data: {id}}) {

    }

    #getBlockchain(node) {
        return new Promise((res, rej) => {
            this.#sendRequest(node, {type: 'getBlockchain', data: ''})
            const timeout = setTimeout(rej, configController.getData().maxTimeForDonloadBlockchain || 30_000)

            io.on('sendBlockchain', ({utf8Data: blockchainJSON}) => {
                clearTimeout(timeout)
                res(new Blockchain(blockchainJSON))
            })
        })
    }

    #getNodesId() {
        const requests = new Array

        for ( const node of nodesController.getNodes() ) {
            if ( 'id' in node ) continue

            this.#sendRequest(node, {
                type: 'getId',
                data: ''
            })
            requests.push(
                new Promise( res => {
                    io.on('sendId', ({utf8Data: {id}}) => {
                        nodesController.changeNodeInfo(node, {id})
                        res()
                    })
                })
            )
        }

        return Promise.all(requests)
    }

    constructor(blockchain) {
        const configController = new ConfigController
        const config = configController.getData()

        this.#blockchain = blockchain

        this.ip = config.ip || ''
        this.port = config.port || ''
        this.otherip = config.otherip || ''
        this.has = !!config.ip
        this.hasConnect = false
    }

    sendBlock(block) {
        this.#sendAll('sendBlock', block)
    }
    sendSmartContract(contract) {
        this.#sendAll('sendContract', contract)
    }
    async getBlockchain() {
        const responses = new Array(nodesController.getNumberOfNodes()).fill(new Object).map(() => new Promise(() => {}))
        let i = 0
        io.on('sendBlockchainHash', data => {
            try {
                const {id, signature, hash} = JSON.parse(data.utf8Data)

                if (!verifySignature(signature, hash, id)) {
                    console.log('От одной из нод пришел ответ с неправильное подписью')
                }

                responses[i++] = Promise.resolve(hash)

            } catch (err) {
                console.error('При получение хэша блокчейна произошла ошибка: ', err)
            }

        })
        this.#sendAll('getBlockchainHash', '')
        const node = nodesController.getReliableNode()
        let blockchain, allResponses

        try {
            [blockchain, allResponses] = await Promise.all([this.#getBlockchain(node), Promise.all(responses)])
        } catch {
            nodesController.markNodeAsUnreliable(node)
            return this.getBlockchain()
        }
        const hashes = new Object

        for ( const response of allResponses ) {
            hashes[response] = response in hashes ? hashes[response] + 1 : 1
        }
        const bestHash = hashes[allResponses[0]]
        for ( const [key, value] of Object.entries(hashes) ) {
            if ( value > hashes[bestHash] ) {
                bestHash = key
            }
        }

        if ( blockchain.getRoot().toString('hex') !== bestHash ) {
            nodesController.markNodeAsUnreliable(node)
            return this.getBlockchain()
        }

        this.#blockchain = blockchain

        return this.#blockchain
    }
    async connect() {
        if (this.hasConnect) return
        if ( !this.has ) await getServer(this)

        if (nodesController.getNodes().next().done) await getNodeForConnection()

        const connectPromise = new Promise(res => {
            io.on('connect', res)
        })
        const connctToNodePromises = []
        for ( const node of nodesController.getNodes() ) {
            connctToNodePromises.push(new Promise(res => {
                const ws = new Client(`ws://${node.ip}:${node.port}`)

                ws.on('connect', () => {
                    ws.on('sendContract', this.#onSendContract.bind(this))
                    ws.on('sendBlock', this.#onSendBlock.bind(this))
                    ws.on('getBlockchainHash', this.#onGetBlockchainHash.bind(this))

                    console.log(`connection to node ws://${node.ip}:${node.port}`)
                    res()
                })
            }))
        }
        io.listen(this.port, () => {
            console.log('\x1b[97mconnect to blockchain with port\x1b[0m ' + this.port)
        })

        this.hasConnect = true

        return Promise.all([connectPromise, ...connctToNodePromises])
    }
}

function getServer(server) {
    return new Promise(res => {
        rl.question('Enter your ip: ', ip => {
            rl.question('Enter your opened port: ', port => {
                server.ip = ip
                server.port = Number(port)
                server.has = true
                res()
            })
        })
    })
}

function getNodeForConnection() {
    return new Promise(res => {
        rl.question('Enter node ip for connect to blockchain: ', ip => {
            rl.question('Enter node port: ', port => {
                nodesController.addNode({
                    ip,
                    port: Number(port) || 80
                })
                res()
            })
        })
    })
}

const p2p = new P2P(new Blockchain())
await p2p.connect()
// function f() {
//     rl.question('Send block?', ans => {
//         if (ans.toLowerCase()[0] === 'y') p2p.sendBlock(new Block({
//             data: {transactions: [{from: 'Dima', to: 'Not bot Dima', amount: 10, currency: 'BTC'}]},
//             date: String(Date.now()),
//             previousHash: 'hash'
//         }))
//         setTimeout(f, 2000)
//     })
// }
// f()