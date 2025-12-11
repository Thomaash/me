import{ag as A,ai as i,I as o,aR as N,a8 as l,H as t,ab as p,aj as a,V as f,ak as s,a6 as C,al as S,am as b,ao as r}from"./js/app-D6zCORKT.js";import{A as _,a as L}from"./AppLogo-CCr9gXcK.js";import{b as D,V as H,a as m}from"./VRow-B5D8lRV0.js";import"./VCard-CRT8-twW.js";const h={name:"BuildInfo",computed:{buildDate(){return"2025-12-11T03:00:08.483Z"},buildCommitHash(){return"129ed86e3b70743a95b528305e9dd5527bb7066a"},buildCommitDate(){return"2025-12-11T02:59:24.000Z"}}},g={key:0};function B(u,e,I,T,E,n){return s(),i("section",null,[e[4]||(e[4]=o("h3",{class:"headline"},"Build",-1)),o("p",null,[l(" Build date: "+p(n.buildDate)+" ",1),e[1]||(e[1]=o("br",null,null,-1)),l(" Commit date: "+p(n.buildCommitDate)+" ",1),e[2]||(e[2]=o("br",null,null,-1)),l(" Commit hash: "+p(n.buildCommitHash)+" ",1),e[3]||(e[3]=o("br",null,null,-1)),t(f,{class:"ma-2",variant:"outlined",color:"primary",target:"_blank",href:"https://github.com/Thomaash/me/commit/"+n.buildCommitHash},{default:a(()=>[...e[0]||(e[0]=[l(" Open on GitHub ",-1)])]),_:1},8,["href"])]),u.$store.state.isUpdateAvailable?(s(),i("p",g," A new version is available and will be automatically installed when you close all open tabs. ")):N("",!0)])}const F=A(h,[["render",B]]),V=`ISC License

Copyright (c) 2018-2025, Tomáš Vyčítal

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
`,y={name:"AppLicense",computed:{license(){return V.split(/\n\n/g)}}},$=["textContent"];function U(u,e,I,T,E,n){return s(),i("section",null,[e[0]||(e[0]=o("h3",{class:"headline"},"License",-1)),(s(!0),i(C,null,S(n.license,(d,c)=>(s(),i("p",{key:"license_p_"+c,textContent:p(d)},null,8,$))),128))])}const w=A(y,[["render",U]]),G={name:"AboutPage",components:{BuildInfo:F,AppDescription:L,AppLicense:w,AppLogo:_}};function W(u,e,I,T,E,n){const d=r("AppLogo"),c=r("AppDescription"),O=r("AppLicense"),R=r("BuildInfo");return s(),b(D,{"grid-list-md":""},{default:a(()=>[t(H,{wrap:""},{default:a(()=>[t(d),t(m,{cols:"12"},{default:a(()=>[t(c,{full:""})]),_:1}),t(m,{cols:"12"},{default:a(()=>[t(O)]),_:1}),t(m,{cols:"12"},{default:a(()=>[t(R)]),_:1})]),_:1})]),_:1})}const M=A(G,[["render",W]]);export{M as default};
