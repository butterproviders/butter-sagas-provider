import { select, take, put, call, cancelled } from 'redux-saga/effects'
import { createAction } from 'redux-actions'

const debug = require('debug')('butter-sagas-provider')

const resolveProvider = (Provider, config) => {
    //    debug(Provider)
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

export const actionKeys = [
    'FETCH', 'DETAIL', 'RANDOM', 'UPDATE'
]

export const asyncActionKeys = [
    'START', 'ERROR', 'FAILED', 'SUCCESS', 'END'
]

const asyncActions = (actionCreator) => ({
    START: actionCreator,
    ERROR: undefined,
    FAILED: undefined,
    SUCCESS: undefined,
    END: undefined
})

const makeActions = ({config, id}) => {
    const upperName = id.toUpperCase()

    return actionKeys.reduce((acc, action) => ({
        ...acc,
        [action]: asyncActionKeys.reduce((acc, cur) => Object.assign({}, acc, {
            [cur]: createAction(`BUTTER/PROVIDERS/${upperName}/${action}/${cur}`)
        }), {})
    }), {})
}

export function* callToAPI(actions, method, ...args) {
    let result
    try {
        result = yield call(method, ...args)
    } catch (e) {
        yield put(actions.ERROR(e))
    } finally {
        if (yield cancelled()) {
            yield put(actions.FAILED())
        } else {
            yield put(actions.SUCCESS(result))
        }
        debug('callToAPI finished', actions.START())
    }
}

export default (providerArg, cache, config = {}) => {
    const provider = resolveProvider(providerArg, config)
    const actions = makeActions(provider)

    function* FETCH() {
        while (true) {
            const {payload} = yield take(actions.FETCH.START)
            const filters = {page: 0, limit: 10, ...payload}
            yield call(callToAPI, actions.FETCH, provider.fetch, filters)
        }
    }

    function* DETAIL() {
        while (true) {
            const {payload} = yield take(actions.DETAIL.START)
            yield callToAPI(actions.DETAIL, provider.detail, payload.id, payload)
        }
    }

    function* RANDOM() {
        while (true) {
            const {payload} = yield take(actions.RANDOM.START)
            yield callToAPI(actions.RANDOM, provider.random)
        }
    }


    function* UPDATE() {
        while (true) {
            const {payload} = yield take(actions.UPDATE.START)
            yield callToAPI(actions.UPDATE, provider.update)
        }
    }

    return {
        provider,
        actions,
        sagas: {
            FETCH,
            DETAIL,
            RANDOM,
            UPDATE
        }
    }
}
