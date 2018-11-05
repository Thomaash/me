const metadata = [
  { attr: 'imports', name: 'Imports', silent: true },
  { attr: 'init', name: 'Initialize Mininet' },
  { attr: 'nodes', name: 'Add nodes' },
  { attr: 'links', name: 'Add links' },
  { attr: 'ports', name: 'Add interfaces' },
  { attr: 'build', name: 'Build the network' },
  { attr: 'startControllers', name: 'Start controllers' },
  { attr: 'startSwitches', name: 'Start switches' },
  { attr: 'cmds', name: 'Run commands' },
  { attr: 'cli', name: 'Start CLI' },
  { attr: 'finish', name: 'Finish' },
  { attr: 'log', name: 'Log', silent: true }
]

export default class {
  constructor () {
    this.imports = [
      'from mininet.net import Mininet',
      'from mininet.cli import CLI',
      'from mininet.link import TCLink',
      'from mininet.log import setLogLevel, info, debug',
      'import mininet.node'
    ]
    this.init = [
      'setLogLevel(\'info\')',
      'net = Mininet(topo=None, build=False, controller=mininet.node.RemoteController, link=TCLink)',
      'cli = CLI(net, script=\'/dev/null\')'
    ]
    this.nodes = []
    this.links = []
    this.ports = []
    this.build = [
      'net.build()'
    ]
    this.startControllers = []
    this.startSwitches = []
    this.cmds = []
    this.cli = [
      'cli.run()'
    ]
    this.finish = [
      'net.stop()'
    ]
    this.log = []
  }

  toString () {
    const code = []
    metadata.forEach(({ attr, name, silent }) => {
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

    return [
      '#!/usr/bin/env python2',
      '# -*- coding: utf-8 -*-',
      '',
      ...code,
      '',
      '# vim:fdm=marker',
      ''
    ].join('\n')
  }
}
