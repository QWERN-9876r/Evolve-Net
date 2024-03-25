export const haveKeys = (data, keys) => {
    for (const [key, value] of Object.entries(data)) if (typeof value !== keys[key]) return false
    return true
}
