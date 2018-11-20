import Code from './Code'
import Items from './Items'

export default class {
  constructor (data) {
    this.log = []

    this._devnames = Object.create(null)
    this._hostnames = new Set()
    this._linked = new Set()

    this._data = data
    this._items = new Items(data.items)
    this._code = new Code()
  }
  build () {
    [
      // Nodes (stop on hostname conflict)
      { items: this._items.arr.controller, method: this._addController.bind(this) },
      { items: this._items.arr.host, method: this._addHost.bind(this) },
      { items: this._items.arr.switch, method: this._addSwitch.bind(this) },

      // Interfaces (stop on devname conflict)
      { items: this._items.arr.port, method: this._addPort.bind(this) },

      // Links
      { items: this._items.arr.link, method: this._addLink.bind(this) }
    ].forEach(({ items, method }) => {
      items.forEach(item => {
        try {
          method(item)
        } catch (error) {
          if (error instanceof SyntaxError && error.message === 'Hostname collision.') {
            const hostname = item.hostname
            ;[
              ...this._items.arr.controller,
              ...this._items.arr.host,
              ...this._items.arr.switch
            ].filter(node => node.hostname === hostname)
              .forEach(node =>
                this._log(
                  `Failed to add ${node.type}/${node.hostname}: conflicting hostname.`,
                  'error',
                  node
                )
              )
          } else if (error instanceof SyntaxError && error.message === 'Devname collision.') {
            const { devname, ports } = error.payload
            ports.forEach(port =>
              this._log(
                `Failed to add ${port.type}/${port.hostname}: conflicting interface name ${devname}.`,
                'error',
                port
              )
            )
          } else if (error instanceof SyntaxError && error.message === 'Multiple links per port.') {
            const { port } = error.payload
            this._log(
              `Failed to add ${port.type}/${port.hostname}: single port has multiple links.`,
              'error',
              port
            )
          } else if (error instanceof SyntaxError && error.message === 'Physical port connected to a link.') {
            const { port } = error.payload
            this._log(
              `Failed to add ${port.type}/${port.hostname}: port can't be both physical and connected to a link.`,
              'error',
              port
            )
          } else {
            console.error(error)
            this._log(
              item != null && item.type !== null && item.id !== null
                ? `Failed to add ${item.type}/${item.hostname}.`
                : `Malformed item (${this._items.arr.$all.find(v => v === item)}).`,
              'error',
              item
            )
          }

          throw new Error('Script building failure.')
        }
      })
    })

    if (this._data.script) {
      this._addScript(this._data.script)
    }

    // Mininet arguments
    this._code.mininetArgs.push(...[
      ...(this._data.autoSetMAC != null ? [`autoSetMacs=${this._data.autoSetMAC ? 'True' : 'False'}`] : []),
      ...(this._data.autoStaticARP != null ? [`autoStaticArp=${this._data.autoStaticARP ? 'True' : 'False'}`] : []),
      ...(this._data.inNamespace != null ? [`inNamespace=${this._data.inNamespace ? 'True' : 'False'}`] : []),
      ...(this._data.ipBase != null ? [`ipBase='${this._data.ipBase}'`] : []),
      ...(this._data.listenPortBase != null ? [`listenPort=${this._data.listenPortBase}`] : []),
      ...(this._data.spawnTerminals != null ? [`xterms=${this._data.spawnTerminals ? 'True' : 'False'}`] : [])
    ])

    return this._code.toString()
  }

  _addScript (script) {
    this._code.globalCmds.push(
      ...this._scriptToCmds(script)
    )
  }

