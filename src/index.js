const resolveProvider = (Provider, config) => {
    debug(Provider)
    switch (typeof Provider) {
        case 'object':
            return Provider
        case 'function':
            return new Provider(config)
        case 'string':
        default:
            const Instance = require(`butter-provider-${Provider}`)
            return new Instance(config)
    }
}

const actionKeys = [
    'FETCH', 'DETAIL', 'RANDOM', 'UPDATE'
]

const makeActionTypes = ({config, id}, creators) => {
    const actionKeys = Object.keys(creators)
    const upperName = id.toUpperCase()

    return actionKeys.reduce((actionTypes, type) => (
        Object.assign(actionTypes, {
            [type]: `BUTTER/PROVIDERS/${upperName}/${type}`
        })
    ), {})
}
