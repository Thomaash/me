#!/usr/bin/python2

from mininet.net import Mininet
from mininet.node import Controller, RemoteController, OVSController
from mininet.node import CPULimitedHost, Host, Node
from mininet.node import OVSKernelSwitch, UserSwitch
from mininet.node import IVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import TCLink, Intf
from subprocess import call

def myNetwork():

    net = Mininet( topo=None,
                   build=False,
                   ipBase='10.0.0.0/8')

    info( '*** Adding controller\n' )
    c1=net.addController(name='c1',
                      controller=RemoteController,
                      ip='127.0.0.1',
                      protocol='tcp',
                      port=6643)

    c2=net.addController(name='c2',
                      controller=OVSController,
                      protocol='tcp',
                      port=6653)

    c0=net.addController(name='c0',
                      controller=Controller,
                      protocol='tcp',
                      port=6633)

    info( '*** Add switches\n')
    s1 = net.addSwitch('s1', cls=OVSKernelSwitch, listenPort=12345, dpid='acdc')
    Intf( 'extS1', node=s1 )
    s7 = net.addSwitch('s7', cls=UserSwitch)
    s3 = net.addSwitch('s3', cls=IVSSwitch)
    r4 = net.addHost('r4', cls=Node, ip='0.0.0.0')
    r4.cmd('sysctl -w net.ipv4.ip_forward=1')
    s2 = net.addSwitch('s2', cls=OVSKernelSwitch)
    s5 = net.addSwitch('s5', cls=OVSKernelSwitch, failMode='standalone')
    s8 = net.addSwitch('s8', cls=UserSwitch, inNamespace=True)

    info( '*** Add hosts\n')
    h3 = net.addHost('h3', cls=CPULimitedHost, ip='192.168.1.103/8', defaultRoute='via 192.168.1.1')
    h3.setCPUs(cores='1')
    h3.setCPUFrac(f=0.3, sched='rt')
    h2 = net.addHost('h2', cls=Host, ip='192.168.1.102/8', defaultRoute='via 192.168.1.1')
    h1 = net.addHost('h1', cls=Host, ip='192.168.1.101/8', defaultRoute='via 192.168.1.1')
    Intf( 'ext0', node=h1 )
    Intf( 'ext1', node=h1 )
    Intf( 'ext2', node=h1 )
    h4 = net.addHost('h4', cls=CPULimitedHost, ip='192.168.1.104/8', defaultRoute='via 192.168.1.1')
    h4.setCPUs(cores='2')
    h4.setCPUFrac(f=0.4, sched='cfs')
    h6 = net.addHost('h6', cls=Host, ip='192.168.1.106/8', defaultRoute=None)
    h5 = net.addHost('h5', cls=CPULimitedHost, ip='192.168.1.105/8', defaultRoute='via 192.168.1.1')
    h5.setCPUs(cores='1,2,4')
    h5.setCPUFrac(f=0.5, sched='host')

    info( '*** Add links\n')
    net.addLink(s1, h1)
    net.addLink(s1, h2)
    net.addLink(s2, h3)
    net.addLink(s2, h4)
    s3h5 = {'bw':100,'delay':'15ms','loss':7,'max_queue_size':145,'jitter':'25ms'}
    net.addLink(s3, h5, cls=TCLink , **s3h5)
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
    net.get('s7').start([])
    net.get('s3').start([c1])
    net.get('s2').start([c0,c1])
    net.get('s5').start([])
    net.get('s8').start([])

    info( '*** Post configure switches and hosts\n')
    s2.cmd('ifconfig s2 127.0.0.6')
    s1.cmdPrint('ip l')
    h6.cmd('vconfig add h6-eth0 600')
    h6.cmd('ifconfig h6-eth0.600 172.16.0.6')
    h6.cmd('vconfig add h6-eth0 700')
    h6.cmd('ifconfig h6-eth0.700 172.17.0.6')

    CLI(net)
    s1.cmdPrint('ip a')
    net.stop()

if __name__ == '__main__':
    setLogLevel( 'info' )
    myNetwork()

