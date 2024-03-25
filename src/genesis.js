import { Block } from './block.js'
import { DigitalSignature } from './digitalSignature.js'
import { Transaction } from './transaction.js'

const genesisBlock = new Block({ date: Date.now() })
genesisBlock.addTransaction(
    new Transaction({ contractName: 'createMainCoin', signature: new DigitalSignature(String(genesisBlock)).export() }),
)
export default genesisBlock
