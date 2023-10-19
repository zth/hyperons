let id = 0
class Context {
  constructor(defaultValue, forceId) {
    this.id = forceId != null ? forceId : id++
    this.defaultValue = defaultValue

    this.Provider = this.Provider.bind(this)

    this.Provider.contextRef = this
  }

  getChildContext(context) {
    return Object.hasOwnProperty.call(context, this.id) ? context[this.id] : this.defaultValue
  }

  Provider(props) {
    return props.children
  }
}

export default function createContext(defaultValue, forceId) {
  return new Context(defaultValue, forceId)
}
