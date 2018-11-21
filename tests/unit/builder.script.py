#!/usr/bin/env python2
# -*- coding: utf-8 -*-

# Imports {{{

from mininet.cli import CLI
from mininet.net import Mininet
import mininet.link
import mininet.log
import mininet.node

# }}}
# Initialize Mininet {{{

mininet.log.info('\n*** Initialize Mininet\n')

net = Mininet(build=False, controller=mininet.node.RemoteController, link=mininet.link.TCLink, topo=None)
cli = CLI(net, script='/dev/null')

# }}}
# Add nodes {{{

mininet.log.info('\n*** Add nodes\n')

c1 = net.addController('c1', controller=mininet.node.RemoteController, ip='127.0.0.1', port=6653)
c2 = net.addController('c2', controller=mininet.node.RemoteController, ip='127.0.0.1', port=6633)
h1 = net.addHost('h1', ip=None)
h2 = net.addHost('h2', ip=None)
h3 = net.addHost('h3', ip=None)
h4 = net.addHost('h4', ip=None, defaultRoute='via 172.18.0.1')
h5 = net.addHost('h5', ip=None)
h6 = net.addHost('h6', ip=None)
h7 = net.addHost('h7', ip=None)
h8 = net.addHost('h8', ip=None)
h9 = net.addHost('h9', ip=None)
h10 = net.addHost('h10', ip=None)
h11 = net.addHost('h11', ip=None)
h12 = net.addHost('h12', ip=None)
h13 = net.addHost('h13', ip=None)
s1 = net.addSwitch('s1', cls=mininet.node.OVSSwitch)
s2 = net.addSwitch('s2', cls=mininet.node.OVSSwitch)
s3 = net.addSwitch('s3', cls=mininet.node.OVSSwitch)

# }}}
# Add links {{{

mininet.log.info('\n*** Add links\n')

net.addLink(s1, s2, intfName1='s1-eth5', intfName2='s2-eth0', bw=100, delay='10ms', max_queue_size=42, jitter='5ms')
net.addLink(s1, h1, intfName1='s1-eth0', intfName2='h1-eth0')
net.addLink(h5, s2, intfName1='h5-eth0', intfName2='s2-eth3')
net.addLink(h10, s3, intfName1='h10-eth0', intfName2='s3-eth1')
net.addLink(h12, s3, intfName1='h12-eth0', intfName2='s3-eth3')
net.addLink(h13, s3, intfName1='h13-eth0', intfName2='s3-eth4')
net.addLink(h11, s3, intfName1='h11-eth0', intfName2='s3-eth2')
net.addLink(h7, s2, intfName1='h7-eth0', intfName2='s2-eth5')
net.addLink(h8, s2, intfName1='h8-eth0', intfName2='s2-eth6')
net.addLink(s3, s2, intfName1='s3-eth0', intfName2='s2-eth8')
net.addLink(h6, s2, intfName1='h6-eth0', intfName2='s2-eth4')
net.addLink(h3, s2, intfName1='h3-eth0', intfName2='s2-eth1')
net.addLink(h9, s2, intfName1='h9-eth0', intfName2='s2-eth7')
net.addLink(s1, h2, intfName1='s1-eth4', intfName2='h2-eth0')
net.addLink(h4, s2, intfName1='h4-eth1', intfName2='s2-eth2')
net.addLink(h4, h3, intfName1='h4-eth0', intfName2='h3-eth1', bw=10)

# }}}
# Add IP addresses {{{

mininet.log.info('\n*** Add IP addresses\n')

