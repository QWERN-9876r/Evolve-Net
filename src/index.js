import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { haveKeys } from './helpers/haveKeys.js'

export function sha256(value) {
    return createHash('sha256').update(value).digest('hex')
}

export function getHashForBlock(block) {
    return sha256(block.toString())
}

export class Block {
    constructor({data, previousHash, date}) {
        // this.type = type
        this.previousHash = previousHash || ''
        this.data = data
        this.date = date || ''
    }
    [Symbol.toPrimitive]() {
        return this.previousHash + this.date + JSON.stringify(this.data)
    }
}

export class Transition {
    constructor(type, data) {
        haveKeys(type, data, {
            from: 'string',
            to: 'string',
            coin: 'string',
            apply: 'number'
        })
    }
}

export class CreateWallet {
    constructor(type, data) {
        haveKeys(type, data, {}, 'createWallet data must not has keys')
    }
}

export class CreateCoin {
    constructor(type, data) {
        haveKeys(type, data, {
            coinName: 'string',
            count: 'number',
            rootAddress: 'string'
        })

        if ( data.coinName.length !== 3 )
            throw new Error('the coin name must consist of 3 characters')
    }
}

export class Blockchain {
    constructor(json = JSON.stringify([new Block('genesis', {})])) {
        this.blocks = JSON.parse(json).map(block => new Block(block))
    }

    isValid() {
        for (let i = 0; i < this.blocks.length-1; i++) {
            if ( getHashForBlock(this.blocks[i]) !== this.blocks[i+1].previousHash ) {
                return false
            }
            if ( this.blocks[i].type === 'createCoin' ) {
                let valid = false
                for ( let j = 1; j < i; j++ ) {
                    if ( this.blocks[i].rootAddress === this.blocks[j].previousHash ) {
                        valid = true
                        break
                    }
                }
                if ( !valid ) return false
            }
        }
        return true
    }

    addBlock(block) {
        block.previousHash = getHashForBlock(this.blocks.at(-1))
        block.date = block.date || String(Date.now())
        this.blocks.push(block)
        writeFileSync('blockChainData.json', JSON.stringify(this.blocks))
    }
}