import { haveKeys } from './helpers/haveKeys.js'
import colors from 'colors'

export const poolOfTranslations = Symbol('poolOfTranslations')
export const allPrivateProperties = Symbol('allPrivateProperties')

export class Context {
    #poolOfTranslations = new Array()
    #poolOfTimouts = new Array()
    #initiator
    #args

    constructor(initiator, args) {
        if (!(typeof initiator === 'string'))
            console.error('In params in Context initiator must be a string'.italic.bold.red)
        if (!(args instanceof Array)) console.error('In params in Context args must be an array'.italic.bold.red)
        this.#initiator = initiator
        this.#args = args
    }

    timeout(callback, ms) {
        if (ms > 20_000) return
        this.#poolOfTimouts([callback, ms])
        setTimeout(callback, ms)
    }
    deployCoin({ name, symbol }) {}

    transfer(trans) {
        if (
            !haveKeys(trans, {
                from: 'string',
                to: 'string',
                amount: 'number',
                coin: 'string',
            })
        )
            console.error(
                'transfer is not complete\n\nSmart Contracts Error: incorrect properies: Transaction (type Transfer)'
                    .italic.bold.red,
            )
        this.#poolOfTranslations.push(trans)
    }
    get [poolOfTranslations]() {
        return this.#poolOfTranslations
    }
    get [allPrivateProperties]() {
        return {
            poolOfTranslations: this.#poolOfTranslations,
        }
    }
    get initiator() {
        return this.#initiator
    }
    get args() {
        return this.#args
    }
}
