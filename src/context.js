export const poolOfTranslations = Symbol('poolOfTranslations')
export const allPrivateProperties = Symbol('allPrivateProperties')

export class Context {
    #poolOfTranslations = new Array()

    constructor() {}
    addTransaction(Block) {}
    timeout(callback, ms) {}

    transfer(trans) {
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
}

console.log(new Context()[poolOfTranslations])
