#!/usr/bin/python

from mininet.net import Mininet
from mininet.node import Controller, RemoteController, OVSController
from mininet.node import CPULimitedHost, Host, Node
from mininet.node import OVSKernelSwitch, UserSwitch
from mininet.node import IVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import TCLink, Intf

def myNetwork():

    net = Mininet( topo=None,
                   build=False,
                   ipBase='10.0.0.0/8')

    info( '*** Adding controller\n' )
    c1=net.addController(name='c1',
                      controller=Controller,
                      port=6633)

    c0=net.addController(name='c0',
                      controller=Controller,
                      port=6653)

    info( '*** Add switches\n')
    s1 = net.addSwitch('s1', cls=OVSKernelSwitch)
    s3 = net.addSwitch('s3', cls=OVSKernelSwitch)
    s5 = net.addSwitch('s5', cls=OVSKernelSwitch, failMode='standalone')
    r4 = net.addHost('r4', cls=Node, ip='0.0.0.0')
    r4.cmd('sysctl -w net.ipv4.ip_forward=1')
    s2 = net.addSwitch('s2', cls=OVSKernelSwitch)

    info( '*** Add hosts\n')
    h5 = net.addHost('h5', cls=Host, ip='192.168.1.105/8', defaultRoute='via 192.168.1.1')
    h6 = net.addHost('h6', cls=Host, ip='192.168.1.106/8', defaultRoute=None)
    h2 = net.addHost('h2', cls=Host, ip='192.168.1.102/8', defaultRoute='via 192.168.1.1')
    h1 = net.addHost('h1', cls=Host, ip='192.168.1.101/8', defaultRoute='via 192.168.1.1')
    Intf( 'ext0', node=h1 )
    Intf( 'ext1', node=h1 )
    Intf( 'ext2', node=h1 )
    h3 = net.addHost('h3', cls=Host, ip='192.168.1.103/8', defaultRoute='via 192.168.1.1')
    h4 = net.addHost('h4', cls=Host, ip='192.168.1.104/8', defaultRoute='via 192.168.1.1')

    info( '*** Add links\n')
    net.addLink(s1, h1)
    net.addLink(s1, h2)
    net.addLink(s2, h3)
    net.addLink(s2, h4)
    s3h5 = {'bw':100,'delay':'15ms','loss':7,'max_queue_size':145,'jitter':'25ms'}
    net.addLink(s3, h5, link=TCLink , **s3h5)
    net.addLink(s3, h6)
    net.addLink(s1, s2)
    net.addLink(s2, s3)
    net.addLink(r4, s5)
    net.addLink(r4, s1)

    info( '*** Starting network\n')
    net.build()
    info( '*** Starting controllers\n')
    for controller in net.controllers:
        controller.start()

    info( '*** Starting switches\n')
    net.get('s1').start([c0])
    net.get('s3').start([c1])
    net.get('s5').start([])
    net.get('s2').start([c0,c1])

    info( '*** Configuring switches\n')

    CLI(net)
    net.stop()

if __name__ == '__main__':
    setLogLevel( 'info' )
    myNetwork()

