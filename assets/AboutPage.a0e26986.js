import{n as s}from"./js/app-25041578.js";import{A as c,a as _}from"./AppLogo.f8fff0a5.js";var u=function(){var e=this,n=e.$createElement,t=e._self._c||n;return t("section",[t("h3",{staticClass:"headline"},[e._v("Build")]),t("p",[e._v(" Build date: "+e._s(e.buildDate)+" "),t("br"),e._v(" Commit date: "+e._s(e.buildCommitDate)+" "),t("br"),e._v(" Commit hash: "),t("a",{attrs:{href:"https://github.com/Thomaash/me/commit/"+e.buildCommitHash}},[e._v(" "+e._s(e.buildCommitHash)+" ")])]),e.$store.state.isUpdateAvailable?t("p",[e._v(" A new version is available and will be automatically installed when you close all open tabs. ")]):e._e()])},p=[];const A={name:"BuildInfo",computed:{buildDate(){return"2024-03-14T04:01:44.117Z"},buildCommitHash(){return"e7575613efb3063bc2c895cf80b715a10f7c3f7a"},buildCommitDate(){return"2024-03-14T04:00:14.000Z"}}},r={};var v=s(A,u,p,!1,m,null,null,null);function m(e){for(let n in r)this[n]=r[n]}var E=function(){return v.exports}(),d=`ISC License

Copyright (c) 2018-2023, Tom\xE1\u0161 Vy\u010D\xEDtal

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
`,T=function(){var e=this,n=e.$createElement,t=e._self._c||n;return t("section",[t("h3",{staticClass:"headline"},[e._v("License")]),e._l(e.license,function(a,l){return t("p",{key:"license_p_"+l,domProps:{textContent:e._s(a)}})})],2)},I=[];const f={name:"AppLicense",computed:{license(){return d.split(/\n\n/g)}}},i={};var R=s(f,T,I,!1,O,null,null,null);function O(e){for(let n in i)this[n]=i[n]}var h=function(){return R.exports}(),S=function(){var e=this,n=e.$createElement,t=e._self._c||n;return t("v-container",{attrs:{"grid-list-md":""}},[t("v-layout",{attrs:{wrap:""}},[t("AppLogo"),t("v-flex",{attrs:{xs12:""}},[t("AppDescription",{attrs:{full:""}})],1),t("v-flex",{attrs:{xs12:""}},[t("AppLicense")],1),t("v-flex",{attrs:{xs12:""}},[t("BuildInfo")],1)],1)],1)},N=[];const C={name:"AboutPage",components:{BuildInfo:E,AppDescription:c,AppLicense:h,AppLogo:_}},o={};var L=s(C,S,N,!1,b,null,null,null);function b(e){for(let n in o)this[n]=o[n]}var F=function(){return L.exports}();export{F as default};
