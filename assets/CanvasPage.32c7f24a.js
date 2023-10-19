import{n as h,w as M,d as G,m as K,s as Z,i as tt}from"./js/app-40fad9aa.js";import{r as $,l as J,e as _,c as et,p as st,h as k,i as T,a as B,s as it,n as at,b as N,t as R,d as L,f as ot,g as nt,j as rt,k as lt,m as ct,o as dt,q as mt,L as W}from"./LoadingSpinner.0f34e7cb.js";import{d as ut,m as I,V as ht,c as pt,a as ft}from"./VisCanvas.ee6fac93.js";import{T as vt}from"./ThreeStateCheckbox.186d7ce4.js";var f={props:["value"],data:()=>({valid:!1,item:{},_lastItem:null}),watch:{item(t){this._newItemEmit(),this.$emit("input",t)},value(t){this.item=t},valid(t){this.$emit("valid",t)}},methods:{_newItemEmit(){this.item!==this._lastItem&&(this._lastItem=this.item,this.$emit("new-item",this.item))}},mounted(){this.item=this.value,this._newItemEmit(),this.$emit("valid",this.valid),this.$v&&this.$v.$touch()}},_t=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("v-form",{model:{value:t.valid,callback:function(s){t.valid=s},expression:"valid"}},[e("v-container",{attrs:{"grid-list-md":""}},[e("v-layout",{attrs:{wrap:""}},[e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{label:"Label",autofocus:"",clearable:"","data-cy":"edit-hostname"},model:{value:t.item.hostname,callback:function(s){t.$set(t.item,"hostname",s)},expression:"item.hostname"}})],1)],1)],1)],1)},yt=[];const xt={name:"AssociationEdit",mixins:[f],data:()=>({valid:!1,item:{}})},D={};var bt=h(xt,_t,yt,!1,gt,null,null,null);function gt(t){for(let i in D)this[i]=D[i]}var wt=function(){return bt.exports}(),$t=t=>M({type:"maxLength",max:t},i=>!$(i)||J(i)<=t),kt=t=>M({type:"minLength",min:t},i=>!$(i)||J(i)>=t),S=M({type:"required"},t=>typeof t=="string"?$(t.trim()):$(t)),St=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("v-form",{model:{value:t.valid,callback:function(s){t.valid=s},expression:"valid"}},[e("v-container",{attrs:{"grid-list-md":""}},[e("v-layout",{attrs:{wrap:""}},[e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.hostname,label:"Label",autofocus:"",clearable:"","data-cy":"edit-hostname"},model:{value:t.item.hostname,callback:function(s){t.$set(t.item,"hostname",s)},expression:"item.hostname"}})],1),e("v-flex",{attrs:{xs12:"","data-cy":"edit-controller-type"}},[e("v-select",{attrs:{items:t.controllerTypes,label:"Type",clearable:""},model:{value:t.item.controllerType,callback:function(s){t.$set(t.item,"controllerType",s)},expression:"item.controllerType"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.ip,label:"IP",clearable:"","data-cy":"edit-ip"},model:{value:t.item.ip,callback:function(s){t.$set(t.item,"ip",s)},expression:"item.ip"}})],1),e("v-flex",{attrs:{xs12:"",md6:""}},[e("v-text-field",{ref:"port",attrs:{rules:[t.badNumberRule("port")],"error-messages":t.errors.item.port,label:"Port",type:"number",min:"1",max:"65535",clearable:"","data-cy":"edit-port"},model:{value:t.item.port,callback:function(s){t.$set(t.item,"port",t._n(s))},expression:"item.port"}})],1),e("v-flex",{attrs:{xs12:"",md6:"","data-cy":"edit-protocol"}},[e("v-select",{attrs:{items:t.protocolsIP,label:"Protocol",clearable:""},model:{value:t.item.protocol,callback:function(s){t.$set(t.item,"protocol",s)},expression:"item.protocol"}})],1)],1)],1)],1)},Pt=[];const Et={name:"ControllerEdit",mixins:[f,_],data:()=>({valid:!1,item:{},controllerTypes:et,protocolsIP:st}),validations:{item:{hostname:{required:S,hostname:k},ip:{ip:T},port:{port:B}}}},O={};var Ct=h(Et,St,Pt,!1,Lt,null,null,null);function Lt(t){for(let i in O)this[i]=O[i]}var It=function(){return Ct.exports}(),Mt=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("v-form",{model:{value:t.valid,callback:function(s){t.valid=s},expression:"valid"}},[e("v-container",{attrs:{"grid-list-md":""}},[e("v-layout",{attrs:{wrap:""}},[e("v-flex",{attrs:{xs12:""}},[e("v-textarea",{staticClass:"monospace-input",attrs:{"auto-grow":"",autofocus:"",clearable:"","data-cy":"edit-hostname",label:"Label"},model:{value:t.item.hostname,callback:function(s){t.$set(t.item,"hostname",s)},expression:"item.hostname"}})],1)],1)],1)],1)},Tt=[];const Nt={name:"DummyEdit",mixins:[f],data:()=>({valid:!1,item:{}})},U={};var Rt=h(Nt,Mt,Tt,!1,Dt,null,null,null);function Dt(t){for(let i in U)this[i]=U[i]}var Ot=function(){return Rt.exports}(),Ut=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("v-form",{model:{value:t.valid,callback:function(s){t.valid=s},expression:"valid"}},[e("v-container",{attrs:{"grid-list-md":""}},[e("v-layout",{attrs:{wrap:""}},[e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.hostname,label:"Hostname",autofocus:"","data-cy":"edit-hostname"},model:{value:t.item.hostname,callback:function(s){t.$set(t.item,"hostname",s)},expression:"item.hostname"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.defaultRoute,label:"Default Route",clearable:"","data-cy":"edit-default-route"},model:{value:t.item.defaultRoute,callback:function(s){t.$set(t.item,"defaultRoute",s)},expression:"item.defaultRoute"}})],1),e("v-flex",{attrs:{xs12:"",md6:"","data-cy":"edit-cpu-scheduler"}},[e("v-select",{attrs:{items:t.schedulers,label:"Scheduler",clearable:""},model:{value:t.item.cpuScheduler,callback:function(s){t.$set(t.item,"cpuScheduler",s)},expression:"item.cpuScheduler"}})],1),e("v-flex",{attrs:{xs12:"",md6:""}},[e("v-text-field",{ref:"itemCPULimit",attrs:{rules:[t.badNumberRule("itemCPULimit")],"error-messages":t.errors.item.cpuLimit,label:"CPU Utilization Limit",type:"number",min:"0",max:"1",step:".01",clearable:"","data-cy":"edit-cpu-limit"},model:{value:t.item.cpuLimit,callback:function(s){t.$set(t.item,"cpuLimit",t._n(s))},expression:"item.cpuLimit"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.cpuCores,label:"CPU cores",clearable:"","data-cy":"edit-cpu-cores-str"},model:{value:t.cpuCoresStr,callback:function(s){t.cpuCoresStr=s},expression:"cpuCoresStr"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-textarea",{attrs:{label:"Startup Script","auto-grow":"",clearable:"","data-cy":"edit-start-script"},model:{value:t.item.startScript,callback:function(s){t.$set(t.item,"startScript",s)},expression:"item.startScript"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-textarea",{attrs:{label:"Shutdown Script","auto-grow":"",clearable:"","data-cy":"edit-stop-script"},model:{value:t.item.stopScript,callback:function(s){t.$set(t.item,"stopScript",s)},expression:"item.stopScript"}})],1)],1)],1)],1)},Vt=[];const jt={name:"HostEdit",mixins:[f,_],data:()=>({valid:!1,item:{},schedulers:it,cpuCoresStrInit:""}),computed:{cpuCoresStr:{get(){return this.cpuCoresStrInit},set(t){if(t==null)this.$delete(this.item,"cpuCores");else{const i=/^\d+$/;this.$set(this.item,"cpuCores",t.split(/\s*[\s,]\s*/g).map(e=>i.test(e)?+e:NaN).sort((e,s)=>e-s).filter((e,s,o)=>o[s-1]!==e))}}}},validations:{item:{cpuCores:{naturalNumberList:at},cpuLimit:{decimal:ut,between:N(0,1)},defaultRoute:{ip:T},hostname:{required:S,hostname:k}}},created(){this.$on("new-item",()=>{this.cpuCoresStrInit=(this.item.cpuCores||[]).join(", ")})}},V={};var Ht=h(jt,Ut,Vt,!1,Ft,null,null,null);function Ft(t){for(let i in V)this[i]=V[i]}var zt=function(){return Ht.exports}(),Yt=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("v-form",{model:{value:t.valid,callback:function(s){t.valid=s},expression:"valid"}},[e("v-container",{attrs:{"grid-list-md":""}},[e("v-layout",{attrs:{wrap:""}},[e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{label:"Label",autofocus:"","data-cy":"edit-hostname"},model:{value:t.item.hostname,callback:function(s){t.$set(t.item,"hostname",s)},expression:"item.hostname"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{ref:"itemBandwidth",attrs:{rules:[t.badNumberRule("itemBandwidth")],"error-messages":t.errors.item.bandwidth,label:"Bandwidth",type:"number",min:"0",suffix:"MBits/s",clearable:"","data-cy":"edit-bandwidth"},model:{value:t.item.bandwidth,callback:function(s){t.$set(t.item,"bandwidth",t._n(s))},expression:"item.bandwidth"}})],1),e("v-flex",{attrs:{xs12:"",md6:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.delay,label:"Delay",clearable:"","data-cy":"edit-delay"},model:{value:t.item.delay,callback:function(s){t.$set(t.item,"delay",s)},expression:"item.delay"}})],1),e("v-flex",{attrs:{xs12:"",md6:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.jitter,label:"Jitter",clearable:"","data-cy":"edit-jitter"},model:{value:t.item.jitter,callback:function(s){t.$set(t.item,"jitter",s)},expression:"item.jitter"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{ref:"itemLoss",attrs:{rules:[t.badNumberRule("itemLoss")],"error-messages":t.errors.item.loss,label:"Loss",type:"number",min:"0",max:"100",suffix:"%",clearable:"","data-cy":"edit-loss"},model:{value:t.item.loss,callback:function(s){t.$set(t.item,"loss",t._n(s))},expression:"item.loss"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{ref:"itemMaxQueueSize",attrs:{rules:[t.badNumberRule("itemMaxQueueSize")],"error-messages":t.errors.item.maxQueueSize,label:"Max queue",type:"number",min:"0",suffix:"packets",clearable:"","data-cy":"edit-max-queue-size"},model:{value:t.item.maxQueueSize,callback:function(s){t.$set(t.item,"maxQueueSize",t._n(s))},expression:"item.maxQueueSize"}})],1)],1)],1)],1)},Xt=[];const At={name:"LinkEdit",mixins:[f,_],data:()=>({dialog:!1,item:{}}),validations:{item:{bandwidth:{minValue:I(0)},delay:{timeWithUnit:R},loss:{between:N(0,100)},maxQueueSize:{integer:L,minValue:I(0)},jitter:{timeWithUnit:R}}}},j={};var Qt=h(At,Yt,Xt,!1,qt,null,null,null);function qt(t){for(let i in j)this[i]=j[i]}var Jt=function(){return Qt.exports}(),Bt=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("v-form",{model:{value:t.valid,callback:function(s){t.valid=s},expression:"valid"}},[e("v-container",{attrs:{"grid-list-md":""}},[e("v-layout",{attrs:{wrap:""}},[e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.hostname,label:"Dev Name",autofocus:"",clearable:"","data-cy":"edit-hostname"},model:{value:t.item.hostname,callback:function(s){t.$set(t.item,"hostname",s)},expression:"item.hostname"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-textarea",{attrs:{"error-messages":t.errors.item.ips,label:"IPs","auto-grow":"",clearable:"","data-cy":"edit-ips"},model:{value:t.ips,callback:function(s){t.ips=s},expression:"ips"}})],1),e("v-flex",{attrs:{xs12:"","data-cy":"edit-physical"}},[e("v-switch",{attrs:{color:"primary",label:"Physical"},model:{value:t.item.physical,callback:function(s){t.$set(t.item,"physical",s)},expression:"item.physical"}})],1)],1)],1)],1)},Wt=[];const Gt={name:"PortEdit",mixins:[f,_],data:()=>({valid:!1,item:{}}),computed:{ips:{get(){return(this.item.ips||[]).join(`
`)},set(t){t?this.$set(this.item,"ips",t.split(`
`).filter(i=>i!=="")):this.$delete(this.item,"ips")}}},watch:{"item.physical"(t){t===!1&&delete this.$delete(this.item,"physical")}},validations:{item:{hostname:{required:S,hostname:k},ips:{ipsWithMasks:ot}}}},H={};var Kt=h(Gt,Bt,Wt,!1,Zt,null,null,null);function Zt(t){for(let i in H)this[i]=H[i]}var te=function(){return Kt.exports}(),ee=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("v-form",{model:{value:t.valid,callback:function(s){t.valid=s},expression:"valid"}},[e("v-container",{attrs:{"grid-list-md":""}},[e("v-layout",{attrs:{wrap:""}},[e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.hostname,label:"Hostname",autofocus:"","data-cy":"edit-hostname"},model:{value:t.item.hostname,callback:function(s){t.$set(t.item,"hostname",s)},expression:"item.hostname"}})],1),e("v-flex",{attrs:{xs12:"","data-cy":"edit-switch-type"}},[e("v-select",{attrs:{items:t.switchTypes,label:"Type",clearable:""},model:{value:t.item.switchType,callback:function(s){t.$set(t.item,"switchType",s)},expression:"item.switchType"}})],1),e("v-flex",{attrs:{xs12:"",md3:""}},[e("ThreeStateCheckbox",{attrs:{label:"STP","data-cy":"edit-stp"},model:{value:t.item.stp,callback:function(s){t.$set(t.item,"stp",s)},expression:"item.stp"}})],1),e("v-flex",{attrs:{xs12:"",md9:""}},[e("v-text-field",{ref:"itemSTPPriority",attrs:{rules:[t.badNumberRule("itemSTPPriority")],"error-messages":t.errors.item.stpPriority,label:"STP Priority",type:"number",step:"4096",min:"0",max:"65535",clearable:"","data-cy":"edit-stp-priority"},model:{value:t.item.stpPriority,callback:function(s){t.$set(t.item,"stpPriority",t._n(s))},expression:"item.stpPriority"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.ip,label:"IP",clearable:"","data-cy":"edit-ip"},model:{value:t.item.ip,callback:function(s){t.$set(t.item,"ip",s)},expression:"item.ip"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{ref:"itemDPCTLPort",attrs:{rules:[t.badNumberRule("itemDPCTLPort")],"error-messages":t.errors.item.dpctlPort,label:"DPCTL Port",type:"number",min:"1",max:"65535",clearable:"","data-cy":"edit-dpctl-port"},model:{value:t.item.dpctlPort,callback:function(s){t.$set(t.item,"dpctlPort",t._n(s))},expression:"item.dpctlPort"}})],1),e("v-flex",{attrs:{xs12:"","data-cy":"edit-protocol"}},[e("v-select",{attrs:{items:t.protocolsOF,label:"Protocol",clearable:""},model:{value:t.item.protocol,callback:function(s){t.$set(t.item,"protocol",s)},expression:"item.protocol"}})],1),e("v-flex",{attrs:{xs12:"",md6:"","data-cy":"edit-datapath"}},[e("v-select",{attrs:{items:t.datapaths,label:"Datapath",clearable:""},model:{value:t.item.datapath,callback:function(s){t.$set(t.item,"datapath",s)},expression:"item.datapath"}})],1),e("v-flex",{attrs:{xs12:"",md6:""}},[e("v-text-field",{attrs:{"error-messages":t.errors.item.dpid,label:"Datapath ID",type:"text",clearable:"","data-cy":"edit-dpid"},model:{value:t.item.dpid,callback:function(s){t.$set(t.item,"dpid",s)},expression:"item.dpid"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{label:"Ofdatapath arguments",clearable:"","data-cy":"edit-dpopts"},model:{value:t.item.dpopts,callback:function(s){t.$set(t.item,"dpopts",s)},expression:"item.dpopts"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{ref:"itemReconnectMs",attrs:{rules:[t.badNumberRule("itemReconnectMs")],"error-messages":t.errors.item.reconnectms,label:"Reconnect Timeout",type:"number",min:"0",suffix:"ms",clearable:"","data-cy":"edit-reconnect-ms"},model:{value:t.item.reconnectms,callback:function(s){t.$set(t.item,"reconnectms",t._n(s))},expression:"item.reconnectms"}})],1),e("v-flex",{attrs:{xs12:"","data-cy":"edit-fail-mode"}},[e("v-select",{attrs:{items:t.failModes,label:"Fail Mode",clearable:""},model:{value:t.item.failMode,callback:function(s){t.$set(t.item,"failMode",s)},expression:"item.failMode"}})],1),e("v-flex",{attrs:{xs12:""}},[e("ThreeStateCheckbox",{attrs:{label:"Inband","data-cy":"edit-inband"},model:{value:t.item.inband,callback:function(s){t.$set(t.item,"inband",s)},expression:"item.inband"}})],1),e("v-flex",{attrs:{xs12:""}},[e("ThreeStateCheckbox",{attrs:{label:"In Namespace","data-cy":"edit-in-namespace"},model:{value:t.item.inNamespace,callback:function(s){t.$set(t.item,"inNamespace",s)},expression:"item.inNamespace"}})],1),e("v-flex",{attrs:{xs12:""}},[e("ThreeStateCheckbox",{attrs:{label:"Batch","data-cy":"edit-batch"},model:{value:t.item.batch,callback:function(s){t.$set(t.item,"batch",s)},expression:"item.batch"}})],1),e("v-flex",{attrs:{xs12:""}},[e("ThreeStateCheckbox",{attrs:{label:"Verbose","data-cy":"edit-verbose"},model:{value:t.item.verbose,callback:function(s){t.$set(t.item,"verbose",s)},expression:"item.verbose"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{label:"Additional Switch Options",clearable:"","data-cy":"edit-opts"},model:{value:t.item.opts,callback:function(s){t.$set(t.item,"opts",s)},expression:"item.opts"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-textarea",{attrs:{label:"Startup Script","auto-grow":"",clearable:"","data-cy":"edit-start-script"},model:{value:t.item.startScript,callback:function(s){t.$set(t.item,"startScript",s)},expression:"item.startScript"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-textarea",{attrs:{label:"Shutdown Script","auto-grow":"",clearable:"","data-cy":"edit-stop-script"},model:{value:t.item.stopScript,callback:function(s){t.$set(t.item,"stopScript",s)},expression:"item.stopScript"}})],1)],1)],1)],1)},se=[];const ie={name:"SwitchEdit",components:{ThreeStateCheckbox:vt},mixins:[f,_],data:()=>({valid:!1,item:{},switchTypes:nt,failModes:rt,datapaths:lt,protocolsOF:ct}),validations:{item:{dpctlPort:{port:B},dpid:{hexData:dt,minLength:kt(1),maxLength:$t(16)},hostname:{required:S,hostname:k},ip:{ip:T},reconnectms:{integer:L,minValue:I(0)},stpPriority:{integer:L,between:N(0,65535),divisible:mt(4096)}}}},F={};var ae=h(ie,ee,se,!1,oe,null,null,null);function oe(t){for(let i in F)this[i]=F[i]}var ne=function(){return ae.exports}(),re=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("v-layout",{attrs:{row:"","justify-center":""}},[e("v-dialog",{attrs:{fullscreen:t.fullscreen||t.$vuetify.breakpoint.xsOnly,persistent:"",scrollable:"","max-width":"600px"},on:{keydown:[function(s){return!s.type.indexOf("key")&&t._k(s.keyCode,"esc",27,s.key,["Esc","Escape"])?null:t.cancel.apply(null,arguments)},function(s){return!s.type.indexOf("key")&&t._k(s.keyCode,"enter",13,s.key,"Enter")?null:t.save.apply(null,arguments)}]},model:{value:t.dialog,callback:function(s){t.dialog=s},expression:"dialog"}},[e("v-card",{attrs:{"data-cy":`edit-${t.item.type}`}},[e("v-card-title",{staticStyle:{"flex-grow":"0"},attrs:{"primary-title":""},on:{dblclick:function(s){t.fullscreen=!t.fullscreen}}},[e("v-icon",{staticClass:"mr-2"},[t._v(t._s(`$vuetify.icons.net-${t.themeType}`))]),e("h3",{staticClass:"headline",domProps:{textContent:t._s(t.headline)}})],1),e("v-card-text",{staticStyle:{"flex-grow":"1"}},[e(t.component,{tag:"div",on:{valid:function(s){return t.valid=s}},model:{value:t.item,callback:function(s){t.item=s},expression:"item"}})],1),e("v-card-actions",{staticStyle:{"flex-grow":"0"}},[e("v-spacer"),e("v-btn",{attrs:{color:"primary",text:"","data-cy":"edit-cancel"},nativeOn:{click:function(s){return t.cancel.apply(null,arguments)}}},[t._v("Cancel")]),e("v-btn",{attrs:{disabled:!t.valid,color:"primary",text:"","data-cy":"edit-save"},nativeOn:{click:function(s){return t.save.apply(null,arguments)}}},[t._v("Save")])],1)],1)],1)],1)},le=[];const ce={association:"AssociationEdit",controller:"ControllerEdit",dummy:"DummyEdit",host:"HostEdit",link:"LinkEdit",port:"PortEdit",switch:"SwitchEdit"},de={association:"Association",controller:"Controller",dummy:"Label",host:"Host",link:"Link",port:"Port",switch:"Switch"},me={name:"ItemEdit",components:{AssociationEdit:wt,ControllerEdit:It,DummyEdit:Ot,HostEdit:zt,LinkEdit:Jt,PortEdit:te,SwitchEdit:ne},data:()=>({dialog:!1,fullscreen:!0,item:{},valid:!1}),computed:{component(){return ce[this.item.type]||"div"},headline(){return de[this.item.type]||""},themeType(){switch(this.item.type){case"association":case"link":return"edge";default:return this.item.type}}},methods:{edit(t,i){this.item=JSON.parse(JSON.stringify(t)),this.callback=i,this.fullscreen=!1,this.dialog=!0},save(){if(!this.valid)return;const t=JSON.parse(JSON.stringify(this.item));this.callback(t),this.close()},cancel(){this.callback(),this.close()},close(){this.item={},this.callback=null,this.dialog=!1}}},z={};var ue=h(me,re,le,!1,he,null,null,null);function he(t){for(let i in z)this[i]=z[i]}var pe=function(){return ue.exports}();const fe={false:{false:"set",true:"add"},true:{false:"del",true:"set"}};class ve{constructor(i,e,s,o){this._container=i,this._network=e,this._nodes=s,this._colors=o,this._drag=!1,this._rectDOM={}}attach(){this._mousedown=(...i)=>this._mousedownListener(...i),this._mousemove=(...i)=>this._mousemoveListener(...i),this._mouseup=(...i)=>this._mouseupListener(...i),this._afterDrawing=(...i)=>this._afterDrawingListener(...i),this._container.addEventListener("mousedown",this._mousedown),this._container.addEventListener("mousemove",this._mousemove),this._container.addEventListener("mouseup",this._mouseup),this._network.on("afterDrawing",this._afterDrawing),this._oncontextmenu=this._container.oncontextmenu,this._container.oncontextmenu=()=>!1}detach(){this._container.removeEventListener("mousedown",this._mousedown),this._container.removeEventListener("mousemove",this._mousemove),this._container.removeEventListener("mouseup",this._mouseup),this._network.off("afterDrawing",this._afterDrawing),this._container.oncontextmenu=this._oncontextmenu,this._network.redraw()}get _rectCanvas(){let{x:i,y:e}=this._network.DOMtoCanvas({x:this._rectDOM.startX,y:this._rectDOM.startY}),{x:s,y:o}=this._network.DOMtoCanvas({x:this._rectDOM.endX,y:this._rectDOM.endY});return[i,s]=this._orderPair(i,s),[e,o]=this._orderPair(e,o),{startX:i,startY:e,endX:s,endY:o}}_orderPair(i,e){return i<e?[i,e]:[e,i]}_selectNodes(i,e){const{startX:s,startY:o,endX:a,endY:n}=this._rectCanvas,l=this._nodes.get().filter(({id:c})=>{const{x:m,y:p}=this._network.getPositions(c)[c];return s<=m&&m<=a&&o<=p&&p<=n}).map(({id:c})=>c);this._network.selectNodes(this._prepareNodeSelection(l,i));const r={x:e.offsetX,y:e.offsetY};this._network.emit("select",{...this._network.getSelection(),event:e,pointer:{DOM:r,canvas:this._network.DOMtoCanvas(r)}})}_prepareNodeSelection(i,e){if(e==="set")return i;const s=this._network.getSelectedNodes();if(e==="add")return[...new Set([...s,...i])];if(e==="del")return s.filter(o=>!i.includes(o))}_mousedownListener({which:i,offsetX:e,offsetY:s}){i===3&&(this._rectDOM.startX=e-this._container.offsetLeft,this._rectDOM.startY=s-this._container.offsetTop,this._rectDOM.endX=e-this._container.offsetLeft,this._rectDOM.endY=s-this._container.offsetTop,this._drag=!0)}_mousemoveListener({which:i,offsetX:e,offsetY:s}){i!==3&&this._drag?(this._drag=!1,this._network.redraw()):this._drag&&(this._rectDOM.endX=e-this._container.offsetLeft,this._rectDOM.endY=s-this._container.offsetTop,this._network.redraw())}_mouseupListener({which:i,ctrlKey:e,shiftKey:s}){i===3&&(this._drag=!1,this._network.redraw(),this._selectNodes(fe[e][s],event))}_afterDrawingListener(i){if(this._drag){const{startX:e,startY:s,endX:o,endY:a}=this._rectCanvas;i.lineWidth=4,i.strokeStyle=this._colors.border,i.strokeRect(e,s,o-e,a-s),i.fillStyle=this._colors.background,i.fillRect(e,s,o-e,a-s)}}}let Y=null;function X(t,i){if(i.event.srcEvent.ctrlKey){const e=i.event;if(Y===e)return;Y=e,i.nodes.every(s=>i.previousSelection.nodes.indexOf(s)!==-1)&&i.edges.every(s=>i.previousSelection.edges.indexOf(s)!==-1)?t.setSelection({nodes:i.previousSelection.nodes.filter(s=>i.nodes.indexOf(s)===-1),edges:i.previousSelection.edges.filter(s=>i.edges.indexOf(s)===-1)}):t.setSelection({nodes:[...new Set([...i.nodes,...i.previousSelection.nodes])],edges:[...new Set([...i.edges,...i.previousSelection.edges])]})}}let y;const _e=new Uint8Array(16);function ye(){if(!y&&(y=typeof crypto!="undefined"&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto),!y))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return y(_e)}const d=[];for(let t=0;t<256;++t)d.push((t+256).toString(16).slice(1));function xe(t,i=0){return d[t[i+0]]+d[t[i+1]]+d[t[i+2]]+d[t[i+3]]+"-"+d[t[i+4]]+d[t[i+5]]+"-"+d[t[i+6]]+d[t[i+7]]+"-"+d[t[i+8]]+d[t[i+9]]+"-"+d[t[i+10]]+d[t[i+11]]+d[t[i+12]]+d[t[i+13]]+d[t[i+14]]+d[t[i+15]]}const be=typeof crypto!="undefined"&&crypto.randomUUID&&crypto.randomUUID.bind(crypto);var A={randomUUID:be};function x(t,i,e){if(A.randomUUID&&!i&&!t)return A.randomUUID();t=t||{};const s=t.random||(t.rng||ye)();if(s[6]=s[6]&15|64,s[8]=s[8]&63|128,i){e=e||0;for(let o=0;o<16;++o)i[e+o]=s[o];return i}return xe(s)}var ge=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("div",{staticClass:"component-container",attrs:{tabindex:"0"},on:{mousemove:t.moveMouseTag,drag:t.moveMouseTag,mouseover:t.focusRoot,keydown:t.keypress}},[t.loading!==!1?e("LoadingSpinner"):[e("VisCanvas",{attrs:{"data-cy":"vis",dark:t.dark},on:{ready:t.init}}),t.newItem.type!==""?e("div",{staticClass:"mouse-tag",style:{left:t.mouseTag.x+"px",top:t.mouseTag.y+"px"}},[e("v-icon",{attrs:{color:"black"}},[t._v(t._s(t.mouseTagIcon))])],1):t._e(),e("v-snackbar",{attrs:{"data-cy-type":t.snackbar.type,"data-cy-values":JSON.stringify(t.snackbar.values),"data-cy":"vis-snackbar"},model:{value:t.snackbar.show,callback:function(s){t.$set(t.snackbar,"show",s)},expression:"snackbar.show"}},[t._v(" "+t._s(t.snackbar.message)+" "),e("v-btn",{attrs:{color:"primary",text:""},on:{click:function(s){return t.snackbar.actionFunction()}}},[t._v(" "+t._s(t.snackbar.actionName)+" ")])],1)]],2)},we=[];function b(t=()=>{},i=0){let e=null;return()=>{window.clearTimeout(e),e=window.setTimeout(()=>{t(),e=null},i)}}const $e=new Map([["undone",()=>"Undone."],["redone",()=>"Redone."],["nothing-to-undo",()=>"Nothing more to undo."],["nothing-to-redo",()=>"Nothing more to redo."],["items-deleted",t=>`${t} item${t===1?"":"s"} deleted.`]]),ke={host:2,switch:6},g=["dummy","controller","switch","host","port"],Se={link:(t,i)=>t==="port"&&i==="port",association:(t,i)=>t==="controller"&&i==="switch"||t==="switch"&&i==="port"||t==="host"&&i==="port"||t==="dummy"},w={controller:"c1",host:"h1",port:"eth0",switch:"s1"},Pe={false:{Delete:"deleteSelected",Escape:"stopEditMode",a:"fitAll",c:"addController",d:"deleteSelected",e:"addEdge",f:"fitSelected",h:"addHost",i:"addIPsDummy",l:"addDummy",p:"addPort",s:"addSwitch",t:"addTypesDummy",z:"setScale"},true:{a:"selectAll",y:"redo",z:"undo"}},Ee={name:"VisContainer",components:{LoadingSpinner:W,VisCanvas:ht},data:()=>({dark:G,newItem:{type:null,connectTo:null,label:null,noEdit:!1,set(t,i,e,s){this.type=t||null,this.connectTo=i||null,this.label=e||null,this.noEdit=s||!1}},mouseTag:{x:0,y:0},snackbar:{show:!1,type:void 0,values:void 0,actionName:void 0,actionFunction:void 0,get message(){const t=$e.get(this.type);return t?t(...this.values):"Unknown message type."}}}),computed:{...K("topology",["data"]),loading(){return this.$store.state.loading},mouseTagIcon(){return"$vuetify.icons.net-"+this.newItem.type}},mounted(){this.focusRoot()},methods:{moveMouseTag({clientX:t,clientY:i}){this.mouseTag.x=t,this.mouseTag.y=i},addEdge(){this.newItem.set("edge"),this.net.addEdgeMode()},addController(){this.newItem.set("controller"),this.net.addNodeMode()},addDummy(){this.newItem.set("dummy"),this.net.addNodeMode()},addIPsDummy(){this.newItem.set("dummy",["port","host","switch","controller"],"{{IPS}}",!0),this.net.addNodeMode()},addTypesDummy(){this.newItem.set("dummy",["switch","controller"],"{{TYPES}}",!0),this.net.addNodeMode()},addHost(){this.newItem.set("host"),this.net.addNodeMode()},addPort(){this.newItem.set("port",["host","switch"]),this.net.addNodeMode()},addSwitch(){this.newItem.set("switch"),this.net.addNodeMode()},deleteSelected(){const{nodes:t,edges:i}=this.net.getSelection(),e=t.length+i.length;e&&(this.commit("removeItems",[...t,...i]),this.showSnackbar("items-deleted",[e],"Undo",this.undo),this.updateURLSelection())},selectAll(){this.net.setSelection({nodes:this.nodes.getIds(),edges:this.edges.getIds()}),this.updateURLPosition(),this.updateURLSelection()},fitAll(){this.net.fit({animation:!0}),this.clearURLPosition()},fitSelected(t=!0){this.net.fit({nodes:this.net.getSelectedNodes(),animation:t}),this.clearURLPosition()},setScale(t){this.net.moveTo({scale:t!=null?t:1,animation:!0}),this.updateURLPosition()},undo(){try{this.commit("undo"),this.showSnackbar("undone")}catch{this.showSnackbar("nothing-to-undo")}},redo(){try{this.commit("redo"),this.showSnackbar("redone")}catch{this.showSnackbar("nothing-to-redo")}},showSnackbar(t,i=[],e="Close",s=()=>{this.snackbar.show=!1}){this.snackbar.type=t,this.snackbar.values=i,this.snackbar.actionName=e,this.snackbar.actionFunction=s,this.snackbar.show=!1,window.setTimeout(()=>{this.snackbar.show=!0})},stopEditMode(){this.newItem.set(),this.net.disableEditMode()},async editItem(t,i){const e=this.data.items[t.id]||{id:t.id,type:t.group,hostname:t.label},s=await new Promise(o=>{this.$emit("edit-item",e,o)});return this.focusRoot(),s?(t.from&&t.to&&(s.from=t.from,s.to=t.to),i!==!1&&this.commit("replaceItems",[s]),{node:t,item:s}):(this.stopEditMode(),{})},commit(t,i){this.$store.dispatch(`topology/${t}`,i)},commitPositions(t){const i=this.net.getPositions(t),e=Object.keys(i).map(s=>({...i[s],id:s}));this.commit("updateItems",e)},commitUncommitedPositions(){const t=this.nodes.get().filter(({x:i,y:e})=>i==null||e==null).map(({id:i})=>i);t.length&&this.commitPositions(t)},orderNodes(t){const i=this.data.items[t.from].type,e=this.data.items[t.to].type;if(g.indexOf(i)>g.indexOf(e)){const s=t.from;t.from=t.to,t.to=s}},getEdgeType(t){const i=this.data.items[t.id];if(i&&i.type)return i.type;const e=this.data.items[t.from].type,s=this.data.items[t.to].type;return e==="port"&&s==="port"?"link":"association"},isEdgeValid(t,i){const e=this.data.items[t.from].type,s=this.data.items[t.to].type;return Se[i](e,s)},generateOrganizedPortCoors({x:t,y:i},e){const s=e<=8?50:30,o=e<=8?0:25,a=i+70,n=t-(e-1)*s/2;return[...Array(e)].map((l,r)=>({x:n+s*r,y:a+(r%2===0?o:0)}))},getConnectedNodes(t,i){return this.net.getConnectedNodes(t).map(e=>this.nodes.get(e)).filter(e=>e.group===i)},organizePorts(t){const i=this.getConnectedNodes(t.id,"port").sort(pt),e=this.generateOrganizedPortCoors(this.net.getPositions([t.id])[t.id],i.length);this.commit("updateItems",e.map((s,o)=>({...s,id:i[o].id})))},getNextHostname(t,i){if(!t.length)return i;const e=t.sort(ft)[t.length-1],s=/^(.*?)(\d+)([^\d]*?)$/.exec(e);if(s==null)return i;const[,o,a,n]=s;return`${o}${+a+1}${n}`},getNextFreeHostname(t,i){return t==="port"?i==null?w[t]:this.getNextHostname(this.getConnectedNodes(i,t).map(({id:e})=>this.data.items[e].hostname),w[t]):this.getNextHostname(this.nodes.get().filter(e=>e.group===t).map(({id:e})=>this.data.items[e].hostname),w[t])},getClosestId(t,i,e,s){const o=this.nodes.getIds().filter(r=>e.indexOf(this.data.items[r].type)!==-1),a=this.net.getPositions(o),n=o.map(r=>Math.hypot(a[r].x-t,a[r].y-i)),l=n.reduce((r,c,m)=>c<n[r]?m:r,0);return n[l]<=s?o[l]:null},focusRoot(){this.$el.focus()},keypress(t){const i=Pe[t.ctrlKey][t.key];i&&(t.preventDefault(),this[i]())},async routerPush(...t){try{return await this.$router.push(...t)}catch(i){if(i.name!=="NavigationDuplicated")throw i}},clearURLPosition(){return this.routerPush({name:"Canvas without position",params:{ids:this.$route.params.ids}})},updateURLPosition(){const{x:t,y:i}=this.net.getViewPosition(),e=this.net.getScale();return this.routerPush({name:"Canvas with position",params:{ids:this.$route.params.ids,x:Math.round(t),y:Math.round(i),scale:Math.round(e*1e3)/1e3||.001}})},updateURLSelection(){const{nodes:t,edges:i}=this.net.getSelection();let e;return t.length||i.length?e=[...t,...i].join(","):e=null,this.routerPush({params:{...this.$route.params,ids:e}})},applyURL(){const{ids:t,x:i,y:e,scale:s}=this.$route.params;if(t){const o=t.split(",");this.net.setSelection({nodes:o.filter(a=>this.nodes.get(a)),edges:o.filter(a=>this.edges.get(a))})}i!=null&&e!=null&&s!=null?this.net.moveTo({position:{x:+i,y:+e},scale:+s}):this.fitSelected(!1)},init({container:t,net:i,nodes:e,edges:s}){this.net=i,this.nodes=e,this.edges=s,this.commitUncommitedPositions(),this.net.setOptions({manipulation:{enabled:!1,addNode:async(a,n)=>{n();const l={...this.newItem};this.newItem.set(),a.group=l.type,a.label=l.label;const r=l.connectTo?this.getClosestId(a.x,a.y,l.connectTo,500):null;a.label=l.label||(w[a.group]?this.getNextFreeHostname(a.group,r):"");const{node:c,item:m}=l.noEdit?{node:a,item:{id:a.id,type:a.group,hostname:a.label}}:await this.editItem(a,!1);if(!c)return;m.x=c.x,m.y=c.y;const p=[m];if(r!=null){const u={id:x()};g.indexOf(m.type)>g.indexOf(this.data.items[r].type)?(u.from=r,u.to=c.id):(u.from=c.id,u.to=r),p.push({id:u.id,type:"association",from:u.from,to:u.to})}const P=ke[c.group]||0;if(P>0){const u=this.generateOrganizedPortCoors(c,P);for(let v=0;v<P;++v){const E={id:x(),label:`eth${v}`,group:"port",...u[v]};p.push({id:E.id,hostname:E.label,type:"port",...u[v]});const C={id:x(),from:c.id,to:E.id};p.push({id:C.id,type:"association",from:C.from,to:C.to})}}this.commit("replaceItems",p)},editNode:async(a,n)=>{this.newItem.set(),await this.editItem(a),n()},addEdge:async(a,n)=>{n(),this.orderNodes(a);const l=this.getEdgeType(a);this.isEdgeValid(a,l)&&(a.id=a.id||x(),a.group=l,a.label="",await this.editItem(a)),this.newItem.set()},editEdge:async(a,n)=>{this.orderNodes(a),this.isEdgeValid(a,this.getEdgeType(a))&&await this.editItem(a),n(),this.newItem.set()}}}),this.net.on("deselectNode",X.bind(null,this.net)),this.net.on("deselectEdge",X.bind(null,this.net)),this.net.on("doubleClick",async a=>{if(a.nodes.length===0&&a.edges.length===1){const n=a.edges[0];await this.editItem(this.edges.get(n))}else a.nodes.length===1&&this.net.editNode()}),this.net.on("hold",a=>{if(a.nodes.length===0&&a.edges.length===1)this.net.editEdgeMode();else if(a.nodes.length===1){const n=this.nodes.get(a.nodes[0]);(n.group==="host"||n.group==="switch")&&this.organizePorts(n)}}),this.net.on("dragEnd",a=>{a.nodes.length>0&&this.commitPositions(a.nodes)}),this.net.on("dragStart",a=>{if(a.nodes.length!==1)return;const n=this.data.items[a.nodes[0]];if(!(n.type==="host"||n.type==="switch"))return;const l=new Set;this.net.getSelectedEdges().forEach(c=>{const m=this.edges.get(c);l.add(m.to),l.add(m.from)});const r=[...l].filter(c=>this.data.items[c].type==="port");r.length&&this.net.selectNodes([a.nodes[0],...r])}),this.net.on("dragEnd",b(this.updateURLPosition)),this.net.on("select",b(this.updateURLPosition)),this.net.on("select",b(this.updateURLSelection)),this.net.on("zoom",b(this.updateURLPosition,200)),this.applyURL(),new ve(t,this.net,this.nodes,Z).attach()}}},Q={};var Ce=h(Ee,ge,we,!1,Le,"158ed016",null,null);function Le(t){for(let i in Q)this[i]=Q[i]}var Ie=function(){return Ce.exports}(),Me=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("div",{staticClass:"canvas-container"},[t.loading!==!1?e("LoadingSpinner"):[e("VisContainer",{ref:"vis",on:{"edit-item":t.editItem}}),e("Edit",{ref:"edit"}),t.isView?t._e():e("v-speed-dial",{staticStyle:{position:"fixed"},attrs:{bottom:"",right:"","open-on-hover":""},scopedSlots:t._u([{key:"activator",fn:function(){return[e("v-btn",{attrs:{fab:"",dark:"",color:"primary","data-cy":"fab-activator"},model:{value:t.fab,callback:function(s){t.fab=s},expression:"fab"}},[t.fab?e("v-icon",[t._v("mdi-chevron-down")]):e("v-icon",[t._v("mdi-chevron-up")])],1)]},proxy:!0}],null,!1,3737180510),model:{value:t.fab,callback:function(s){t.fab=s},expression:"fab"}},[e("v-btn",{attrs:{color:t.theme.edge.menu,fab:"",dark:"",small:"",title:"Edge","data-cy":"fab-edge"},on:{click:function(s){return t.$refs.vis.addEdge()}}},[e("v-icon",[t._v("$vuetify.icons.net-edge")])],1),e("v-btn",{attrs:{color:t.theme.port.menu,fab:"",dark:"",small:"",title:"Port","data-cy":"fab-port"},on:{click:function(s){return t.$refs.vis.addPort()}}},[e("v-icon",[t._v("$vuetify.icons.net-port")])],1),e("v-btn",{attrs:{color:t.theme.host.menu,fab:"",dark:"",small:"",title:"Host","data-cy":"fab-host"},on:{click:function(s){return t.$refs.vis.addHost()}}},[e("v-icon",[t._v("$vuetify.icons.net-host")])],1),e("v-btn",{attrs:{color:t.theme.switch.menu,fab:"",dark:"",small:"",title:"Switch","data-cy":"fab-switch"},on:{click:function(s){return t.$refs.vis.addSwitch()}}},[e("v-icon",[t._v("$vuetify.icons.net-switch")])],1),e("v-btn",{attrs:{color:t.theme.controller.menu,fab:"",dark:"",small:"",title:"Controller","data-cy":"fab-controller"},on:{click:function(s){return t.$refs.vis.addController()}}},[e("v-icon",[t._v("$vuetify.icons.net-controller")])],1),e("v-btn",{attrs:{color:t.theme.dummy.menu,fab:"",dark:"",small:"",title:"Label","data-cy":"fab-dummy"},on:{click:function(s){return t.$refs.vis.addDummy()}}},[e("v-icon",[t._v("$vuetify.icons.net-label")])],1),e("v-btn",{attrs:{fab:"",dark:"",small:"",color:"red",title:"Delete","data-cy":"fab-delete"},on:{click:function(s){return t.$refs.vis.deleteSelected()}}},[e("v-icon",[t._v("mdi-delete")])],1)],1)]],2)},Te=[];const Ne={name:"CanvasPage",components:{Edit:pe,LoadingSpinner:W,VisContainer:Ie},data:()=>({fab:!1,theme:tt}),computed:{loading(){return this.$store.state.loading},isView(){return this.$route.meta.isView}},methods:{editItem(t,i){this.$refs.edit.edit(t,i)}}},q={};var Re=h(Ne,Me,Te,!1,De,"c81ae480",null,null);function De(t){for(let i in q)this[i]=q[i]}var He=function(){return Re.exports}();export{He as default};
