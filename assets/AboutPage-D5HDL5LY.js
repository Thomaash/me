import{a8 as A,aa as i,ab as o,aK as R,a1 as r,D as t,a3 as p,ac as a,V as f,ad as s,$ as C,ae as S,af as _,ah as l}from"./js/app-BxgD8KPx.js";import{A as b,a as L}from"./AppLogo-4xLWfhFC.js";import{b as D,V as h,a as m}from"./VRow-Du9pmzef.js";import"./VCard-BwgZkz1S.js";const H={name:"BuildInfo",computed:{buildDate(){return"2025-05-22T04:23:43.352Z"},buildCommitHash(){return"5ccb7b7c1dbdd2bd36247cd1d26d6126d4863e79"},buildCommitDate(){return"2025-05-22T04:22:04.000Z"}}},g={key:0};function B(d,e,T,I,E,n){return s(),i("section",null,[e[4]||(e[4]=o("h3",{class:"headline"},"Build",-1)),o("p",null,[r(" Build date: "+p(n.buildDate)+" ",1),e[1]||(e[1]=o("br",null,null,-1)),r(" Commit date: "+p(n.buildCommitDate)+" ",1),e[2]||(e[2]=o("br",null,null,-1)),r(" Commit hash: "+p(n.buildCommitHash)+" ",1),e[3]||(e[3]=o("br",null,null,-1)),t(f,{class:"ma-2",variant:"outlined",color:"primary",target:"_blank",href:"https://github.com/Thomaash/me/commit/"+n.buildCommitHash},{default:a(()=>e[0]||(e[0]=[r(" Open on GitHub ")])),_:1,__:[0]},8,["href"])]),d.$store.state.isUpdateAvailable?(s(),i("p",g," A new version is available and will be automatically installed when you close all open tabs. ")):R("",!0)])}const F=A(H,[["render",B]]),V=`ISC License

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
`,$={name:"AppLicense",computed:{license(){return V.split(/\n\n/g)}}},y=["textContent"];function U(d,e,T,I,E,n){return s(),i("section",null,[e[0]||(e[0]=o("h3",{class:"headline"},"License",-1)),(s(!0),i(C,null,S(n.license,(u,c)=>(s(),i("p",{key:"license_p_"+c,textContent:p(u)},null,8,y))),128))])}const w=A($,[["render",U]]),G={name:"AboutPage",components:{BuildInfo:F,AppDescription:L,AppLicense:w,AppLogo:b}};function W(d,e,T,I,E,n){const u=l("AppLogo"),c=l("AppDescription"),O=l("AppLicense"),N=l("BuildInfo");return s(),_(D,{"grid-list-md":""},{default:a(()=>[t(h,{wrap:""},{default:a(()=>[t(u),t(m,{cols:"12"},{default:a(()=>[t(c,{full:""})]),_:1}),t(m,{cols:"12"},{default:a(()=>[t(O)]),_:1}),t(m,{cols:"12"},{default:a(()=>[t(N)]),_:1})]),_:1})]),_:1})}const k=A(G,[["render",W]]);export{k as default};
