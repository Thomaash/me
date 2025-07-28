import{ab as A,ad as i,E as o,aM as R,a4 as r,D as t,a6 as p,ae as a,V as b,af as s,a2 as f,ag as C,ah as S,aj as l}from"./js/app-Az62Lp1T.js";import{A as _,a as L}from"./AppLogo-D4tynFkL.js";import{b as D,V as h,a as m}from"./VRow-BB521EJa.js";import"./VCard-B56Cj1J-.js";const H={name:"BuildInfo",computed:{buildDate(){return"2025-07-28T12:11:11.211Z"},buildCommitHash(){return"baa9a655bbcbc9e576cbb97c69bd32a18c2cb460"},buildCommitDate(){return"2025-07-28T12:09:16.000Z"}}},g={key:0};function B(c,e,T,E,I,n){return s(),i("section",null,[e[4]||(e[4]=o("h3",{class:"headline"},"Build",-1)),o("p",null,[r(" Build date: "+p(n.buildDate)+" ",1),e[1]||(e[1]=o("br",null,null,-1)),r(" Commit date: "+p(n.buildCommitDate)+" ",1),e[2]||(e[2]=o("br",null,null,-1)),r(" Commit hash: "+p(n.buildCommitHash)+" ",1),e[3]||(e[3]=o("br",null,null,-1)),t(b,{class:"ma-2",variant:"outlined",color:"primary",target:"_blank",href:"https://github.com/Thomaash/me/commit/"+n.buildCommitHash},{default:a(()=>e[0]||(e[0]=[r(" Open on GitHub ",-1)])),_:1,__:[0]},8,["href"])]),c.$store.state.isUpdateAvailable?(s(),i("p",g," A new version is available and will be automatically installed when you close all open tabs. ")):R("",!0)])}const F=A(H,[["render",B]]),V=`ISC License

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
`,y={name:"AppLicense",computed:{license(){return V.split(/\n\n/g)}}},$=["textContent"];function U(c,e,T,E,I,n){return s(),i("section",null,[e[0]||(e[0]=o("h3",{class:"headline"},"License",-1)),(s(!0),i(f,null,C(n.license,(u,d)=>(s(),i("p",{key:"license_p_"+d,textContent:p(u)},null,8,$))),128))])}const w=A(y,[["render",U]]),G={name:"AboutPage",components:{BuildInfo:F,AppDescription:L,AppLicense:w,AppLogo:_}};function W(c,e,T,E,I,n){const u=l("AppLogo"),d=l("AppDescription"),O=l("AppLicense"),N=l("BuildInfo");return s(),S(D,{"grid-list-md":""},{default:a(()=>[t(h,{wrap:""},{default:a(()=>[t(u),t(m,{cols:"12"},{default:a(()=>[t(d,{full:""})]),_:1}),t(m,{cols:"12"},{default:a(()=>[t(O)]),_:1}),t(m,{cols:"12"},{default:a(()=>[t(N)]),_:1})]),_:1})]),_:1})}const k=A(G,[["render",W]]);export{k as default};
