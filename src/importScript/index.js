import antlr4 from 'antlr4'
import { Python2Lexer } from './generated/Python2Lexer'
import { Python2Parser } from './generated/Python2Parser'
import { Python2Listener } from './generated/Python2Listener'

function parse (input) {
  const chars = new antlr4.InputStream(input)
  const lexer = new Python2Lexer(chars)
  const tokens = new antlr4.CommonTokenStream(lexer)
  const parser = new Python2Parser(tokens)
  parser.buildParseTrees = true
  return parser.file_input()
}

function delQuotes (str) {
  return str.substr(1, str.length - 2)
}

function fixNextHostDev (set, hostDev) {
  let [host, dev] = hostDev.split('-')
  if (dev == null) {
    let i = 0
    do {
      dev = `eth${i}`
      hostDev = `${host}-${dev}`
      ++i
    } while (set.has(hostDev))
    set.add(hostDev)
    return hostDev
  }
  return hostDev
}

function FunctionCallListener (callback) {
  Python2Listener.call(this)
  this.visited = new Set()
  this.callback = callback
  return this
}
FunctionCallListener.prototype = Object.create(Python2Listener.prototype)
FunctionCallListener.prototype.constructor = FunctionCallListener
FunctionCallListener.prototype.enterArglist = function (ctx) {
  if (this.visited.has(ctx)) {
    return
  }
  this.visited.add(ctx)

  this.callback(ctx)
}

