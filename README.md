# Butter Sagas Provider
Create sagas for a butter provider,

this is an adapter,

``` javascript
const createSagaMiddleware = require('redux-saga')
const createStore = require('redux')
const SagasAdapter = require('butter-sagas-provider')
const adapter = SagasAdapter('butter-provider-youtube')

const sagaMiddleware = createSagaMiddleware()

const store = createStore([sagaMiddleware])
adapter.sagas.map(sagaMiddleware.run)

store.dispatch(adapter.actions.FETCH.START())
```


