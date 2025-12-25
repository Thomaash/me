#!/usr/bin/env python2
"""
Pure Python 2 Mininet example with basic topology.
Creates a simple network: 2 hosts connected to 1 switch.
Uses Python 2 syntax throughout, including print statements.
Run with: sudo python2 pure_py2_example.py
"""

from mininet.net import Mininet
from mininet.node import Controller, OVSSwitch
from mininet.link import TCLink
from mininet.cli import CLI
from mininet.log import setLogLevel

def simple_net():
    net = Mininet(controller=Controller, link=TCLink, switch=OVSSwitch)

    print '>>> Adding controller'
    net.addController('c0')

    print '>>> Adding switch'
    s1 = net.addSwitch('s1')

    print '>>> Adding hosts'
    h1 = net.addHost('h1', ip='10.0.0.1/24')
    h2 = net.addHost('h2', ip='10.0.0.2/24')

    print '>>> Creating links'
    net.addLink(h1, s1)
    net.addLink(h2, s1)

    print '>>> Starting network'
    net.start()

    print '>>> Testing ping'
    net.pingAll()

    print '>>> Entering CLI'
    CLI(net)

    print '>>> Stopping network'
    net.stop()

if __name__ == '__main__':
    setLogLevel('info')
    simple_net()