export default function (input) {
  const associations = []
  const ips = {}
  const items = []
  const links = []
  const portMap = {}
  const scriptLines = []
  let lastId = 0

  const printer = new FunctionCallListener(argsCtx => {
    const args = argsCtx.children.map(child => {
      if (!child.children) {
        return child.getText()
      } else {
        return child.children.map(child => {
          const text = child.getText()
          if (text.startsWith('[')) {
            if (text === '[]') {
              return []
            } else {
              return delQuotes(text).split(',')
            }
          } else {
            return text
          }
        })
      }
    }).filter(val =>
      val !== ','
    ).reduce((acc, val, i) => {
      if (val.length === 1) {
        acc[i] = val[0]
      } else {
        acc[val[0]] = val[2]
      }
      return acc
    }, {})

    const funcCtx = argsCtx.parentCtx.parentCtx
    const funcNameIndex = funcCtx.children.findIndex(child => child.getText().startsWith('(')) - 1
    const funcName = funcCtx.children[funcNameIndex].getText()
    const varName = funcNameIndex > 0 ? funcCtx.children[0].getText() : null

    if (funcName === '.onecmd') {
      // Script
      scriptLines.push(delQuotes(args[0]))
    } else if (funcName === '.addLink') {
      // Link
      const item = {
        id: 'script_import_' + ++lastId,
        type: 'link',
        from: args.intfName1
          ? delQuotes(args.intfName1)
          : args[0],
        to: args.intfName2
          ? delQuotes(args.intfName2)
          : args[1]
      }

      if (args.bw) {
        item.bandwidth = args.bw
      }
      if (args.delay) {
        item.delay = delQuotes(args.delay)
      }
      if (args.loss) {
        item.loss = args.loss
      }
      if (args.max_queue_size) {
        item.maxQueueSize = args.max_queue_size
      }
      if (args.jitter) {
        item.jitter = delQuotes(args.jitter)
      }

      links.push(item)
    } else if (funcName === '.start') {
      // Association switch → controller
      const hostnameTo = varName
      args[0].forEach(hostnameFrom => {
        const item = {
          id: 'script_import_' + ++lastId,
          type: 'association',
          from: hostnameFrom,
          to: hostnameTo
        }

        associations.push(item)
      })
    } else if (funcName === '.addHost') {
      // Host
      const hostname = delQuotes(args[0])
      const item = {
        id: 'script_import_' + ++lastId,
        type: 'host',
        hostname
      }
      if (args.defaultRoute) {
        item.defaultRoute = args.defaultRoute.replace(/.*via\s+([0-9a-fA-F.:]+).*/, '$1')
      }

      items.push(item)
    } else if (funcName === '.addSwitch') {
      // Switch
      const hostname = delQuotes(args[0])
      const item = {
        id: 'script_import_' + ++lastId,
        type: 'switch',
        hostname
      }
      if (args.batch) {
        item.batch = args.batch === 'True'
      }
      if (args.datapath) {
        item.datapath = delQuotes(args.datapath)
      }
      if (args.dpid) {
        item.dpid = delQuotes(args.dpid)
      }
      if (args.dpopts) {
        item.dpopts = delQuotes(args.dpopts)
      }
      if (args.opts) {
        item.opts = delQuotes(args.opts)
      }
      if (args.failMode) {
        item.failMode = delQuotes(args.failMode)
      }
      if (args.inband) {
        item.inband = args.inband === 'True'
      }
      if (args.protocols) {
        item.protocol = delQuotes(args.protocols)
      }
      if (args.reconnectms) {
        item.reconnectms = args.reconnectms
      }
      if (args.ip) {
        item.ip = delQuotes(args.ip)
      }
      if (args.port) {
        item.dpctlPort = args.port
      }
      if (args.verbose) {
        item.verbose = args.verbose === 'True'
      }
      if (args.stp) {
        item.stp = args.stp === 'True'
      }
      if (args.prio) {
        item.stpPriority = args.prio
      }
      if (args.cls) {
        item.switchType = args.cls.replace(/.*\./, '')
      }

      items.push(item)
    } else if (funcName === '.addController') {
      // Controller
      const hostname = delQuotes(args[0] || args.name)
      const item = {
        id: 'script_import_' + ++lastId,
        type: 'controller',
        hostname
      }
      if (args.controller) {
        item.controllerType = args.controller.replace(/.*\./, '')
      }
      if (args.ip) {
        item.ip = delQuotes(args.ip)
      }
      if (args.port) {
        item.port = args.port
      }
      if (args.protocol) {
        item.protocol = delQuotes(args.protocol)
      }

      items.push(item)
    } else if (funcName === '.cmd' && /^'ip a a .* dev .*'$/.test(args[0])) {
      // Port IPs
      const { 1: ip, 2: hostname, 3: devname } = /^'ip a a (.*) dev ([^-]+)-([^-]+)'$/.exec(args[0])
      const host = ips[hostname] || (ips[hostname] = {})
      const dev = host[devname] || (host[devname] = [])
      dev.push(ip)
    }
  })

  // Process the tree
  const tree = parse(input)
  const walker = new antlr4.tree.ParseTreeWalker()
  walker.walk(printer, tree)
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(printer, tree)

  // Set up ports with IPs
  Object.keys(ips).forEach(host => {
    Object.keys(ips[host]).forEach(dev => {
      const port = {
        id: 'script_import_' + ++lastId,
        type: 'port',
        hostname: dev,
        ips: ips[host][dev]
      }
      items.push(port)

      const edge = {
        id: 'script_import_' + ++lastId,
        type: 'association',
        from: items.find(item => item.hostname === host).id,
        to: port.id
      }
      items.push(edge)

      portMap[`${host}-${dev}`] = port.id
    })
  })

  // Set up ports without IPs
  const hostDevs = new Set()
  links.forEach(link => hostDevs.add(link.from).add(link.to))
  links.forEach(edge => {
    edge.from = fixNextHostDev(hostDevs, edge.from)
    edge.to = fixNextHostDev(hostDevs, edge.to)
  })
  links.forEach(edge => {
    ;[edge.from, edge.to].forEach(hostDev => {
      if (!portMap[hostDev]) {
        const [host, dev] = hostDev.split('-')

        const port = {
          id: 'script_import_' + ++lastId,
          type: 'port',
          hostname: dev
        }
        items.push(port)

        const edge = {
          id: 'script_import_' + ++lastId,
          type: 'association',
          from: items.find(item => item.hostname === host).id,
          to: port.id
        }
        items.push(edge)

        portMap[`${host}-${dev}`] = port.id
      }
    })
  })

  // Set up associations (can't be done before all nodes are in items)
  associations.forEach(edge => {
    edge.from = items.find(item => item.hostname === edge.from).id
    edge.to = items.find(item => item.hostname === edge.to).id
    items.push(edge)
  })

  // Set up links (can't be done before all ports are in items)
  links.forEach(edge => {
    edge.from = portMap[edge.from]
    edge.to = portMap[edge.to]
    items.push(edge)
  })

  return {
    version: 0,
    script: scriptLines.join('\n'),
    items
  }
}