h1.intf('h1-eth0').ip = '172.18.1.1'
h1.intf('h1-eth0').prefixLen = 16
h1.cmd('ip a a 172.18.1.1/16 dev h1-eth0')
h1.cmd('ip a a fc00::1/32 dev h1-eth0')
h3.intf('h3-eth0').ip = '172.18.1.3'
h3.intf('h3-eth0').prefixLen = 16
h3.cmd('ip a a 172.18.1.3/16 dev h3-eth0')
h3.cmd('ip a a fc00::3/32 dev h3-eth0')
h2.intf('h2-eth0').ip = '172.18.1.2'
h2.intf('h2-eth0').prefixLen = 16
h2.cmd('ip a a 172.18.1.2/16 dev h2-eth0')
h2.cmd('ip a a fc00::2/32 dev h2-eth0')
h7.intf('h7-eth0').ip = '172.18.1.7'
h7.intf('h7-eth0').prefixLen = 16
h7.cmd('ip a a 172.18.1.7/16 dev h7-eth0')
h7.cmd('ip a a fc00::7/32 dev h7-eth0')
h6.intf('h6-eth0').ip = '172.18.1.6'
h6.intf('h6-eth0').prefixLen = 16
h6.cmd('ip a a 172.18.1.6/16 dev h6-eth0')
h6.cmd('ip a a fc00::6/32 dev h6-eth0')
h5.intf('h5-eth0').ip = '172.18.1.5'
h5.intf('h5-eth0').prefixLen = 16
h5.cmd('ip a a 172.18.1.5/16 dev h5-eth0')
h5.cmd('ip a a fc00::5/32 dev h5-eth0')
h13.intf('h13-eth0').ip = '172.18.1.13'
h13.intf('h13-eth0').prefixLen = 16
h13.cmd('ip a a 172.18.1.13/16 dev h13-eth0')
h13.cmd('ip a a fc00::13/32 dev h13-eth0')
h12.intf('h12-eth0').ip = '172.18.1.12'
h12.intf('h12-eth0').prefixLen = 16
h12.cmd('ip a a 172.18.1.12/16 dev h12-eth0')
h12.cmd('ip a a fc00::12/32 dev h12-eth0')
h10.intf('h10-eth0').ip = '172.18.1.10'
h10.intf('h10-eth0').prefixLen = 16
h10.cmd('ip a a 172.18.1.10/16 dev h10-eth0')
h10.cmd('ip a a fc00::10/32 dev h10-eth0')
h8.intf('h8-eth0').ip = '172.18.1.8'
h8.intf('h8-eth0').prefixLen = 16
h8.cmd('ip a a 172.18.1.8/16 dev h8-eth0')
h8.cmd('ip a a fc00::8/32 dev h8-eth0')
h11.intf('h11-eth0').ip = '172.18.1.11'
h11.intf('h11-eth0').prefixLen = 16
h11.cmd('ip a a 172.18.1.11/16 dev h11-eth0')
h11.cmd('ip a a fc00::11/32 dev h11-eth0')
h9.intf('h9-eth0').ip = '172.18.1.9'
h9.intf('h9-eth0').prefixLen = 16
h9.cmd('ip a a 172.18.1.9/16 dev h9-eth0')
h9.cmd('ip a a fc00::9/32 dev h9-eth0')
h4.intf('h4-eth0').ip = '192.168.1.2'
h4.intf('h4-eth0').prefixLen = 24
h4.cmd('ip a a 192.168.1.2/24 dev h4-eth0')
h3.intf('h3-eth1').ip = '192.168.1.1'
h3.intf('h3-eth1').prefixLen = 24
h3.cmd('ip a a 192.168.1.1/24 dev h3-eth1')
h4.intf('h4-eth1').ip = '172.18.1.4'
h4.intf('h4-eth1').prefixLen = 16
h4.cmd('ip a a 172.18.1.4/16 dev h4-eth1')
h4.cmd('ip a a fc00::4/32 dev h4-eth1')

# }}}
# Build the network {{{

mininet.log.info('\n*** Build the network\n')

net.build()

# }}}
# Start controllers {{{

mininet.log.info('\n*** Start controllers\n')

c1.start()
c2.start()

# }}}
# Start switches {{{

mininet.log.info('\n*** Start switches\n')

s1.start([c1])
s2.start([c2])
s3.start([c2])

# }}}
# Run global startup commands {{{

mininet.log.info('\n*** Run global startup commands\n')

mininet.log.debug('[mininet]> pingall\n')
cli.onecmd('pingall')

# }}}
# Start CLI {{{

mininet.log.info('\n*** Start CLI\n')

cli.run()

# }}}
# Finish {{{

mininet.log.info('\n*** Finish\n')

net.stop()

# }}}
# Log {{{

# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth1: not connected to anything.
# Skipping port/eth2: not connected to anything.
# Skipping port/eth3: not connected to anything.
# Skipping port/eth5: not connected to anything.

# }}}

# vim:fdm=marker
