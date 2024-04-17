import { createMerkleTree } from './merkelTree.js'
import colors from 'colors'
import { Transaction } from './transaction.js'
import { sha256 } from './index.js'

export class Block {
    #previousHash
    #body = {
        transactions: new Array(),
    }
    #date
    #transactionsHash

    #calcTransactionHash() {
        this.#transactionsHash = createMerkleTree(this.#body.transactions).getRoot().toString('hex')
    }

    constructor({ body = this.#body, previousHash = '', date = '' }, fromJSON = false) {
        if (fromJSON) return
        this.#previousHash = previousHash
        this.#body = body
        this.#date = date
        this.#calcTransactionHash()
    }
    [Symbol.toPrimitive]() {
        this.#calcTransactionHash()

        return sha256(this.#previousHash + this.#date + this.#transactionsHash)
    }
    toJSON() {
        this.#calcTransactionHash()

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
        this.#calcTransactionHash()

        return this.#transactionsHash
    }

    addTransaction(transaction) {
        if (!(transaction instanceof Transaction)) {
            console.error('addTransaction принимает в себя только параметр с типом Transaction'.italic.bold.red)
            return false
        }
        this.#body.transactions.push(transaction)
        return true
    }
}
