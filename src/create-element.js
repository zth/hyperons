function createElement(type, props, ...children) {
  props = props || {}

  props.children = children.length === 0 && props.children ? props.children : children

  return { type, props }
}

export default createElement
