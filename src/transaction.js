import { DigitalSignature } from './digitalSignature.js'
import { SmartContractsController } from './controllers/smartContractsController.js'
import { Context, allPrivateProperties } from './context.js'
import colors from 'colors'
import { sha256 } from './index.js'

const smartContractsController = new SmartContractsController()

export class Transaction {
    #contractName
    #contractFunction
    #initiator
    #signature
    #args
    #active = false

    #contractInfo = {
        poolOfTranslations: new Array(),
    }

    constructor({ contractName, signature, initiator, args = new Array() }, fromJSON) {
        if (fromJSON) return
        if (
            !(
                typeof contractName === 'string' &&
                (signature instanceof DigitalSignature || typeof signature === 'string') &&
                Array.isArray(args)
            )
        ) {
            console.error(
                'The transaction class includes a ContractName parameter of type string and an array of args'.italic
                    .bold.red,
            )
            return
        }
        this.#contractName = contractName
        this.#signature = String(signature)
        this.#initiator = initiator
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
            initiator: this.#initiator,
            args: this.#args,
            contractInfo: this.#contractInfo,
            active: this.#active,
        }
    }
    static fromJSON(json) {
        const obj = JSON.parse(json)

        const transaction = new Transaction(obj)

        return transaction
    }

    get contractName() {
        return this.#contractName
    }
    get signature() {
        return this.#signature
    }
    get contractInfo() {
        return this.#contractInfo
    }
    get initiator() {
        return this.#initiator
    }
    get args() {
        return this.#args
    }

    async check(ctx) {
        if (this.#active) return true
        if (!(ctx instanceof Context)) {
            console.error('The check function accepts a ctx parameter of the Context type'.italic.bold.red)
            return false
        }
        if (!this.#contractFunction)
            this.#contractFunction = await smartContractsController.getContract(this.#contractName)
        if (!this.#contractFunction) return false

        this.#active = await this.#contractFunction(ctx)
        this.#contractInfo = ctx[allPrivateProperties]

        return this.#active
    }
}