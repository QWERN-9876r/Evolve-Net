import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { createMerkleTree } from './merkelTree.js'
import { DigitalSignature } from './digitalSignature.js'
import { SmartContractsController } from './controllers/smartContractsController.js'
import { Context, allPrivateProperties } from './context.js'
import colors from 'colors'

const smartContractsController = new SmartContractsController()

export function sha256(value) {
    return createHash('sha256').update(value).digest('hex')
}

export class Transaction {
    #contractName
    #contractFunction
    #signature
    #args = new Array()
    #active = false

    #contractInfo = new Object()

    constructor({ contractName, signature, args = new Array() }, fromJSON) {
        if (fromJSON) return
        if (
            !(
                typeof contractName === 'string' &&
                (signature instanceof DigitalSignature || typeof signature === 'string') &&
                Array.isArray(args)
            )
        ) {
            console.error(
                'Класс транзакции принимает в себя параметр contractName типа string и массив args'.italic.bold.red,
            )
            return
        }
        this.#contractName = contractName
        this.#signature = String(signature)
        this.#args = args
    }
    [Symbol.toPrimitive]() {
        return sha256(
            JSON.stringify({
                contractName: this.#contractName,
                signature: this.#signature,
                args: this.#args,
            }),
        )
    }
    toJSON() {
        return {
            contractName: this.#contractName,
            signature: this.#signature,
            args: this.#args,
            contractInfo: this.#contractInfo,
            active: this.#active,
        }
    }
    fromJSON(json) {
        const { contractName, signature, args, contractInfo, active } = JSON.parse(json)

        this.#contractName = contractName
        this.#signature = signature
        this.#args = args
        this.#contractInfo = contractInfo
        this.#active = active

        return this
    }

    get contractName() {
        return this.#contractName
    }
    get signature() {
        return this.#signature
    }

    async check(ctx) {
        if (this.#active) return true
        if (!(ctx instanceof Context)) {
            console.error('Функция chack принимает в себя параметр ctx типа Context'.italic.bold.red)
            return false
        }
        if (!this.#contractFunction) this.#contractFunction = await smartContractsController.getContract(contract.name)

        this.#active = await this.#contractFunction(ctx)
        this.#contractInfo = ctx[allPrivateProperties]

        return this.#active
    }
}
export function createTransactionFromJSON(json) {
    return new Transaction(new Object(), true).fromJSON(json)
}

export class Block {
    #previousHash
    #body
    #date
    #transactionsHash

    #calcTransactionHash() {
        this.#transactionsHash = createMerkleTree(this.#body.transactions).getRoot().toString('hex')
    }

    constructor({ body = new Object(), previousHash = '', date = '' }, fromJSON) {
        if (fromJSON) return
        this.#previousHash = previousHash
        this.#body = body
        this.#date = date
        this.#calcTransactionHash()
    }
    [Symbol.toPrimitive]() {
        return sha256(this.#previousHash + this.#date + JSON.stringify(this.#body))
    }
    toJSON() {
        return {
            previousHash: this.#previousHash,
            body: this.#body,
            date: this.#date,
            transactionsHash: this.#transactionsHash,
        }
    }
    fromJSON(json) {
        const { previousHash, body, date, transactionsHash } = JSON.parse(json)

        this.#previousHash = previousHash
        this.#body = body
        this.#date = date
        this.#transactionsHash = transactionsHash

        return this
    }
    get previousHash() {
        return this.#previousHash
    }
    set previousHash(value) {
        this.#previousHash = value
    }
    get body() {
        return this.#body
    }
    get date() {
        return this.#date
    }
    set date(value) {
        this.#date = value
    }
    get transactionsHash() {
        return this.#transactionsHash
    }

    addTransaction(transaction) {
        if (!(transaction instanceof Transaction)) {
            console.error('addTransaction принимает в себя только параметр с типом Transaction'.italic.bold.red)
            return false
        }
        this.#body.transactions.push(transaction)
        this.#calcTransactionHash()
        return true
    }
}

export class Blockchain {
    constructor(json = JSON.stringify([new Block('genesis', {})])) {
        this.blocks = JSON.parse(json).map(block => new Block(block))
    }

    isValid() {
        for (let i = 0; i < this.blocks.length - 1; i++) {
            if (getHashForBlock(this.blocks[i]) !== this.blocks[i + 1].previousHash) {
                return false
            }
            if (this.blocks[i].type === 'createCoin') {
                let valid = false
                for (let j = 1; j < i; j++) {
                    if (this.blocks[i].rootAddress === this.blocks[j].previousHash) {
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
        block.previousHash = String(this.blocks.at(-1))
        block.date = block.date || String(Date.now())
        this.blocks.push(block)
        writeFileSync('blockChainData.json', JSON.stringify(this.blocks))
    }

    getHash() {
        return createMerkleTree(this.blocks).getRoot().toString('hex')
    }
}
