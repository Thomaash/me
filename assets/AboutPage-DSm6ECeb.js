import{af as A,ah as i,H as o,aQ as N,a7 as l,G as t,aa as p,ai as a,V as R,aj as s,a5 as C,ak as S,al as _,an as r}from"./js/app-B9x-NTsx.js";import{A as L,a as b}from"./AppLogo-DnT63PoH.js";import{b as D,V as H,a as m}from"./VRow-ClKh2RL0.js";import"./VCard-ChSMr7_u.js";const h={name:"BuildInfo",computed:{buildDate(){return"2025-10-23T04:06:32.628Z"},buildCommitHash(){return"7d1e60c47790f1c65cb935c915bc23ae64f94b86"},buildCommitDate(){return"2025-10-23T04:04:25.000Z"}}},g={key:0};function B(u,e,T,I,E,n){return s(),i("section",null,[e[4]||(e[4]=o("h3",{class:"headline"},"Build",-1)),o("p",null,[l(" Build date: "+p(n.buildDate)+" ",1),e[1]||(e[1]=o("br",null,null,-1)),l(" Commit date: "+p(n.buildCommitDate)+" ",1),e[2]||(e[2]=o("br",null,null,-1)),l(" Commit hash: "+p(n.buildCommitHash)+" ",1),e[3]||(e[3]=o("br",null,null,-1)),t(R,{class:"ma-2",variant:"outlined",color:"primary",target:"_blank",href:"https://github.com/Thomaash/me/commit/"+n.buildCommitHash},{default:a(()=>[...e[0]||(e[0]=[l(" Open on GitHub ",-1)])]),_:1},8,["href"])]),u.$store.state.isUpdateAvailable?(s(),i("p",g," A new version is available and will be automatically installed when you close all open tabs. ")):N("",!0)])}const F=A(h,[["render",B]]),V=`ISC License

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
`,y={name:"AppLicense",computed:{license(){return V.split(/\n\n/g)}}},$=["textContent"];function G(u,e,T,I,E,n){return s(),i("section",null,[e[0]||(e[0]=o("h3",{class:"headline"},"License",-1)),(s(!0),i(C,null,S(n.license,(c,d)=>(s(),i("p",{key:"license_p_"+d,textContent:p(c)},null,8,$))),128))])}const U=A(y,[["render",G]]),w={name:"AboutPage",components:{BuildInfo:F,AppDescription:b,AppLicense:U,AppLogo:L}};function W(u,e,T,I,E,n){const c=r("AppLogo"),d=r("AppDescription"),O=r("AppLicense"),f=r("BuildInfo");return s(),_(D,{"grid-list-md":""},{default:a(()=>[t(H,{wrap:""},{default:a(()=>[t(c),t(m,{cols:"12"},{default:a(()=>[t(d,{full:""})]),_:1}),t(m,{cols:"12"},{default:a(()=>[t(O)]),_:1}),t(m,{cols:"12"},{default:a(()=>[t(f)]),_:1})]),_:1})]),_:1})}const M=A(w,[["render",W]]);export{M as default};
