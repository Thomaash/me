import { expect } from 'chai'

import { getCleanItems } from './exportImportCommon.js'

import importScript from '../../src/importScript'

import minieditScript from './minieditScriptImport.script.txt'

describe('Import Miniedit script', () => {
  [{
    script: minieditScript,
    name: 'Miniedit',
    amounts: [
      ['association', 20],
      ['controller', 2],
      ['host', 6],
      ['link', 8],
      ['port', 16],
      ['switch', 3]
    ],
    items: [
      { type: 'controller', hostname: 'c0', controllerType: 'Controller', port: 6653 },
      { type: 'controller', hostname: 'c1', controllerType: 'Controller', port: 6633 },
      { type: 'host', hostname: 'h1', defaultRoute: '192.168.1.1' },
      { type: 'host', hostname: 'h2', defaultRoute: '192.168.1.1' },
      { type: 'host', hostname: 'h3', defaultRoute: '192.168.1.1' },
      { type: 'host', hostname: 'h4', defaultRoute: '192.168.1.1' },
      { type: 'host', hostname: 'h5', defaultRoute: '192.168.1.1' },
      { type: 'host', hostname: 'h6' },
      { type: 'port', hostname: 'eth0', ips: ['192.168.1.101/8'] },
      { type: 'port', hostname: 'eth0', ips: ['192.168.1.102/8'] },
      { type: 'port', hostname: 'eth0', ips: ['192.168.1.103/8'] },
      { type: 'port', hostname: 'eth0', ips: ['192.168.1.104/8'] },
      { type: 'port', hostname: 'eth0', ips: ['192.168.1.105/8'] },
      { type: 'port', hostname: 'eth0', ips: ['192.168.1.106/8'] },
      { type: 'switch', hostname: 's1', switchType: 'OVSKernelSwitch' },
      { type: 'switch', hostname: 's2', switchType: 'OVSKernelSwitch' },
      { type: 'switch', hostname: 's3', switchType: 'OVSKernelSwitch' }
    ]
  }].forEach(({ script, name, amounts, items: expectedItems }) => describe(name, () => {
    const json = importScript(script)

    it('types', () => {
      expect(json.version, 'Version is not a number.').to.be.a('number')
      expect(json.script, 'Script is not a string.').to.be.a('string')
      expect(json.items, 'Items is not an array.').to.be.an('array')
    })

    it('item amounts', () => {
      amounts.forEach(([type, amount]) => {
        expect(
          json.items.filter(item => item.type === type),
          `Unexpected amount of ${type} items.`
        ).to.have.lengthOf(amount)
      })
    })

    it('item properties', () => {
      const cleanItems = getCleanItems(json.items)
      expectedItems.forEach(item => {
        expect(cleanItems)
          .to.deep.include(item)
      })
    })
  }))
})
