import { CreateCoin, CreateWallet, Transition } from "./index.js";

const blockTypes = {
    transition: Transition,
    creteWallet: CreateWallet,
    createCoin: CreateCoin
}

export default blockTypes