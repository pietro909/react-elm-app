import React, { Component } from 'react'

const bootstrapElm = (elmApp, node, flags = {}) =>
  new Promise(resolve => {
    const app = elmApp.embed(node, flags)
    requestAnimationFrame(() => resolve(app))
  })

/* eslint-disable no-console */
const genericLogger = logger => (label, data) => {
  console.group(label)
  if (typeof data === 'object' && typeof data.forEach === 'function') {
    data.forEach(a => logger(a))
  } else {
    logger(data)
  }
  console.groupEnd()
}
/* eslint-enable no-console */

const checkPorts = (expected, actual) => {
	const orphans = actual.slice(0)
	const rest = expected.reduce((acc, p) => {
		const index = orphans.indexOf(p)
		if (index > -1) {
			orphans.splice(index, 1)
			return acc
		}
		return [ p, ...acc]
	}, [])
	if (rest.length > 0) {
		console.error(
			`Port(s) not found: ${rest.join(',')}
		`)
	}
	if (orphans.length > 0) {
		console.error(
			`Unknown ports: ${orphans.join(',')}
		`)
	}
}

const noop = () => null

const appWithElm = Elm =>
  ({
    appName,
    startMessage,
    debug,
    expectedPorts,
    htmlNode,
    initPortName,
  }) => (WrappedComponent) => {
    /* eslint-disable no-console */
    const log = debug ? genericLogger(console.log) : noop
    const warn = debug ? genericLogger(console.warn) : noop
    /* eslint-enable no-console */

    return class extends Component {
      constructor(props) {
        super(props)
        this.state = {
          ports: {},
          ready: false,
          incoming: {},
          outgoing: {},
        }
        const elmApp = Elm[appName]

        if (!elmApp) {
          throw new TypeError(`The application ${appName} can't be found!`)
        }

        bootstrapElm(elmApp, htmlNode).then(app => {
          const portsOut = []
          const portsIn = []
          Object.keys(app.ports).forEach(portId => {
            const port = app.ports[portId]
            if (port.subscribe) {
              if (portId === initPortName) {
                const callback = data =>
                  /* eslint-disable no-undef */
                  requestAnimationFrame(() => {
                  /* eslint-enable no-undef */
                  log(`receive ${portId}`, data)
                  this.setState(() => ({
                    ports: app.ports,
                      ready: true,
                  }))
                  port.unsubscribe(callback)
                })
                port.subscribe(callback)
                return
              }
							portsOut.push(portId)
							port.subscribe(data => this.setState(() => {
								log(`receive ${portId}`, data)
								return {
									incoming: {
										...this.state.incoming,
										[portId]: data,
									},
								}
							}))
            } else if (port.send) {
              portsIn.push(portId)
              this.setState(() => ({
                outgoing: {
                  ...this.state.outgoing,
                  [portId]: (...args) => {
                    log(`send ${portId}`, args)
                    port.send(...args)
                  },
                },
              }))
            }
          })

          log('Outgoing ports', portsOut)
          log('Incoming ports', portsIn)

					checkPorts(expectedPorts.in, portsOut)
					checkPorts(expectedPorts.out, portsIn)
        })
      }

      render() {
        if (this.state.ready) {
          return (
            <WrappedComponent
              ports={this.state.ports}
              incoming={this.state.incoming}
              outgoing={this.state.outgoing}
            />
          )
        }
        return (<div>Loading...</div>)
      }
    }
  }

export default appWithElm
