import { createHash } from 'node:crypto'
import { createMerkleTree } from './merkelTree.js'
import { Context } from './context.js'
import colors from 'colors'
import genesisBlock from './genesis.js'
import { Transaction } from './transaction.js'
import { Block } from './block.js'

export function sha256(value) {
    return createHash('sha256').update(value).digest('hex')
}

export class Blockchain {
    #blocks
    #balances = {
        '0x000': {
            JSC: 1_000_000_000,
        },
    }

    #changed = false
    #listeners = {
        change: blockchain => {}
    }

    async #calcBalances() {
        this.#changed = false
        const queueTasks = new Array()
        const transactions = new Array()
        const contexts = new Array()

        for (const block of this.#blocks) {
            for (let transaction of block.body.transactions) {
                if (!(transaction instanceof Transaction)) {
                    console.log(transaction)
                    transaction = new Transaction(transaction)
                }

                const ctx = new Context(transaction.initiator, transaction.args)

                queueTasks.push(transaction.check(ctx))
                transactions.push(transaction)
                contexts.push(ctx)
            }
        }

        const results = await Promise.all(queueTasks)

        for (let i = 0; i < results.length; i++) {
            const result = results[i]
            const transaction = transactions[i]
            const ctx = contexts[i]

            if (!result) continue

            const changes = structuredClone(this.#balances)
            let valid = true

            for (const { from, to, amount, coin } of transaction.contractInfo.poolOfTranslations) {
                if (!changes[from][coin]) {
                    valid = false
                    break
                }
                changes[from][coin] -= amount
                if (changes[from][coin] < 0) {
                    valid = false
                    break
                }
                if (!(to in changes)) changes[to] = new Object()
                if (!(coin in changes[to])) changes[to][coin] = 0
                changes[to][coin] += amount
            }

            if (valid) this.#balances = changes
        }
    }

    constructor(json = JSON.stringify([genesisBlock])) {
        this.#blocks = JSON.parse(json).map(block => new Block(block))
    }

    [Symbol.toPrimitive]() {
        return this.getHash()
    }
    toJSON() {
        return this.#blocks
    }

    async getBalanses() {
        if (this.#changed) await this.#calcBalances()
        return this.#balances
    }

    isValid() {
        for (let i = 0; i < this.#blocks.length - 1; i++) {
            if (String(this.#blocks[i]) !== this.#blocks[i + 1].previousHash) {
                return false
            }
            if (this.#blocks[i].type === 'createCoin') {
                let valid = false
                for (let j = 1; j < i; j++) {
                    if (this.#blocks[i].rootAddress === this.#blocks[j].previousHash) {
                        valid = true
                        break
                    }
                }
                if (!valid) return false
            }
        }
        return true
    }

    addBlock(block) {
        this.#changed = true
        this.#listeners.change(this)
        block.previousHash = String(this.#blocks.at(-1))
        block.date = block.date || String(Date.now())
        this.#blocks.push(block)
    }

    getHash() {
        return createMerkleTree(this.#blocks).getRoot().toString('hex')
    }

    on(event, listener) {
        this.#listeners[event] = listener
    }
}
// const keysController = new KeysController()

// import { BlockchainController } from './controllers/blockchainController.js'

// const blockchain = new BlockchainController().get()
// const transaction1 = new Transaction({
//     contractName: '59b7439b463772aeb8bd92484f7b222e35992908a41a484a5dc13839c7f67cc8',
//     initiator: keysController.getPublicKey(),
//     signature: new DigitalSignature(String()).export(),
// })
// const transaction2 = new Transaction({
//     contractName: '59b7439b463772aeb8bd92484f7b222e35992908a41a484a5dc13839c7f67cc8',
//     initiator: keysController.getPublicKey(),
//     signature: new DigitalSignature(String()).export(),
// })
// const transaction3 = new Transaction({
//     contractName: '59b7439b463772aeb8bd92484f7b222e35992908a41a484a5dc13839c7f67cc8',
//     initiator: keysController.getPublicKey(),
//     signature: new DigitalSignature(String()).export(),
// })
// blockchain.addBlock(
//     new Block({
//         body: {
//             transactions: [transaction1, transaction2, transaction3],
//         },
//     }),
// )
// blockchain.addBlock(
//     new Block({
//         body: {
//             transactions: [transaction1, transaction2, transaction3],
//         },
//     }),
// )
// blockchain.addBlock(
//     new Block({
//         body: {
//             transactions: [transaction1, transaction2, transaction3],
//         },
//     }),
// )

// console.log(await blockchain.getBalanses())
