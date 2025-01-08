import readline from 'node:readline'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { ConfigController } from './controllers/configController.js'
import { NodesController } from './controllers/nodesControllers.js'
import { SmartContractsController } from './controllers/smartContractsController.js'
import { Blockchain } from './index.js'
import Client from 'socket.io-client'
import { MessagesSet } from './helpers/messagesSet.js'
import { DigitalSignature, verifySignature } from './digitalSignature.js'
import { KeysController } from './controllers/keysController.js'
import { RSA } from './RSA.js'
import colors from 'colors'
import { Block } from './block.js'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
})
const nodesController = new NodesController()
const smartContractsController = new SmartContractsController()
const configController = new ConfigController()
const messagesSet = new MessagesSet()
const server = createServer()
const io = new Server(server)
const connections = new Map()

export class P2P {
    #blockchain = new Blockchain()

    #sendRequest(node, { type, data }) {
        const ws = new Client(`ws://${node.ip}:${node.port}`)
        const id = KeysController.getPublicKey() || new RSA().getPublicKey()

        ws.emit(type, JSON.stringify({ data, id }))
    }

    #sendAll(type, data) {
        const id = KeysController.getPublicKey() || new RSA().getPublicKey()

        messagesSet.add(data)
        io.sockets.emit(type, JSON.stringify({ data, id }))
    }

    #onSendBlock(json) {
        const { data } = JSON.parse(json)
        const block = new Block(data)

        if (messagesSet.has(String(block))) return

        this.#blockchain.addBlock(block)
        messagesSet.add(String(block))
        this.#sendAll('sendBlock', block)
    }

    #onSendContract(data) {
        const { data: contract } = JSON.parse(data)

        if (messagesSet.has(contract)) return

        smartContractsController.addContract(contract)
        this.#sendAll('sendContract', contract)
        messagesSet.add(contract)
    }
    #onGetBlockchainHash(json) {
        const { id } = JSON.parse(json)
        console.log('getBlockchainHash');
        // const node = nodesController.getNodeById(id)

        // if (!node) {
        //     console.error(
        //         'Нода отправившая запрос на получение хеша блокчейна отсутствует в списке нод'.italic.bold.red,
        //     )
        //     return
        // }
        const hash = this.#blockchain.getHash()
        const signature = new DigitalSignature(hash).export()

        this.#sendAll('sendBlockchainHash', {hash, signature})
    }
    #onGetBlockchain(json) {
        const { data } = JSON.parse(json)

        if ( data.for !== KeysController.getPublicKey() ) return

        const blockchainJSON = JSON.stringify(this.#blockchain)
        const signature = new DigitalSignature(blockchainJSON).export()

        this.#sendAll('sendBlockchain', {signature, blockchainJSON})
    }

    #getBlockchain(node) {
        return new Promise((res, rej) => {
            this.#sendAll('getBlockchain', {for: node.id} )
            const timeout = setTimeout(rej, configController.getData().maxTimeForDownloadBlockchain || 30_000)

            connections.get(node).on('sendBlockchain', json => {
                const {
                    id,
                    data: { signature, blockchainJSON },
                } = JSON.parse(json)
                if (
                    !id ||
                    !signature ||
                    !blockchainJSON ||
                    id !== node.id ||
                    !verifySignature(signature, blockchainJSON, node.id)
                )
                    return
                clearTimeout(timeout)
                res(new Blockchain(blockchainJSON))
            })
        })
    }

    async #getNodesId() {
        for (const node of nodesController.getNodes()) {
            if ('id' in node) continue

            this.#sendAll('getId', '')

            await new Promise(res => {
                const ws = connections.get(node)
                const listener = json => {
                    const { id } = JSON.parse(json)
                    nodesController.changeNodeInfo(node, { id })
                    ws.offAny(listener)
                    res()
                }

                ws.on('sendId', listener)
            })
        }

        console.log('nodes id have been getting')
    }

    constructor(blockchain) {
        const configController = new ConfigController()
        const config = configController.getData()

        this.#blockchain = blockchain

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
        // const responses = new Array(nodesController.getNumberOfNodes()).fill(new Object()).map(
        //     () =>
        //         new Promise((res, rej) => {
        //             setTimeout(rej, 10_000)
        //         }),
        // )
        const responsesObject = new Object()
        const responses = [...connections.values()].map(ws => new Promise((res, rej) => {
            const listener = json => {
                try {
                    const {
                        id,
                        data: { signature, hash },
                    } = JSON.parse(json)

                    if (!verifySignature(signature, hash, id)) {
                        console.log('A response with an incorrect signature came from one of the nodes'.italic.bold.brightRed)
                    }

                    if (id in responsesObject) {
                        if (hash === responsesObject[id]) return
                        console.log(
                            'Two valid responses with different data came from the same node!'.italic
                                .bold.red,
                        )
                    }

                    responsesObject[id] = hash
                    ws.offAny(listener)
                    res(hash)
                } catch (err) {
                    console.error('An error occurred while receiving the hash of the blockchain: ', err)
                    rej(err)
                }
            }
            ws.on('sendBlockchainHash', listener)
        }))
        this.#sendAll('getBlockchainHash', '')
        const node = nodesController.getReliableNode()
        if ( !node ) return console.error('There are no nodes that can be trusted'.bold.italic.red)
        let blockchain, allResponses

        try {
            ;[blockchain, allResponses] = await Promise.all([this.#getBlockchain(node), Promise.all(responses)])
        } catch {
            nodesController.markNodeAsUnreliable(node)
            return this.getBlockchain()
        }
        const hashes = new Object()
        let bestHash = allResponses[0]

        for (const response of allResponses) {
            hashes[response] = response in hashes ? hashes[response] + 1 : 1
            if (hashes[response] > hashes[bestHash]) {
                bestHash = response
            }
        }

        if (blockchain.getHash() !== bestHash) {
            nodesController.markNodeAsUnreliable(node)
            return this.getBlockchain()
        }

        this.#blockchain = blockchain

        return this.#blockchain
    }
    async connect() {
        if (this.hasConnect) return
        if (!this.has) await getServer(this)

        if (nodesController.getNodes().next().done) {
            await getNodeForConnection()
        }

        const connectPromise = new Promise(res => {
            io.on('connect', res)
        })
        const connctToNodePromises = []
        for (const node of nodesController.getNodes()) {
            if ( connections.has(node) ) continue

            connctToNodePromises.push(
                new Promise(res => {
                    const ws = new Client(`ws://${node.ip}:${node.port}`)
                    connections.set(node, ws)

                    ws.on('connect', () => {
                        ws.on('sendContract', this.#onSendContract.bind(this))
                        ws.on('sendBlock', this.#onSendBlock.bind(this))
                        ws.on('getBlockchainHash', this.#onGetBlockchainHash.bind(this))
                        ws.on('getId', () => {
                            this.#sendAll('sendId', '')
                        })
                        ws.on('getBlockchain', this.#onGetBlockchain.bind(this))

                        console.log(`connection to node ws://${node.ip}:${node.port}`)
                        res()
                    })
                }),
            )
        }
        io.listen(this.port, () => {
            console.log('connect to blockchain with port'.white + ' ' + this.port)
        })

        await Promise.all([connectPromise, ...connctToNodePromises])

        this.hasConnect = true
        await this.#getNodesId()
    }
}

function getServer(server) {
    return new Promise(res => {
        rl.question('Enter your opened port: ', port => {
            server.port = Number(port)
            server.has = true
            res()
        })
    })
}

function getNodeForConnection() {
    return new Promise(res => {
        rl.question('Enter node ip for connect to blockchain: ', ip => {
            rl.question('Enter node port: ', port => {
                nodesController.addNode({
                    ip,
                    port: Number(port) || 80,
                })
                res()
            })
        })
    })
}
