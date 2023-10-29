import{L as l,y as r,z as o,a as c}from"./LoadingSpinner.7f27fdd4.js";import{T as p}from"./ThreeStateCheckbox.553c382a.js";import{m,n as u}from"./js/app-7e4dd231.js";var v=function(){var t=this,n=t.$createElement,e=t._self._c||n;return e("v-container",{attrs:{"grid-list-md":""}},[t.loading!==!1?e("LoadingSpinner"):[e("v-layout",{attrs:{wrap:""}},[e("v-flex",{class:{"pr-4":t.$vuetify.breakpoint.lgAndUp},attrs:{xs12:"",lg6:""}},[e("v-layout",{attrs:{wrap:""}},[e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{clearable:"","data-cy":"mininet-settings-project-name",label:"Project Name"},model:{value:t.projectName,callback:function(a){t.projectName=a},expression:"projectName"}})],1),e("v-flex",{attrs:{xs12:"","data-cy":"mininet-settings-log-level"}},[e("v-select",{attrs:{items:t.logLevels,clearable:"",label:"Log Level"},model:{value:t.logLevel,callback:function(a){t.logLevel=a},expression:"logLevel"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{attrs:{rules:[t.validators.ipWithMask(t.ipBase)],clearable:"","data-cy":"mininet-settings-ip-base",label:"IP Base"},model:{value:t.ipBase,callback:function(a){t.ipBase=a},expression:"ipBase"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-text-field",{ref:"listenPortBase",attrs:{rules:[t.validators.port(t.listenPortBase)],clearable:"","data-cy":"mininet-settings-listen-port-base",label:"Base Listening Port",max:"65535",min:"1",type:"number"},model:{value:t.listenPortBase,callback:function(a){t.listenPortBase=t._n(a)},expression:"listenPortBase"}})],1),e("v-flex",{attrs:{xs12:""}},[e("ThreeStateCheckbox",{attrs:{"data-cy":"mininet-settings-auto-set-mac",label:"Automatic MAC Addresses"},model:{value:t.autoSetMAC,callback:function(a){t.autoSetMAC=a},expression:"autoSetMAC"}})],1),e("v-flex",{attrs:{xs12:""}},[e("ThreeStateCheckbox",{attrs:{"data-cy":"mininet-settings-auto-static-arp",label:"Automatic Static ARP"},model:{value:t.autoStaticARP,callback:function(a){t.autoStaticARP=a},expression:"autoStaticARP"}})],1),e("v-flex",{attrs:{xs12:""}},[e("ThreeStateCheckbox",{attrs:{"data-cy":"mininet-settings-in-namespace",label:"In Namespace"},model:{value:t.inNamespace,callback:function(a){t.inNamespace=a},expression:"inNamespace"}})],1),e("v-flex",{attrs:{xs12:""}},[e("ThreeStateCheckbox",{attrs:{"data-cy":"mininet-settings-spawn-terminals",label:"Spawn Terminals"},model:{value:t.spawnTerminals,callback:function(a){t.spawnTerminals=a},expression:"spawnTerminals"}})],1)],1)],1),e("v-flex",{class:{"pl-4":t.$vuetify.breakpoint.lgAndUp},attrs:{xs12:"",lg6:""}},[e("v-layout",{attrs:{wrap:""}},[e("v-flex",{attrs:{xs12:""}},[e("v-textarea",{staticClass:"monospace-input",attrs:{"auto-grow":"",clearable:"","data-cy":"mininet-settings-start-script",label:"Startup Script"},model:{value:t.startScript,callback:function(a){t.startScript=a},expression:"startScript"}})],1),e("v-flex",{attrs:{xs12:""}},[e("v-textarea",{staticClass:"monospace-input",attrs:{"auto-grow":"",clearable:"","data-cy":"mininet-settings-stop-script",label:"Shutdown Script"},model:{value:t.stopScript,callback:function(a){t.stopScript=a},expression:"stopScript"}})],1)],1)],1)],1)]],2)},x=[];function s(t){this.get=function(){return this.data[t]},this.set=function(n){this.$store.commit("topology/setValues",{[t]:n})}}const d={name:"MininetSettiongsPage",components:{LoadingSpinner:l,ThreeStateCheckbox:p},data:()=>({logLevels:r,validators:{ipWithMask:o,port:c}}),computed:{...m("topology",["data"]),loading(){return this.$store.state.loading},autoSetMAC:new s("autoSetMAC"),autoStaticARP:new s("autoStaticARP"),inNamespace:new s("inNamespace"),ipBase:new s("ipBase"),listenPortBase:new s("listenPortBase"),logLevel:new s("logLevel"),projectName:new s("projectName"),spawnTerminals:new s("spawnTerminals"),startScript:new s("startScript"),stopScript:new s("stopScript")}},i={};var f=u(d,v,x,!1,g,null,null,null);function g(t){for(let n in i)this[n]=i[n]}var h=function(){return f.exports}();export{h as default};
