export const haveKeys = (type, data, keys, errForKeys, errForTypes) => {
    if (!(data instanceof Object) || Object.keys(data).sort().join('') !== Object.keys(keys).sort().join(''))
        throw new Error(errForKeys || `block with type ${type} must has keys ${Object.keys(keys).join(', ')}`)

    for (const [key, value] of Object.entries(data))
        if (typeof value !== keys[key]) throw new Error(errForTypes || `error in types data ${type} block`)
}