  _addController (controller) {
    this._addHostname(controller)

    const args = [
      `'${controller.hostname}'`,
      ...(controller.controllerType != null ? [`controller=mininet.node.${controller.controllerType}`] : []),
      ...(controller.ip != null ? [`ip='${controller.ip}'`] : []),
      ...(controller.port != null ? [`port=${controller.port}`] : []),
      ...(controller.protocol != null ? [`protocol='${controller.protocol}'`] : [])
    ]
    this._code.nodes.push(`${controller.hostname} = net.addController(${args.join(', ')})`)
    this._code.startControllers.push(`${controller.hostname}.start()`)
  }
  _addHost (host) {
    this._addHostname(host)

    const args = [
      `'${host.hostname}'`,
      'ip=None',
      ...(host.defaultRoute != null ? [`defaultRoute='via ${host.defaultRoute}'`] : [])
    ]
    this._code.nodes.push(`${host.hostname} = net.addHost(${args.join(', ')})`)

    if (host.script) {
      this._code.nodeCmds.push(
        ...this._scriptToCmds(host.script, host.hostname)
      )
    }
  }
  _addLink (link) {
    const fromPort = this._items.map.port[link.from]
    const toPort = this._items.map.port[link.to]

    this._addLinkedPort(fromPort)
    this._addLinkedPort(toPort)

    const fromNode = this._portToNode(fromPort)
    const toNode = this._portToNode(toPort)

    const fromDev = `${fromNode.hostname}-${fromPort.hostname}`
    const toDev = `${toNode.hostname}-${toPort.hostname}`

    const args = [
      fromNode.hostname,
      toNode.hostname,
      `intfName1='${fromDev}'`,
      `intfName2='${toDev}'`,
      ...(link.bandwidth != null ? [`bw=${link.bandwidth}`] : []),
      ...(link.delay != null ? [`delay='${link.delay}'`] : []),
      ...(link.loss != null ? [`loss=${link.loss}`] : []),
      ...(link.maxQueueSize != null ? [`max_queue_size=${link.maxQueueSize}`] : []),
      ...(link.jitter != null ? [`jitter='${link.jitter}'`] : [])
    ]

    this._code.links.push(`net.addLink(${args.join(', ')})`)
  }
  _addPort (port) {
    const node = this._portToNode(port)
    if (!node) {
      this._log(
        `Skipping ${port.type}/${port.hostname}: not connected to any node.`,
        'info',
        port
      )
      return
    }
    const link = port.$links[0]
    if (!link && !port.physical) {
      this._log(
        `Skipping ${port.type}/${port.hostname}: port has to be either physical or connected to a link.`,
        'info',
        port
      )
      return
    }
    if (link && port.physical) {
      const error = new SyntaxError('Physical port connected to a link.')
      error.payload = { port }
      throw error
    }

    const dev = port.physical
      ? port.hostname
      : `${node.hostname}-${port.hostname}`

    this._addDevname(port, dev)

    if (!link) {
      const args = [
        `'${dev}'`,
        `node=${node.hostname}`
      ]
      this._code.ports.push(`mininet.link.Intf(${args.join(', ')})`)
    }

    ;(port.ips || []).forEach((ip, i) => {
      this._code.ips.push(
        ...(i === 0 ? [
          `${node.hostname}.intf('${dev}').ip = '${ip.split('/')[0]}'`,
          `${node.hostname}.intf('${dev}').prefixLen = ${ip.split('/')[1]}`
        ] : []),
        `${node.hostname}.cmd('ip a a ${ip} dev ${dev}')`
      )
    })
  }
  _addSwitch (swtch) {
    this._addHostname(swtch)

    const args = [
      `'${swtch.hostname}'`,
      ...(swtch.batch != null ? [`batch=${swtch.batch ? 'True' : 'False'}`] : []),
      ...(swtch.datapath != null ? [`datapath='${swtch.datapath}'`] : []),
      ...(swtch.dpctlPort != null ? [`port=${swtch.dpctlPort}`] : []),
      ...(swtch.dpid != null ? [`dpid='${swtch.dpid}'`] : []),
      ...(swtch.dpopts != null ? [`dpopts='${swtch.dpopts}'`] : []),
      ...(swtch.failMode != null ? [`failMode='${swtch.failMode}'`] : []),
      ...(swtch.inNamespace != null ? [`inNamespace=${swtch.inNamespace ? 'True' : 'False'}`] : []),
      ...(swtch.inband != null ? [`inband=${swtch.inband ? 'True' : 'False'}`] : []),
      ...(swtch.ip != null ? [`ip='${swtch.ip}'`] : []),
      ...(swtch.opts != null ? [`opts='${swtch.opts}'`] : []),
      ...(swtch.protocol != null ? [`protocols='${swtch.protocol}'`] : []),
      ...(swtch.reconnectms != null ? [`reconnectms=${swtch.reconnectms}`] : []),
      ...(swtch.stp != null ? [`stp=${swtch.stp ? 'True' : 'False'}`] : []),
      ...(swtch.stpPriority != null ? [`prio=${swtch.stpPriority}`] : []),
      ...(swtch.switchType != null ? [`cls=mininet.node.${swtch.switchType}`] : []),
      ...(swtch.verbose != null ? [`verbose=${swtch.verbose ? 'True' : 'False'}`] : [])
    ]
    const controllerHostnames = this._getNeighbors(swtch, ['controller'])
      .map(controller => controller.hostname)
    this._code.nodes.push(`${swtch.hostname} = net.addSwitch(${args.join(', ')})`)
    this._code.startSwitches.push(`${swtch.hostname}.start([${controllerHostnames.join(', ')}])`)

    if (swtch.script) {
      this._code.nodeCmds.push(
        ...this._scriptToCmds(swtch.script, swtch.hostname)
      )
    }
  }

  _portToNode (port) {
    return this._getNeighbors(port, ['host', 'switch'])[0]
  }
  _getNeighbors (node, types) {
    const nodes = new Set()
    node.$associations
      .forEach(assoc => {
        assoc.$nodes
          .forEach(node => nodes.add(node))
      })

    return [...nodes].filter(n => n !== node && types.indexOf(n.type) >= 0)
  }
  _addHostname (item) {
    const hostname = item.hostname
    if (this._hostnames.has(hostname)) {
      throw new SyntaxError('Hostname collision.')
    } else {
      this._hostnames.add(hostname)
    }
  }
  _addDevname (port, devname) {
    if (this._devnames[devname]) {
      const error = new SyntaxError('Devname collision.')
      error.payload = {
        devname,
        ports: [this._devnames[devname], port]
      }
      throw error
    } else {
      this._devnames[devname] = port
    }
  }
  _addLinkedPort (port) {
    if (this._linked.has(port)) {
      const error = new SyntaxError('Multiple links per port.')
      error.payload = { port }
      throw error
    } else {
      this._linked.add(port)
    }
  }

  _scriptToCmds (script, nodeVar) {
    return script.split('\n')
      .filter(line => !/^(#|$)/.test(line))
      .map(line => [
        `debug('${nodeVar || '[mininet]'}> ${line}\\n')`,
        nodeVar
          ? `${nodeVar}.cmdPrint('${line}')`
          : `cli.onecmd('${line}')`
      ])
      .reduce((acc, val) => acc.concat(val), [])
  }

  _log (msg, severity, item) {
    this._code.log.push(msg.replace(/^(.*)$/gm, '# $1'))
    this.log.push({ item, severity, msg })
  }
}
