import { MerkleTree } from 'merkletreejs'
import { sha256 } from './index.js'

export function isEqual(tree1, tree2) {
    return tree2.getRoot().toString('hex') === tree1.getRoot().toString('hex')
}

export function createMerkleTree(arr) {
    if (!Array.isArray(arr)) {
        console.error(
            `createMerkleTree принимает единственный параметр arr типа Array, а получил типа ${typeof arr}`.italic.bold
                .red,
        )
        return new MerkleTree(new Array())
    }
    return new MerkleTree(arr.map(String), sha256)
}
