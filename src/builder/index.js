export default class {
  constructor (graph) {
    this._graph = graph
    this._code = {
      _metadata: [
        { attr: 'imports', name: 'Imports', silent: true },
        { attr: 'init', name: 'Initialize Mininet' },
        { attr: 'nodes', name: 'Add nodes' },
        { attr: 'links', name: 'Add links' },
        { attr: 'ports', name: 'Add interfaces' },
        { attr: 'build', name: 'Build the network' },
        { attr: 'startControllers', name: 'Start controllers' },
        { attr: 'startSwitches', name: 'Start switches' },
        { attr: 'cli', name: 'Start CLI' },
        { attr: 'finish', name: 'Finish' },
        { attr: 'log', name: 'Log', silent: true }
      ],
      toString () {
        const code = [
          '#!/usr/bin/env python2',
          '# -*- coding: utf-8 -*-',
          ''
        ]

        this._metadata.forEach(({ attr, name, silent }) => {
          const arr = this[attr]
          if (arr.length) {
            code.push(
              `# ${name} {{{`,
              '',
              ...(silent ? [] : [
                `info('\\n*** ${name}\\n')`,
                ''
              ]),
              ...arr,
              '',
              '# }}}'
            )
          }
        })

        code.push(
          '',
          '# vim:fdm=marker',
          ''
        )

        return code.join('\n')
      },
      imports: [
        'from mininet.net import Mininet',
        'from mininet.cli import CLI',
        'from mininet.link import TCLink',
        'from mininet.log import setLogLevel, info',
        'import mininet.node'
      ],
      init: [
        'setLogLevel(\'info\')',
        'net = Mininet(topo=None, build=False, controller=mininet.node.RemoteController, link=TCLink)'
      ],
      nodes: [],
      links: [],
      ports: [],
      build: [
        'net.build()'
      ],
      startControllers: [],
      startSwitches: [],
      cli: [
        'CLI(net)'
      ],
      finish: [
        'net.stop()'
      ],
      log: []
    }
  }
  build () {
    Object.values(this._graph.items).forEach(item => {
      try {
        switch (item.type) {
          case 'controller':
            this._addController(item)
            break
          case 'host':
            this._addHost(item)
            break
          case 'link':
            this._addLink(item)
            break
          case 'port':
            this._addPort(item)
            break
          case 'switch':
            this._addSwitch(item)
            break
        }
      } catch (_error) {
        this._code.log.push(
          item != null && item.type !== null && item.id !== null
            ? `# Failed to add ${item.type}/${item.hostname} (${item.id}).`
            : `# Malformed item (${Object.entries(this._graph.items).find(([_, v]) => v === item)[0]}).`
        )
      }
    })

    return this._code.toString()
  }
  testVersion () {
    switch (this._graph.version) {
      case 0:
        console.warn('Development version of graph, proceed with caution.')
        break
      default:
        throw new TypeError('Unsupported version of graph.')
    }
  }

  _addController (controller) {
    const args = [
      `'${controller.hostname}'`,
      ...(controller.controllerType ? [`controller=mininet.node.${controller.controllerType}`] : []),
      ...(controller.ip ? [`ip='${controller.ip}'`] : []),
      ...(controller.port ? [`port=${controller.port}`] : [])
    ]
    this._code.nodes.push(`${controller.hostname} = net.addController(${args.join(', ')})`)
    this._code.startControllers.push(`${controller.hostname}.start()`)
  }
  _addHost (host) {
    const args = [
      `'${host.hostname}'`,
      'ip=None',
      ...(host.defaultRoute ? [`defaultRoute='via ${host.defaultRoute}'`] : [])
    ]
    this._code.nodes.push(`${host.hostname} = net.addHost(${args.join(', ')})`)
  }
  _addLink (link) {
    const fromPort = this._graph.items[link.from]
    const toPort = this._graph.items[link.to]

    const fromNode = this._portToNode(fromPort)
    const toNode = this._portToNode(toPort)

    const fromDev = `${fromNode.hostname}-${fromPort.hostname}`
    const toDev = `${toNode.hostname}-${toPort.hostname}`

    const args = [
      fromNode.hostname,
      toNode.hostname,
      `intfName1='${fromDev}'`,
      `intfName2='${toDev}'`,
      ...(link.bandwidth == null ? [] : [`bw=${link.bandwidth}`]),
      ...(link.delay == null ? [] : [`delay='${link.delay}ms'`]),
      ...(link.loss == null ? [] : [`loss=${link.loss}`]),
      ...(link.maxQueueSize == null ? [] : [`max_queue_size=${link.maxQueueSize}`]),
      ...(link.jitter == null ? [] : [`jitter='${link.jitter}ms'`])
    ]

    this._code.links.push(`net.addLink(${args.join(', ')})`)
  }
  _addPort (port) {
    const node = this._portToNode(port)
    const dev = `${node.hostname}-${port.hostname}`

    ;(port.ips || []).forEach((ip, i) => {
      this._code.ports.push(
        ...(i === 0 ? [
          `${node.hostname}.intf('${dev}').ip = '${ip.split('/')[0]}'`,
          `${node.hostname}.intf('${dev}').prefixLen = ${ip.split('/')[1]}`
        ] : []),
        `${node.hostname}.cmd('ip a a ${ip} dev ${dev}')`
      )
    })
  }
  _addSwitch (swtch) {
    const args = [
      `'${swtch.hostname}'`,
      ...(swtch.switchType ? [`cls=mininet.node.${swtch.switchType}`] : [])
    ]
    const controllerHostnames = this._getNeighbors(swtch, ['controller'])
      .map(controller => controller.hostname)
    this._code.nodes.push(`${swtch.hostname} = net.addSwitch(${args.join(', ')})`)
    this._code.startSwitches.push(`${swtch.hostname}.start([${controllerHostnames.join(', ')}])`)
  }
  _portToNode (port) {
    return this._getNeighbors(port, ['host', 'switch'])[0]
  }
  _getNeighbors (node, types) {
    const nodes = new Set()
    this._getNodesAssocs(node)
      .forEach(assoc => {
        this._getEdgesNodes(assoc)
          .forEach(node => nodes.add(node))
      })

    return [...nodes].filter(n => n !== node && types.indexOf(n.type) >= 0)
  }
  _getNodesAssocs (node) {
    return Object.values(this._graph.items)
      .filter(item => item.type === 'association' && (
        item.from === node.id ||
        item.to === node.id
      ))
  }
  _getEdgesNodes (edge) {
    return [this._graph.items[edge.from], this._graph.items[edge.to]]
  }
}
