import{m as c,n as u}from"./js/app-cef99652.js";var h=function(){var t=this,o=t.$createElement,n=t._self._c||o;return n("div",t._l(t.items,function(e,a){var s=e.icon,r=e.text,d=e.action,l=e.enabled;return n("v-btn",{key:a,attrs:{disabled:!l,dark:"",icon:""},on:{click:d}},[n("v-icon",{attrs:{alt:r}},[t._v(t._s(s))])],1)}),1)},p=[];const v={name:"TopologyToolbar",props:{undoRedo:{type:Boolean,default:!1}},computed:{...c("topology",["canUndo","canRedo"]),show(){return!!this.items.length},viewURL(){return this.$route.name.startsWith("Canvas")?`/view${this.$route.fullPath}`:"/view/canvas"},items(){return[{icon:"mdi-undo",text:"Undo",action:()=>{this.$store.dispatch("topology/undo")},show:this.undoRedo,enabled:this.canUndo},{icon:"mdi-redo",text:"Redo",action:()=>{this.$store.dispatch("topology/redo")},show:this.undoRedo,enabled:this.canRedo},{icon:"mdi-open-in-new",text:"Open a new view",action:this.openViewPopup,show:!0,enabled:!0}].filter(({show:t})=>t)}},methods:{openViewPopup(){window.open(`${this.$router.mode==="hash"?"#":""}${this.viewURL}`,"","_blank")}}},i={};var m=u(v,h,p,!1,_,null,null,null);function _(t){for(let o in i)this[o]=i[o]}var b=function(){return m.exports}();export{b as default};
