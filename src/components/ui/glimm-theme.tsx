"use client"

import * as React from "react"
import { accentChain } from "glimm"
import { GlimmScope, type GlimmScopeHandle } from "glimm/react"

const palettes = {
  dark: accentChain(["#FF8D28", "#FF2D55", "#CB30E0", "#6155F5"]),
  light: accentChain(["#00C8B3", "#00C0E8", "#0088FF", "#6155F5"]),
}
const colors = {
  light: { canvas:"#fff", panel:"#fff", line:"rgba(0,0,0,.08)", sk:"rgba(0,0,0,.07)", hi:"rgba(0,0,0,.13)", track:"#ECECED", chip:"#fff", shadow:"0 1px 2px rgba(0,0,0,.18)", icon:"#1B1C1D", dim:"#B6B6BB" },
  dark: { canvas:"#141517", panel:"#1F2125", line:"rgba(255,255,255,.10)", sk:"rgba(255,255,255,.08)", hi:"rgba(255,255,255,.17)", track:"#0C0D0F", chip:"#35373D", shadow:"0 1px 2px rgba(0,0,0,.55)", icon:"#F2F2F4", dim:"#6B6D73" },
}

function Bar({ c, width, height = 8, hi = false }: { c: typeof colors.light; width: number | string; height?: number; hi?: boolean }) { return <span aria-hidden="true" style={{ background: hi ? c.hi : c.sk, borderRadius: 4, display: "block", height, width }} /> }
function NavRow({ c, width, active }: { c: typeof colors.light; width: number; active?: boolean }) { return <div style={{ alignItems:"center", background:active?c.sk:"transparent", borderRadius:6, display:"flex", gap:9, margin:"0 -8px", padding:"6px 8px" }}><span style={{ background:active?c.hi:c.sk, borderRadius:4, height:14, width:14 }} /><Bar c={c} width={width} /></div> }

function ThemeScene() {
  const scope = React.useRef<GlimmScopeHandle>(null)
  const button = React.useRef<HTMLButtonElement>(null)
  const [theme, setTheme] = React.useState<"light"|"dark">("light")
  const [intent, setIntent] = React.useState<"light"|"dark">("light")
  const [busy, setBusy] = React.useState(false)
  const [used, setUsed] = React.useState(false)
  const c = colors[theme]
  const toggle = () => {
    if (busy) return
    const next = intent === "light" ? "dark" : "light"
    setIntent(next); setBusy(true); setUsed(true)
    const rect = button.current?.getBoundingClientRect()
    scope.current?.play({ at: rect ? [rect.left+rect.width/2,rect.top+rect.height/2] : undefined, anticipate:true, change:()=>setTheme(next), onBurst:()=>setBusy(false) })
  }
  return <GlimmScope ref={scope} palette={palettes[intent === "light" ? "dark" : "light"]} sweepMs={2700} style={{ inset:0, position:"absolute" }}><main style={{ background:c.canvas, color:c.icon, display:"flex", flexDirection:"column", fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif", height:"100%", minHeight:560, overflow:"hidden" }}>
    <header style={{ alignItems:"center", background:c.panel, borderBottom:`1px solid ${c.line}`, display:"flex", height:54, justifyContent:"space-between", padding:"0 16px" }}><div style={{ alignItems:"center", display:"flex", gap:12 }}><Bar c={c} height={14} hi width={52} /><span style={{ background:c.line, height:18, width:1 }} /><Bar c={c} width={84} /></div><div style={{ alignItems:"center", display:"flex", gap:16 }}><Bar c={c} width={38} /><Bar c={c} width={38} /><div style={{ display:"inline-flex", position:"relative" }}><button ref={button} aria-label="Theme" aria-checked={intent === "dark"} disabled={busy} onClick={toggle} role="switch" style={{ background:c.track, border:0, borderRadius:999, height:30, padding:0, position:"relative", width:60 }}><span style={{ background:c.chip, borderRadius:999, boxShadow:c.shadow, height:24, left:3, position:"absolute", top:3, transform:intent === "dark"?"translateX(27px)":"none", transition:"transform 180ms ease", width:27 }} /><span style={{ alignItems:"center", color:intent === "dark"?c.dim:c.icon, display:"flex", fontSize:14, height:24, justifyContent:"center", left:3, position:"absolute", top:3, width:27 }}>☀</span><span style={{ alignItems:"center", color:intent === "dark"?c.icon:c.dim, display:"flex", fontSize:13, height:24, justifyContent:"center", position:"absolute", right:3, top:3, width:27 }}>●</span></button>{!used && <span aria-hidden="true" style={{ fontFamily:"cursive", fontSize:17, position:"absolute", right:68, top:3, transform:"rotate(-2deg)", whiteSpace:"nowrap" }}>Toggle the theme →</span>}</div></div></header>
    <div style={{ display:"flex", flex:1, minHeight:0 }}><aside style={{ background:c.panel, borderRight:`1px solid ${c.line}`, flexShrink:0, overflow:"hidden", padding:"16px 12px", width:230 }}><Bar c={c} width={54} /><div style={{ height:14 }} />{[120,100,138,96,110].map((w,i)=><NavRow active={i===0} c={c} key={w} width={w} />)}<div style={{ height:22 }} /><Bar c={c} width={42} /><div style={{ height:14 }} />{[112,130,92].map(w=><NavRow c={c} key={w} width={w} />)}</aside>
      <section style={{ background:c.canvas, flex:1, minWidth:0, overflow:"auto", padding:"30px 30px 44px" }}><div style={{ margin:"0 auto", maxWidth:820 }}><div style={{ display:"grid", gap:9 }}><Bar c={c} height={17} hi width={168} /><Bar c={c} width={256} /></div><div style={{ display:"flex", gap:9, marginTop:22 }}>{[64,78,58,70].map((w,i)=><span key={w} style={{ background:i===0?c.hi:c.sk, borderRadius:999, height:28, width:w }} />)}</div><div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(2,1fr)", marginTop:18 }}>{[0,1,2,3].map(i=><div key={i} style={{ background:c.panel, border:`1px solid ${c.line}`, borderRadius:12, overflow:"hidden" }}><div style={{ background:c.sk, height:110 }} /><div style={{ display:"grid", gap:9, padding:14 }}><Bar c={c} height={10} hi width="82%" /><Bar c={c} width="58%" /><div style={{ alignItems:"center", display:"flex", gap:8, marginTop:4 }}><span style={{ background:c.sk, borderRadius:999, height:18, width:18 }} /><Bar c={c} height={7} width={70} /></div></div></div>)}</div><div style={{ background:c.panel, border:`1px solid ${c.line}`, borderRadius:12, marginTop:16, padding:18 }}><Bar c={c} height={9} hi width={120} /><div style={{ display:"grid", gap:14, marginTop:16 }}>{[[190,116],[156,96],[214,130]].map(([a,b])=><div key={a} style={{ alignItems:"center", display:"flex", gap:12 }}><span style={{ background:c.sk, borderRadius:999, height:30, width:30 }} /><div style={{ display:"grid", flex:1, gap:6 }}><Bar c={c} width={a} /><Bar c={c} height={6} width={b} /></div><Bar c={c} height={7} width={40} /></div>)}</div></div></div></section>
    </div>
  </main></GlimmScope>
}

export default function GlimmTheme() { return <ThemeScene /> }
export { GlimmTheme }
