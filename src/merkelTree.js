import { MerkleTree } from "merkletreejs"
import { sha256 } from "./index.js"

export function isEqual(tree1, tree2) {
  return tree2.getRoot().toString('hex') === tree1.getRoot().toString('hex')
}

export function createMerkleTree(blockChain) {
  return new MerkleTree(blockChain.blocks.map(block => sha256(String(block))), sha256)
}