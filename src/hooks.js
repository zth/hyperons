import dispatcher from './dispatcher'

export function useContext(instance) {
  return instance.getChildContext(dispatcher.context)
}
