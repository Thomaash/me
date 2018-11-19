const metadata = [
  { attr: 'imports', name: 'Imports', silent: true },
  { attr: 'init', name: 'Initialize Mininet' },
  { attr: 'nodes', name: 'Add nodes' },
  { attr: 'links', name: 'Add links' },
  { attr: 'ports', name: 'Add interfaces' },
  { attr: 'ips', name: 'Add IP addresses' },
  { attr: 'build', name: 'Build the network' },
  { attr: 'startControllers', name: 'Start controllers' },
  { attr: 'startSwitches', name: 'Start switches' },
  { attr: 'nodeCmds', name: 'Run node commands' },
  { attr: 'globalCmds', name: 'Run global commands' },
  { attr: 'cli', name: 'Start CLI' },
  { attr: 'finish', name: 'Finish' },
  { attr: 'log', name: 'Log', silent: true }
]

export default class {
  constructor () {
    this.imports = [
      'from mininet.cli import CLI',
      'from mininet.log import setLogLevel, info, debug',
      'from mininet.net import Mininet',
      'import mininet.link',
      'import mininet.node'
    ]
    this.init = [
      'setLogLevel(\'info\')',
      () => `net = Mininet(${this.mininetArgs.join(', ')})`,
      'cli = CLI(net, script=\'/dev/null\')'
    ]
    this.build = [
      'net.build()'
    ]
    this.cli = [
      'cli.run()'
    ]
    this.finish = [
      'net.stop()'
    ]

    // Init empty arrays
    metadata.forEach(({ attr }) => {
      if (!this[attr]) {
        this[attr] = []
      }
    })

    // Helpers
    this.mininetArgs = [
      'build=False',
      'controller=mininet.node.RemoteController',
      'link=mininet.link.TCLink',
      'topo=None'
    ]
  }

  toString () {
    const code = []
    metadata.forEach(({ attr, name, silent }) => {
      const arr = this[attr]
        .map(v => v.apply ? v.apply() : v)

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
