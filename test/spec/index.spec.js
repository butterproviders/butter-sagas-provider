import expect from 'expect'

import {createStore, applyMiddleware} from 'redux'
import createSagaMiddleware, { runSaga } from 'redux-saga'
import { select, take, put, call } from 'redux-saga/effects'
import configureMockStore from 'redux-mock-store'

import SimpleCache from 'cache-base'
import ButterMockProvider from 'butter-mock-provider'

import reduxProviderAdapter, { actionKeys, callToAPI } from '../../src'
const debug = require('debug')('butter-saga-provider:test')

const payloads = {
    FETCH: {filters: {}},
    DETAIL: {id: 42},
    RANDOM: {},
    UPDATE: {}
}

const TIMEOUT = 1000

describe('butter-redux-provider', () => {
  let MockProviderInstance

  beforeEach(() => {
    MockProviderInstance = new ButterMockProvider()
  })

  const checkReduxProvider = (Provider, name) => {
    const {
      provider, actions
    } = Provider

    expect(provider).toBeTruthy()
    actionKeys.forEach(key => expect(actions).toHaveProperty(key))

    expect(provider.config.name).toEqual(name)
  }

  describe('loading', () => {
      it('loads a provider by name', () => {
          checkReduxProvider(reduxProviderAdapter('vodo'), 'vodo')
      })

      it('loads a provider by instance', () => {
          checkReduxProvider(reduxProviderAdapter(ButterMockProvider), 'mock')
      })

      it('loads a provider by instanciated object', () => {
          checkReduxProvider(reduxProviderAdapter(MockProviderInstance), 'mock')
      })
  })

  describe('sagas', () => {
      const mockProviderInstance = new ButterMockProvider()
      const cache = new SimpleCache()
      const reduxProvider = reduxProviderAdapter(mockProviderInstance, cache)

      actionKeys.forEach(key => {
          const saga = reduxProvider.sagas[key]
          const actions = reduxProvider.actions[key]

          it(`saga for ${key}`, () => {
              // we do this this way to ensure we always have the API implemented properly
              const gen = saga()              
              expect(gen.next(actions.START).value)
                  .toEqual(take(actions.START))
              gen.next(actions.START(payloads[key]))
          })
      })
  })
    
  describe('actions', () => {
      let sagaMiddleware
      let mockStore
      
      const cache = new SimpleCache()
      const mockProviderInstance = new ButterMockProvider()
      const reduxProvider = reduxProviderAdapter(mockProviderInstance, cache)
      const actions = reduxProvider.actions
      const results = {
          FETCH: [
              actions.FETCH.START(payloads.FETCH), 
              actions.FETCH.SUCCESS({
                  results: Object.values(mockProviderInstance.mockData),
                  hasMore: false
              })
          ], 
          DETAIL: [
              actions.DETAIL.START(payloads.DETAIL), 
              actions.DETAIL.SUCCESS(mockProviderInstance.mockData[42])
          ],
          RANDOM: [
              actions.RANDOM.START(payloads.RANDOM),
              actions.RANDOM.SUCCESS(mockProviderInstance.mockData[42])
          ],
          UPDATE: [
              actions.UPDATE.START(payloads.UPDATE),
              actions.UPDATE.SUCCESS(Object.values(mockProviderInstance.mockData))
          ]
      }

      beforeEach(() => {
          sagaMiddleware = createSagaMiddleware()
          mockStore = configureMockStore([sagaMiddleware])

      })

      actionKeys.forEach(key => {
          it(`full saga for ${key}`, (done) => {
              const store = mockStore({ids: {}})

              sagaMiddleware.run(reduxProvider.sagas[key])
              store.dispatch(reduxProvider.actions[key].START(payloads[key]))
              debug(key, store.getState())
              debug('actions', store.getActions())

              setTimeout(() => { // return of async actions
                  const actions = store.getActions()

                  expect(actions).toEqual(results[key])
                  done()
              }, TIMEOUT)
          })

      })
  })
})
