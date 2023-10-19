import stringifyStyles from './stringify-styles'
import escapeString from './escape-string'
import Fragment from './fragment'
import dispatcher from './dispatcher'

const ATTR_ALIASES = {
  acceptCharset: 'acceptcharset',
  accessKey: 'accesskey',
  allowFullScreen: 'allowfullscreen',
  autoCapitalize: 'autocapitalize',
  autoComplete: 'autocomplete',
  autoCorrect: 'autocorrect',
  autoFocus: 'autofocus',
  autoPlay: 'autoplay',
  charSet: 'charset',
  className: 'class',
  colSpan: 'colspan',
  contentEditable: 'contenteditable',
  crossOrigin: 'crossorigin',
  dateTime: 'datetime',
  defaultChecked: 'checked',
  defaultSelected: 'selected',
  defaultValue: 'value',
  htmlFor: 'for',
  httpEquiv: 'http-equiv',
  longDesc: 'longdesc',
  maxLength: 'maxlength',
  minLength: 'minlength',
  noModule: 'nomodule',
  noValidate: 'novalidate',
  readOnly: 'readonly',
  referrerPolicy: 'referrerpolicy',
  rowSpan: 'rowspan',
  spellCheck: 'spellcheck',
  tabIndex: 'tabindex',
  useMap: 'usemap'
}

// <https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes>
const BOOLEAN_ATTRS = new Set([
  'async',
  'allowfullscreen',
  'allowpaymentrequest',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'ismap',
  'multiple',
  'muted',
  'novalidate',
  'nowrap',
  'open',
  'readonly',
  'required',
  'reversed',
  'selected'
])

// https://www.w3.org/TR/html/syntax.html#void-elements
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
])

const EMPTY_OBJECT = Object.freeze({})

function renderToString(element, context = {}, controller) {
  // TODO nullify and only allow in functional components
  dispatcher.context = context

  if (typeof element === 'string') {
    return controller.content.push(escapeString(element))
  } else if (typeof element === 'number') {
    return controller.content.push(String(element))
  } else if (typeof element === 'boolean' || element == null) {
    return
  } else if (Array.isArray(element)) {
    return controller.content
      .push(element.map((e) => renderToString(e, context, controller)))
      .join('')
  } else if (element instanceof Promise) {
    return controller.handleAsync(element, context, controller)
  }

  const type = element.type

  if (type) {
    const props = element.props || EMPTY_OBJECT

    if (type.contextRef) {
      context = Object.assign({}, context, { [type.contextRef.id]: props.value })
      if (type.contextRef.id === 'errorBoundary') {
        try {
          return controller.content.push(renderToString(type(props), context, controller))
        } catch (e) {
          return controller.content.push(
            renderToString(context['errorBoundary'](e), context, controller)
          )
        }
      }
    }

    if (typeof type === 'function') {
      return renderToString(type(props), context, controller)
    }

    if (type === Fragment) {
      return renderToString(props.children, context, controller)
    }

    if (typeof type === 'string') {
      let html = `<${type}`

      let innerHTML

      for (const prop in props) {
        const value = props[prop]

        if (prop === 'children' || prop === 'key' || prop === 'ref') {
          // Why not use a continue statement? It's slower ¯\_(ツ)_/¯
        } else if (prop === 'class' || prop === 'className') {
          // This condition is here because it is the most common attribute
          // and short-circuiting results in a ~5% performance boost.
          html += value ? ` class="${escapeString(value)}"` : ''
        } else if (prop === 'style') {
          html += ` style="${stringifyStyles(value)}"`
        } else if (prop === 'dangerouslySetInnerHTML') {
          innerHTML = value.__html
        } else {
          const name = ATTR_ALIASES[prop] || prop

          if (BOOLEAN_ATTRS.has(name)) {
            html += value ? ` ${name}` : ''
          } else if (typeof value === 'string') {
            html += ` ${name}="${escapeString(value)}"`
          } else if (typeof value === 'number') {
            html += ` ${name}="${String(value)}"`
          } else if (typeof value === 'boolean') {
            html += ` ${name}="${value}"`
          }
        }
      }

      if (VOID_ELEMENTS.has(type)) {
        html += '/>'
        return controller.content.push(html)
      } else {
        html += '>'

        if (innerHTML) {
          html += innerHTML
          controller.content.push(html)
        } else {
          controller.content.push(html)
          renderToString(props.children, context, controller)
        }

        controller.content.push(`</${type}>`)
      }

      return
    }
  }
}

function makeController() {
  const content = []

  const controller = {
    content,
    hasAsync: false,
    handleAsync(promise, context, controller) {
      this.hasAsync = true
      content.push({ promise, context, controller })
    }
  }

  return controller
}
async function renderController(controller) {
  if (controller.hasAsync) {
    return (
      await Promise.all(
        controller.content.map(async (item) => {
          if (item == null) return ''
          if (typeof item === 'string') return item
          const controller = makeController()
          const element = await item.promise
          renderToString(element, item.context, controller)
          return await renderController(controller)
        })
      )
    ).join('')
  } else {
    return controller.content.join('')
  }
}

async function render(element) {
  const controller = makeController()
  renderToString(element, {}, controller)
  return await renderController(controller)
}

export default render
