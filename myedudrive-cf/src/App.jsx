import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from './supabase'

// ─── KONSTANTA ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'administrasi', label: 'Administrasi Guru',  icon: '📋', color: '#4a7c59' },
  { id: 'dokumen',      label: 'Dokumen Madrasah',   icon: '📄', color: '#3d6b4a' },
  { id: 'kepegawaian',  label: 'Data Kepegawaian',   icon: '👥', color: '#2d5a3d' },
  { id: 'kurikulum',    label: 'Kurikulum & Ujian',  icon: '📚', color: '#1e4a2f' },
]
const ROLE_OPTIONS = ['Guru', 'Tata Usaha']
const ROLE_AVATARS = { Admin: '👨‍💼', Guru: '👩‍🏫', 'Tata Usaha': '👩‍💻' }

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtBytes = (b) => { if (!b) return '0 B'; const k=1024,s=['B','KB','MB','GB'],i=Math.floor(Math.log(b)/Math.log(k)); return `${parseFloat((b/Math.pow(k,i)).toFixed(1))} ${s[i]}` }
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '-'
const todayStr = () => new Date().toISOString().split('T')[0]

const getFileIcon = (name) => {
  const ext = name?.split('.').pop()?.toLowerCase()
  const m = { pdf:'📕', doc:'📘', docx:'📘', xls:'📗', xlsx:'📗', ppt:'📙', pptx:'📙', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', zip:'🗜️', rar:'🗜️', txt:'📝', mp4:'🎬', mp3:'🎵' }
  return m[ext] || '📎'
}

const isImage = (name) => ['jpg','jpeg','png','gif','webp'].includes(name?.split('.').pop()?.toLowerCase())
const isPDF   = (name) => name?.split('.').pop()?.toLowerCase() === 'pdf'
const isVideo = (name) => ['mp4','webm','ogg'].includes(name?.split('.').pop()?.toLowerCase())
const isAudio = (name) => ['mp3','wav','ogg','m4a'].includes(name?.split('.').pop()?.toLowerCase())

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:type==='info'?'#4a7c59':'#2d7a3a', color:'#fff', padding:'14px 20px', borderRadius:10, fontWeight:600, fontSize:14, boxShadow:'0 4px 20px rgba(0,0,0,0.2)', maxWidth:340 }}>
      {type==='info'?'ℹ️':'✅'} {msg}
    </div>
  )
}

// ─── PRATINJAU FILE ───────────────────────────────────────────────────────────
function PreviewModal({ file, onClose }) {
  const [url, setUrl]       = useState(null)
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState(false)

  useEffect(() => {
    if (!file) return
    supabase.storage.from('documents').createSignedUrl(file.storage_path, 3600)
      .then(({ data, error }) => {
        if (error || !data?.signedUrl) { setError(true); setLoad(false); return }
        setUrl(data.signedUrl)
        setLoad(false)
      })
  }, [file])

  if (!file) return null
  const name = file.name
  const ext  = name?.split('.').pop()?.toLowerCase()

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', zIndex:2000 }} onClick={onClose}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'#1a2e1d', flexShrink:0 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:22 }}>{getFileIcon(name)}</span>
          <div>
            <p style={{ margin:0, fontWeight:700, color:'#fff', fontSize:15 }}>{name}</p>
            <p style={{ margin:0, color:'#a8d5b5', fontSize:12 }}>{fmtBytes(file.size)} · {fmtDate(file.created_at)}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {url && (
            <a href={url} download={name} style={{ background:'#e8a020', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13, textDecoration:'none' }}>
              ⬇️ Unduh
            </a>
          )}
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>✕ Tutup</button>
        </div>
      </div>

      {/* Konten pratinjau */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', overflow:'auto', padding:20 }} onClick={e=>e.stopPropagation()}>
        {loading ? (
          <div style={{ textAlign:'center', color:'#fff' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
            <p>Memuat pratinjau...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign:'center', color:'#fff' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
            <p>Gagal memuat pratinjau.</p>
          </div>
        ) : isImage(name) ? (
          <img src={url} alt={name} style={{ maxWidth:'100%', maxHeight:'80vh', borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }} />
        ) : isPDF(name) ? (
          <iframe src={url} title={name} style={{ width:'100%', height:'80vh', border:'none', borderRadius:8 }} />
        ) : isVideo(name) ? (
          <video controls src={url} style={{ maxWidth:'100%', maxHeight:'80vh', borderRadius:8 }} />
        ) : isAudio(name) ? (
          <div style={{ textAlign:'center', color:'#fff' }}>
            <div style={{ fontSize:64, marginBottom:24 }}>🎵</div>
            <p style={{ marginBottom:20, fontSize:18, fontWeight:600 }}>{name}</p>
            <audio controls src={url} style={{ width:320 }} />
          </div>
        ) : (
          <div style={{ textAlign:'center', color:'#fff' }}>
            <div style={{ fontSize:72, marginBottom:20 }}>{getFileIcon(name)}</div>
            <p style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>{name}</p>
            <p style={{ color:'#aaa', marginBottom:24 }}>Format ini tidak dapat dipratinjau di browser.</p>
            <a href={url} download={name} style={{ background:'#e8a020', color:'#fff', padding:'12px 28px', borderRadius:8, fontWeight:700, textDecoration:'none', fontSize:15 }}>⬇️ Unduh File</a>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MODAL FOLDER ─────────────────────────────────────────────────────────────
function FolderModal({ parentId, parentPath, onSave, onClose }) {
  const [name, setName]   = useState('')
  const [error, setError] = useState('')
  const [saving, setSave] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { setError('Nama folder wajib diisi.'); return }
    if (name.includes('/')) { setError('Nama folder tidak boleh mengandung "/".'); return }
    setSave(true)
    try { await onSave(name.trim(), parentId, parentPath) }
    catch(e) { setError(e.message) }
    setSave(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, padding:32, maxWidth:380, width:'100%' }} onClick={e=>e.stopPropagation()}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#1a2e1d', margin:'0 0 20px' }}>📁 Buat Folder Baru</h2>
        {parentPath && <p style={{ fontSize:12, color:'#888', margin:'-12px 0 16px', background:'#f4f7f4', padding:'6px 10px', borderRadius:6 }}>📍 Di dalam: {parentPath}</p>}
        {error && <div style={{ background:'#fff0f0', border:'1px solid #f5c0c0', color:'#c0392b', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#2d3a2e', marginBottom:6 }}>Nama Folder</label>
        <input style={{ width:'100%', padding:'12px', border:'1.5px solid #dde8dd', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:20 }}
          type="text" placeholder="cth: Semester Ganjil 2026" value={name}
          onChange={e=>{setName(e.target.value);setError('')}}
          onKeyDown={e=>e.key==='Enter'&&handleSave()} autoFocus />
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleSave} disabled={saving} style={{ flex:1, background:'#2d5a3d', color:'#fff', border:'none', padding:12, borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:14 }}>
            {saving?'⏳ Menyimpan...':'Buat Folder'}
          </button>
          <button onClick={onClose} style={{ flex:1, background:'#f0f5f0', border:'none', padding:12, borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>Batal</button>
        </div>
      </div>
    </div>
  )
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async () => {
    if (!username || !password) { setError('Username dan password wajib diisi.'); return }
    setLoading(true); setError('')
    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles').select('id,name,username,role,avatar,email').eq('username', username.trim().toLowerCase()).single()
      if (pErr || !profile) { setError('Username tidak ditemukan.'); setLoading(false); return }
      if (!profile.email)   { setError('Akun belum memiliki email. Hubungi Admin.'); setLoading(false); return }
      const { error: sErr } = await supabase.auth.signInWithPassword({ email: profile.email, password })
      if (sErr) { setError('Password salah. Coba lagi.'); setLoading(false); return }
      onLogin(profile)
    } catch { setError('Terjadi kesalahan. Coba lagi.') }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ flex:1, background:'linear-gradient(160deg,#1a3d25 0%,#2d5a3d 60%,#1a3d25 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}>
        <div style={{ maxWidth:360 }}>
          <div style={{ fontSize:52, marginBottom:20 }}>🗄️</div>
          <h1 style={{ color:'#fff', fontSize:'clamp(1.8rem,3vw,2.6rem)', fontWeight:800, margin:'0 0 16px' }}>Arsip Digital Nisa</h1>
          <p style={{ color:'#c8e6d0', fontSize:15, lineHeight:1.7, margin:'0 0 36px' }}>Sistem pengelolaan dokumen resmi Madrasah Nisa — aman, terstruktur, dan mudah diakses.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {CATEGORIES.map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.07)', borderRadius:8, padding:'10px 14px' }}>
                <span>{c.icon}</span><span style={{ fontSize:13, color:'#c8e6d0' }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ width:'min(480px,100%)', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 40px', position:'relative' }}>
        <button onClick={onBack} style={{ position:'absolute', top:24, left:24, background:'transparent', border:'1px solid #dde8dd', color:'#4a7c59', padding:'8px 14px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:500 }}>← Beranda</button>
        <div style={{ width:'100%', maxWidth:360 }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:44, marginBottom:10 }}>🔐</div>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#1a2e1d', margin:'0 0 6px' }}>Masuk ke Akun</h2>
            <p style={{ fontSize:13, color:'#777', margin:0 }}>Gunakan kredensial yang diberikan operator madrasah</p>
          </div>
          {error && <div style={{ background:'#fff0f0', border:'1px solid #f5c0c0', color:'#c0392b', borderRadius:8, padding:'12px 16px', fontSize:13, fontWeight:500, marginBottom:16 }}>⚠️ {error}</div>}
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#2d3a2e', marginBottom:6 }}>Username</label>
          <div style={{ position:'relative', marginBottom:14 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>👤</span>
            <input style={{ width:'100%', padding:'12px 12px 12px 40px', border:'1.5px solid #dde8dd', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', background:'#fafcfa' }}
              type="text" placeholder="Masukkan username" value={username}
              onChange={e=>{setUsername(e.target.value.toLowerCase().trim());setError('')}}
              onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
          </div>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#2d3a2e', marginBottom:6 }}>Password</label>
          <div style={{ position:'relative', marginBottom:20 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🔑</span>
            <input style={{ width:'100%', padding:'12px 44px 12px 40px', border:'1.5px solid #dde8dd', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', background:'#fafcfa' }}
              type={showPass?'text':'password'} placeholder="Masukkan password" value={password}
              onChange={e=>{setPassword(e.target.value);setError('')}}
              onKeyDown={e=>e.key==='Enter'&&handleSubmit()} />
            <button onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16 }}>{showPass?'🙈':'👁️'}</button>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            style={{ width:'100%', background:'linear-gradient(135deg,#2d5a3d,#1a3d25)', color:'#fff', border:'none', padding:14, borderRadius:8, fontSize:15, fontWeight:700, cursor:'pointer', opacity:loading?0.75:1 }}>
            {loading?'⏳ Memverifikasi...':'Masuk ke Sistem →'}
          </button>
          <p style={{ textAlign:'center', fontSize:12, color:'#aaa', marginTop:16 }}>Hubungi Admin jika lupa password</p>
        </div>
      </div>
    </div>
  )
}

// ─── USER MODAL ───────────────────────────────────────────────────────────────
function UserModal({ mode, user, onSave, onClose }) {
  const [form, setForm]     = useState(user || { name:'', username:'', email:'', password:'', role:'Guru' })
  const [error, setError]   = useState('')
  const [showPass, setSP]   = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (k,v) => { setForm(p=>({...p,[k]:v})); setError('') }

  const handleSave = async () => {
    if (!form.name.trim()||!form.username.trim()||!form.password.trim()||!form.email.trim()) { setError('Semua field wajib diisi.'); return }
    if (form.username.includes(' ')) { setError('Username tidak boleh mengandung spasi.'); return }
    if (form.password.length < 6) { setError('Password minimal 6 karakter.'); return }
    if (!form.email.includes('@')) { setError('Format email tidak valid.'); return }
    setSaving(true)
    try { await onSave({ ...form, avatar:ROLE_AVATARS[form.role]||'👤', createdAt:form.createdAt||todayStr() }) }
    catch(e) { setError(e.message) }
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, padding:32, maxWidth:420, width:'100%', maxHeight:'90vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#1a2e1d', margin:'0 0 20px' }}>{mode==='add'?'➕ Tambah Akun':'✏️ Edit Akun'}</h2>
        {error && <div style={{ background:'#fff0f0', border:'1px solid #f5c0c0', color:'#c0392b', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}
        {[
          ['name','Nama Lengkap','cth: Bu Ratna Dewi','text'],
          ['username','Username','cth: ratna (tanpa spasi)','text'],
          ['email','Email Gmail','cth: ratna@gmail.com','email'],
          ['password','Password','Minimal 6 karakter', showPass?'text':'password'],
        ].map(([k,lbl,ph,t]) => (
          <div key={k} style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#2d3a2e', marginBottom:6 }}>{lbl}</label>
            <div style={{ position:'relative' }}>
              <input style={{ width:'100%', padding:'11px 12px', border:'1.5px solid #dde8dd', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', paddingRight:k==='password'?44:12 }}
                type={t} placeholder={ph} value={form[k]||''}
                onChange={e=>set(k, k==='username'?e.target.value.toLowerCase().replace(/\s/g,''):e.target.value)} />
              {k==='password' && <button type="button" onClick={()=>setSP(!showPass)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:15 }}>{showPass?'🙈':'👁️'}</button>}
            </div>
            {k==='username' && form.username && <p style={{ fontSize:11, color:'#888', margin:'4px 0 0' }}>Digunakan untuk login ke aplikasi</p>}
            {k==='email' && <p style={{ fontSize:11, color:'#888', margin:'4px 0 0' }}>Gunakan Gmail aktif guru/TU</p>}
          </div>
        ))}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#2d3a2e', marginBottom:8 }}>Role</label>
          <div style={{ display:'flex', gap:8 }}>
            {ROLE_OPTIONS.map(r => (
              <button key={r} type="button" onClick={()=>set('role',r)}
                style={{ flex:1, padding:10, borderRadius:8, border:`2px solid ${form.role===r?'#2d5a3d':'#dde8dd'}`, background:form.role===r?'#2d5a3d18':'#fff', fontWeight:form.role===r?700:400, cursor:'pointer', fontSize:13, color:'#1a2e1d' }}>
                {ROLE_AVATARS[r]} {r}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ flex:1, background:'#2d5a3d', color:'#fff', border:'none', padding:12, borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:14, opacity:saving?0.75:1 }}>
            {saving?'⏳ Menyimpan...':mode==='add'?'Tambah Akun':'Simpan'}
          </button>
          <button type="button" onClick={onClose} style={{ flex:1, background:'#f0f5f0', border:'none', padding:12, borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>Batal</button>
        </div>
      </div>
    </div>
  )
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ onBack, showToast }) {
  const [users,   setUsers]   = useState([])
  const [modal,   setModal]   = useState(null)
  const [delTgt,  setDelTgt]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filterR, setFilterR] = useState('all')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at',{ascending:true})
    setUsers(data||[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSave = async (form) => {
    if (modal.mode === 'add') {
      const { data, error } = await supabase.auth.signUp({ email:form.email, password:form.password, options:{ data:{ name:form.name, username:form.username, role:form.role, avatar:form.avatar } } })
      if (error) throw new Error(error.message)
      if (data.user) await supabase.from('profiles').upsert({ id:data.user.id, name:form.name, username:form.username, role:form.role, avatar:form.avatar, email:form.email, created_at:new Date().toISOString() })
      showToast(`Akun "${form.name}" berhasil ditambahkan!`)
    } else {
      await supabase.from('profiles').update({ name:form.name, username:form.username, role:form.role, avatar:form.avatar }).eq('id', modal.user.id)
      showToast(`Akun "${form.name}" diperbarui.`)
    }
    setModal(null); await fetchUsers()
  }

  const handleDelete = async (u) => {
    await supabase.from('profiles').delete().eq('id', u.id)
    setDelTgt(null); showToast(`Akun "${u.name}" dihapus.`,'info'); await fetchUsers()
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (u.name?.toLowerCase().includes(q)||u.username?.toLowerCase().includes(q)) && (filterR==='all'||u.role===filterR)
  })

  return (
    <div style={{ minHeight:'100vh', background:'#fafcfa', fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <header style={{ display:'flex', alignItems:'center', padding:'12px 24px', background:'#1a3d25', gap:12 }}>
        <button onClick={onBack} style={{ background:'transparent', border:'1px solid #4a7c59', color:'#a8d5b5', padding:'8px 16px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:500 }}>← Drive</button>
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}><span style={{ fontSize:22 }}>👥</span><span style={{ color:'#fff', fontWeight:800, fontSize:17 }}>Manajemen Pengguna</span></div>
        <button onClick={()=>setModal({mode:'add'})} style={{ background:'#e8a020', color:'#fff', border:'none', padding:'10px 20px', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>+ Tambah Akun</button>
      </header>
      <div style={{ maxWidth:960, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
          {[{label:'Total',count:users.length,icon:'👤'},{label:'Guru',count:users.filter(u=>u.role==='Guru').length,icon:'👩‍🏫'},{label:'Tata Usaha',count:users.filter(u=>u.role==='Tata Usaha').length,icon:'👩‍💻'}].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:12, padding:'18px 20px', border:'1px solid #e0e8e0', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#2d5a3d18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{s.icon}</div>
              <div><p style={{ margin:0, fontSize:24, fontWeight:800, color:'#1a2e1d' }}>{s.count}</p><p style={{ margin:0, fontSize:12, color:'#777' }}>{s.label}</p></div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <input style={{ flex:1, minWidth:180, padding:'10px 16px', border:'1px solid #dde8dd', borderRadius:8, fontSize:14, outline:'none' }}
            placeholder="🔍 Cari nama atau username..." value={search} onChange={e=>setSearch(e.target.value)} />
          <div style={{ display:'flex', gap:6 }}>
            {['all','Guru','Tata Usaha'].map(r => (
              <button key={r} onClick={()=>setFilterR(r)} style={{ padding:'9px 14px', borderRadius:8, border:`1.5px solid ${filterR===r?'#2d5a3d':'#dde8dd'}`, background:filterR===r?'#2d5a3d':'#fff', color:filterR===r?'#fff':'#333', fontWeight:filterR===r?700:400, cursor:'pointer', fontSize:13 }}>
                {r==='all'?'Semua':r}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e0e8e0', overflow:'hidden' }}>
          <div style={{ display:'flex', padding:'11px 20px', background:'#f0f5f0', borderBottom:'1px solid #e0e8e0', fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.06em', gap:8 }}>
            <span style={{ flex:2.5 }}>Nama & Username</span><span style={{ flex:1.2 }}>Role</span><span style={{ flex:1 }}>Bergabung</span><span style={{ flex:1, textAlign:'right' }}>Aksi</span>
          </div>
          {loading ? <div style={{ padding:48, textAlign:'center', color:'#aaa' }}>⏳ Memuat...</div>
          : filtered.length===0 ? <div style={{ padding:48, textAlign:'center', color:'#aaa' }}>Tidak ada pengguna.</div>
          : filtered.map((u,i) => (
            <div key={u.id} style={{ display:'flex', alignItems:'center', padding:'14px 20px', borderBottom:i<filtered.length-1?'1px solid #f0f5f0':'none', gap:8 }}>
              <div style={{ flex:2.5, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'#2d5a3d18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{u.avatar||'👤'}</div>
                <div><p style={{ margin:0, fontWeight:600, fontSize:14, color:'#1a2e1d' }}>{u.name||'-'}</p><p style={{ margin:0, fontSize:12, color:'#888' }}>@{u.username||'-'}</p></div>
              </div>
              <div style={{ flex:1.2 }}><span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background:'#2d5a3d18', color:'#2d5a3d', border:'1px solid #2d5a3d30' }}>{u.avatar} {u.role}</span></div>
              <div style={{ flex:1, fontSize:13, color:'#888' }}>{fmtDate(u.created_at)}</div>
              <div style={{ flex:1, display:'flex', justifyContent:'flex-end', gap:6 }}>
                {u.role!=='Admin' ? <>
                  <button onClick={()=>setModal({mode:'edit',user:u})} style={{ background:'#f0f5f0', border:'none', borderRadius:6, padding:'7px 12px', cursor:'pointer', fontSize:13 }}>✏️ Edit</button>
                  <button onClick={()=>setDelTgt(u)} style={{ background:'#fff0f0', border:'none', borderRadius:6, padding:'7px 12px', cursor:'pointer', fontSize:13 }}>🗑️</button>
                </> : <span style={{ fontSize:12, color:'#aaa', fontStyle:'italic' }}>protected</span>}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize:12, color:'#aaa', marginTop:12, textAlign:'center' }}>* Akun Admin tidak dapat diedit atau dihapus.</p>
      </div>
      {modal && <UserModal mode={modal.mode} user={modal.user} onSave={handleSave} onClose={()=>setModal(null)} />}
      {delTgt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }} onClick={()=>setDelTgt(null)}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, maxWidth:380, width:'100%', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <span style={{ fontSize:40 }}>🗑️</span>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#1a2e1d', margin:'12px 0 8px' }}>Hapus Akun?</h2>
            <p style={{ color:'#555', fontSize:14, margin:'0 0 20px' }}>Akun <strong>"{delTgt.name}"</strong> akan dihapus.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>handleDelete(delTgt)} style={{ flex:1, background:'#c0392b', color:'#fff', border:'none', padding:12, borderRadius:8, fontWeight:700, cursor:'pointer' }}>Ya, Hapus</button>
              <button onClick={()=>setDelTgt(null)} style={{ flex:1, background:'#f0f5f0', border:'none', padding:12, borderRadius:8, fontWeight:600, cursor:'pointer' }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page,         setPage]        = useState('loading')
  const [currentUser,  setCurrentUser] = useState(null)
  // Folder state
  const [folders,      setFolders]     = useState([])
  const [currentFolder,setCurFolder]   = useState(null) // null = root
  const [breadcrumb,   setBreadcrumb]  = useState([])   // [{id, name}]
  const [folderModal,  setFolderModal] = useState(false)
  // File state
  const [files,        setFiles]       = useState([])
  const [filesLoading, setFilesLoad]   = useState(false)
  const [activeCat,    setActiveCat]   = useState('all')
  const [search,       setSearch]      = useState('')
  const [isDragging,   setIsDragging]  = useState(false)
  const [uploadModal,  setUploadModal] = useState(false)
  const [uploadCat,    setUploadCat]   = useState('administrasi')
  const [previewFile,  setPreviewFile] = useState(null)
  const [delConfirm,   setDelConfirm]  = useState(null)
  const [delFolder,    setDelFolder]   = useState(null)
  const [viewMode,     setViewMode]    = useState('list')
  const [toast,        setToast]       = useState(null)
  const [userMenu,     setUserMenu]    = useState(false)
  const fileRef = useRef()

  const showToast = useCallback((msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }, [])

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id',session.user.id).single()
        if (p) { setCurrentUser(p); setPage('drive') } else setPage('landing')
      } else setPage('landing')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event==='SIGNED_OUT') { setCurrentUser(null); setPage('landing') }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Fetch Folders ──
  const fetchFolders = useCallback(async (parentId) => {
    const query = supabase.from('folders').select('*').order('name')
    if (parentId) query.eq('parent_id', parentId)
    else query.is('parent_id', null)
    const { data } = await query
    setFolders(data||[])
  }, [])

  // ── Fetch Files ──
  const fetchFiles = useCallback(async (folderId, cat) => {
    setFilesLoad(true)
    let query = supabase.from('files').select('*').order('created_at',{ascending:false})
    if (folderId) query = query.eq('folder_id', folderId)
    else query = query.is('folder_id', null)
    if (cat && cat !== 'all') query = query.eq('category', cat)
    const { data } = await query
    setFiles(data||[])
    setFilesLoad(false)
  }, [])

  useEffect(() => {
    if (page==='drive') {
      fetchFolders(currentFolder)
      fetchFiles(currentFolder, activeCat)
    }
  }, [page, currentFolder, activeCat, fetchFolders, fetchFiles])

  // ── Navigasi Folder ──
  const openFolder = (folder) => {
    setCurFolder(folder.id)
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }])
    setSearch('')
  }

  const navigateBreadcrumb = (idx) => {
    if (idx === -1) {
      setCurFolder(null)
      setBreadcrumb([])
    } else {
      const crumb = breadcrumb[idx]
      setCurFolder(crumb.id)
      setBreadcrumb(prev => prev.slice(0, idx + 1))
    }
    setSearch('')
  }

  // ── Buat Folder ──
  const createFolder = async (name, parentId, parentPath) => {
    const path = parentPath ? `${parentPath}/${name}` : name
    const { error } = await supabase.from('folders').insert({
      name, parent_id: parentId || null, path,
      created_by: currentUser?.id, created_by_name: currentUser?.name
    })
    if (error) throw new Error(error.message)
    showToast(`Folder "${name}" berhasil dibuat!`)
    setFolderModal(false)
    await fetchFolders(currentFolder)
  }

  // ── Hapus Folder ──
  const handleDeleteFolder = async (folder) => {
    await supabase.from('folders').delete().eq('id', folder.id)
    setDelFolder(null)
    showToast(`Folder "${folder.name}" dihapus.`, 'info')
    await fetchFolders(currentFolder)
  }

  // ── Upload File ──
  const uploadFiles = useCallback(async (incoming, cat) => {
    const category = cat || uploadCat
    let count = 0
    for (const file of Array.from(incoming)) {
      const safe = file.name.replace(/[^a-zA-Z0-9._\-()\s]/g,'_')
      const path = `${category}/${currentFolder||'root'}/${Date.now()}_${safe}`
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
      if (upErr) { showToast('Gagal upload: '+upErr.message,'info'); continue }
      await supabase.from('files').insert({
        name: file.name, category, size: file.size, storage_path: path,
        folder_id: currentFolder || null,
        uploaded_by: currentUser?.id, uploader_name: currentUser?.name
      })
      count++
    }
    if (count > 0) showToast(`${count} file berhasil diunggah!`)
    setUploadModal(false)
    await fetchFiles(currentFolder, activeCat)
  }, [uploadCat, currentUser, currentFolder, activeCat, fetchFiles, showToast])

  // ── Download File ──
  const downloadFile = async (file) => {
    const { data, error } = await supabase.storage.from('documents').download(file.storage_path)
    if (error) { showToast('Gagal mengunduh file.','info'); return }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a'); a.href=url; a.download=file.name; a.click()
    URL.revokeObjectURL(url)
    showToast(`Mengunduh "${file.name}"...`)
  }

  // ── Hapus File ──
  const deleteFile = async (id) => {
    const f = files.find(x=>x.id===id)
    if (f?.storage_path) await supabase.storage.from('documents').remove([f.storage_path])
    await supabase.from('files').delete().eq('id',id)
    setDelConfirm(null)
    showToast('File dihapus.','info')
    await fetchFiles(currentFolder, activeCat)
  }

  const handleLogin  = (profile) => { setCurrentUser(profile); setPage('drive'); showToast(`Selamat datang, ${profile.name}! 👋`) }
  const handleLogout = async () => { await supabase.auth.signOut(); setCurrentUser(null); setFiles([]); setFolders([]); setPage('landing'); setUserMenu(false); showToast('Anda telah keluar.','info') }

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const totalSize = files.reduce((a,f)=>a+f.size,0)
  const currentPath = breadcrumb.map(b=>b.name).join(' / ')

  // ── Loading ──
  if (page==='loading') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16, fontFamily:"'Segoe UI',sans-serif" }}>
      <div style={{ fontSize:48 }}>🗄️</div>
      <p style={{ color:'#4a7c59', fontWeight:600 }}>Memuat Arsip Digital Nisa...</p>
    </div>
  )

  if (page==='admin') return <>{toast&&<Toast {...toast}/>}<AdminPanel onBack={()=>setPage('drive')} showToast={showToast} /></>
  if (page==='login') return <>{toast&&<Toast {...toast}/>}<LoginPage onLogin={handleLogin} onBack={()=>setPage('landing')} /></>

  // ── LANDING ──
  if (page==='landing') return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", minHeight:'100vh', background:'#fff' }}>
      {toast&&<Toast {...toast}/>}
      <div style={{ position:'relative', minHeight:'72vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a3d25 0%,#2d5a3d 50%,#1a3d25 100%)', overflow:'hidden' }}>
        <div style={{ position:'relative', zIndex:1, textAlign:'center', padding:'60px 24px', maxWidth:680 }}>
          <p style={{ color:'#a8d5b5', fontSize:13, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:16 }}>Madrasah Nisa · Sistem Digital</p>
          <h1 style={{ color:'#fff', fontSize:'clamp(2rem,5vw,3.2rem)', fontWeight:800, lineHeight:1.2, margin:'0 0 20px' }}>Arsip Digital Nisa</h1>
          <p style={{ color:'#c8e6d0', fontSize:'clamp(1rem,2vw,1.2rem)', lineHeight:1.7, margin:'0 0 36px' }}>Kemudahan akses administrasi guru & tenaga kependidikan — <em>kapan saja, dari mana saja.</em></p>
          <button onClick={()=>setPage('login')} style={{ background:'#e8a020', color:'#fff', border:'none', padding:'16px 36px', borderRadius:8, fontSize:16, fontWeight:700, cursor:'pointer' }}>Masuk ke Ruang Penyimpanan →</button>
        </div>
      </div>
      <section style={{ padding:'72px 24px', textAlign:'center' }}>
        <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', fontWeight:800, color:'#1a2e1d', margin:'0 auto 48px', maxWidth:500 }}>Kategori Dokumen</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:24, maxWidth:960, margin:'0 auto' }}>
          {CATEGORIES.map(c => (
            <div key={c.id} style={{ background:'#fff', border:'1px solid #e0e8e0', borderRadius:16, padding:'28px 20px', textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ width:56, height:56, borderRadius:14, background:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto 16px' }}>{c.icon}</div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#1a2e1d', margin:0 }}>{c.label}</h3>
            </div>
          ))}
        </div>
      </section>
      <section style={{ background:'linear-gradient(135deg,#2d5a3d,#1a3d25)', padding:'64px 24px', textAlign:'center' }}>
        <h2 style={{ color:'#fff', fontSize:'clamp(1.4rem,3vw,2rem)', fontWeight:800, margin:'0 0 28px' }}>Siap mengarsipkan dokumen Anda?</h2>
        <button onClick={()=>setPage('login')} style={{ background:'#e8a020', color:'#fff', border:'none', padding:'16px 36px', borderRadius:8, fontSize:16, fontWeight:700, cursor:'pointer' }}>Masuk & Mulai Sekarang</button>
      </section>
      <footer style={{ background:'#111d13', color:'#8aad8a', textAlign:'center', padding:'28px 24px', fontSize:13 }}>
        <p style={{ opacity:0.5, fontSize:12 }}>© 2026 MyEduDrive — Madrasah Nisa. Hak cipta dilindungi.</p>
      </footer>
    </div>
  )

  // ── DRIVE ──
  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", minHeight:'100vh', background:'#f5f7f5' }}>
      {toast&&<Toast {...toast}/>}
      {previewFile && <PreviewModal file={previewFile} onClose={()=>setPreviewFile(null)} />}
      {userMenu&&<div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={()=>setUserMenu(false)}/>}

      {/* Topbar */}
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:60, background:'#1a3d25', boxShadow:'0 2px 8px rgba(0,0,0,0.2)', gap:12, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:24 }}>🗄️</span>
          <span style={{ color:'#fff', fontWeight:800, fontSize:18 }}>MyEduDrive</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {currentUser?.role==='Admin' && (
            <button onClick={()=>setPage('admin')} style={{ background:'transparent', border:'1px solid #a8d5b5', color:'#a8d5b5', padding:'7px 14px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:500 }}>👥 Kelola Pengguna</button>
          )}
          <button onClick={()=>setFolderModal(true)} style={{ background:'transparent', border:'1px solid #a8d5b5', color:'#a8d5b5', padding:'7px 14px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:500 }}>📁 Folder Baru</button>
          <button onClick={()=>setUploadModal(true)} style={{ background:'#e8a020', color:'#fff', border:'none', padding:'8px 18px', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 }}>⬆️ Unggah File</button>
        </div>
        <div style={{ position:'relative' }}>
          <button onClick={()=>setUserMenu(!userMenu)} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'7px 14px', cursor:'pointer' }}>
            <span style={{ fontSize:20 }}>{currentUser?.avatar||'👤'}</span>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{currentUser?.name}</div>
              <div style={{ fontSize:11, color:'#a8d5b5' }}>{currentUser?.role}</div>
            </div>
            <span style={{ color:'#a8d5b5', fontSize:11 }}>▼</span>
          </button>
          {userMenu && (
            <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'#fff', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', border:'1px solid #e0e8e0', minWidth:220, zIndex:100, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:16 }}>
                <span style={{ fontSize:28 }}>{currentUser?.avatar||'👤'}</span>
                <div>
                  <p style={{ margin:0, fontWeight:700, color:'#1a2e1d', fontSize:14 }}>{currentUser?.name}</p>
                  <p style={{ margin:0, color:'#666', fontSize:12 }}>@{currentUser?.username} · {currentUser?.role}</p>
                </div>
              </div>
              <div style={{ height:1, background:'#e0e8e0' }}/>
              {currentUser?.role==='Admin' && <button onClick={()=>{setUserMenu(false);setPage('admin')}} style={{ display:'block', width:'100%', padding:'12px 16px', background:'none', border:'none', textAlign:'left', cursor:'pointer', fontSize:14, color:'#2d5a3d', fontWeight:600 }}>👥 Kelola Pengguna</button>}
              <button onClick={handleLogout} style={{ display:'block', width:'100%', padding:'12px 16px', background:'none', border:'none', textAlign:'left', cursor:'pointer', fontSize:14, color:'#c0392b', fontWeight:600 }}>🚪 Keluar dari Sistem</button>
            </div>
          )}
        </div>
      </header>

      <div style={{ display:'flex', minHeight:'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <aside style={{ width:220, minWidth:180, background:'#fff', borderRight:'1px solid #e0e8e0', padding:'16px 10px', display:'flex', flexDirection:'column', gap:3 }}>
          <p style={{ fontSize:10, fontWeight:700, color:'#aaa', letterSpacing:'0.12em', textTransform:'uppercase', padding:'0 8px', margin:'0 0 6px' }}>Kategori</p>
          {[{id:'all',label:'Semua',icon:'🗂️'},...CATEGORIES].map(cat => (
            <button key={cat.id} onClick={()=>{setActiveCat(cat.id);setCurFolder(null);setBreadcrumb([])}}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, width:'100%', background:activeCat===cat.id&&!currentFolder?'#2d5a3d':'transparent', color:activeCat===cat.id&&!currentFolder?'#fff':'#2d3a2e', fontWeight:activeCat===cat.id&&!currentFolder?600:400, textAlign:'left' }}>
              <span style={{ fontSize:16 }}>{cat.icon}</span>
              <span style={{ flex:1 }}>{cat.label}</span>
            </button>
          ))}
          <div style={{ height:1, background:'#e0e8e0', margin:'10px 0' }}/>
          <div style={{ marginTop:'auto', padding:'12px 10px', background:'#f4f7f4', borderRadius:10, border:'1px solid #e0e8e0' }}>
            <p style={{ margin:'0 0 6px', fontWeight:600, fontSize:12, color:'#2d3a2e' }}>Penyimpanan</p>
            <div style={{ height:5, background:'#e0e8e0', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'linear-gradient(90deg,#2d7a3a,#4a7c59)', borderRadius:3, width:`${Math.min(100,(totalSize/(1024*1024*1024))*100)}%` }} />
            </div>
            <p style={{ margin:'5px 0 0', fontSize:11, color:'#666' }}>{fmtBytes(totalSize)} / 1 GB</p>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, padding:20, overflowY:'auto' }}>
          {/* Breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:16, flexWrap:'wrap' }}>
            <button onClick={()=>navigateBreadcrumb(-1)} style={{ background:'none', border:'none', cursor:'pointer', color:'#4a7c59', fontWeight:600, fontSize:14, padding:'4px 8px', borderRadius:6 }}>🏠 Drive</button>
            {breadcrumb.map((crumb,i) => (
              <>
                <span key={`sep-${i}`} style={{ color:'#aaa', fontSize:14 }}>›</span>
                <button key={crumb.id} onClick={()=>navigateBreadcrumb(i)} style={{ background:'none', border:'none', cursor:'pointer', color:i===breadcrumb.length-1?'#1a2e1d':'#4a7c59', fontWeight:i===breadcrumb.length-1?700:400, fontSize:14, padding:'4px 8px', borderRadius:6 }}>{crumb.name}</button>
              </>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <input style={{ flex:1, padding:'9px 14px', border:'1px solid #dde8dd', borderRadius:8, fontSize:14, background:'#fff', outline:'none' }}
              placeholder="🔍  Cari dokumen atau folder..." value={search} onChange={e=>setSearch(e.target.value)} />
            <div style={{ display:'flex', gap:4 }}>
              {['list','grid'].map(m => (
                <button key={m} onClick={()=>setViewMode(m)} style={{ width:36, height:36, border:'none', borderRadius:6, cursor:'pointer', fontSize:16, background:viewMode===m?'#2d5a3d':'#e8ede8', color:viewMode===m?'#fff':'#333' }}>
                  {m==='list'?'☰':'⊞'}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div onClick={()=>fileRef.current.click()} onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={()=>setIsDragging(false)}
            onDrop={e=>{e.preventDefault();setIsDragging(false);if(e.dataTransfer.files.length)uploadFiles(e.dataTransfer.files)}}
            style={{ border:`2px dashed ${isDragging?'#2d7a3a':'#c5d4c5'}`, borderRadius:10, padding:'14px 20px', textAlign:'center', cursor:'pointer', marginBottom:16, background:isDragging?'#e8f4e8':'#f9fbf9', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>☁️</span>
            <p style={{ margin:0, color:'#4a7c59', fontWeight:500, fontSize:13 }}>{isDragging?'Lepaskan untuk mengunggah...':'Seret & lepas file ke sini, atau klik untuk memilih'}{currentFolder && ` (masuk ke folder: ${breadcrumb[breadcrumb.length-1]?.name})`}</p>
          </div>
          <input ref={fileRef} type="file" multiple style={{ display:'none' }} onChange={e=>uploadFiles(e.target.files)} />

          {/* Info */}
          <p style={{ fontSize:12, color:'#888', marginBottom:12 }}>
            {folders.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())).length} folder · {filtered.length} dokumen
            {currentPath && ` · 📁 ${currentPath}`}
          </p>

          {/* Grid/List Folders + Files */}
          {viewMode === 'grid' ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }}>
              {/* Folders */}
              {folders.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())).map(folder => (
                <div key={folder.id} style={{ background:'#fff', borderRadius:12, border:'1px solid #e0e8e0', padding:16, display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer', position:'relative' }}
                  onDoubleClick={()=>openFolder(folder)}>
                  <div style={{ fontSize:48 }}>📁</div>
                  <p style={{ fontSize:13, fontWeight:600, color:'#1a2e1d', textAlign:'center', wordBreak:'break-word', margin:0 }}>{folder.name}</p>
                  <p style={{ fontSize:11, color:'#aaa', margin:0 }}>Dua kali klik untuk buka</p>
                  <div style={{ display:'flex', gap:6, width:'100%' }}>
                    <button onClick={()=>openFolder(folder)} style={{ flex:1, background:'#f0f5f0', border:'none', borderRadius:6, padding:'7px', cursor:'pointer', fontSize:12, fontWeight:600 }}>📂 Buka</button>
                    <button onClick={()=>setDelFolder(folder)} style={{ background:'#fff0f0', border:'none', borderRadius:6, padding:'7px 10px', cursor:'pointer', fontSize:12 }}>🗑️</button>
                  </div>
                </div>
              ))}
              {/* Files */}
              {filtered.map(f => {
                const cat = CATEGORIES.find(c=>c.id===f.category)
                return (
                  <div key={f.id} style={{ background:'#fff', borderRadius:12, border:'1px solid #e0e8e0', padding:16, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div style={{ width:'100%', borderRadius:8, padding:'16px 0', textAlign:'center', background:cat?.color+'15', cursor:'pointer' }} onClick={()=>setPreviewFile(f)}>
                      <span style={{ fontSize:40 }}>{getFileIcon(f.name)}</span>
                    </div>
                    <p style={{ fontSize:12, fontWeight:600, color:'#1a2e1d', textAlign:'center', wordBreak:'break-all', margin:0 }}>{f.name}</p>
                    <p style={{ fontSize:11, color:'#888', margin:0 }}>{fmtBytes(f.size)}</p>
                    <div style={{ display:'flex', gap:6, width:'100%' }}>
                      <button onClick={()=>setPreviewFile(f)} style={{ flex:1, background:'#f0f5f0', border:'none', borderRadius:6, padding:'7px', cursor:'pointer', fontSize:12 }}>👁️ Lihat</button>
                      <button onClick={()=>downloadFile(f)} style={{ background:'#f0f5f0', border:'none', borderRadius:6, padding:'7px 8px', cursor:'pointer', fontSize:12 }}>⬇️</button>
                      <button onClick={()=>setDelConfirm(f)} style={{ background:'#fff0f0', border:'none', borderRadius:6, padding:'7px 8px', cursor:'pointer', fontSize:12 }}>🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e0e8e0', overflow:'hidden' }}>
              {/* Header */}
              <div style={{ display:'grid', gridTemplateColumns:'3fr 1.5fr 1fr 1fr 140px', padding:'10px 16px', background:'#f0f5f0', borderBottom:'1px solid #e0e8e0', fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.06em', gap:8 }}>
                <span>Nama</span><span>Kategori</span><span>Ukuran</span><span>Tanggal</span><span style={{ textAlign:'right' }}>Aksi</span>
              </div>

              {/* Folders */}
              {folders.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())).map(folder => (
                <div key={folder.id} style={{ display:'grid', gridTemplateColumns:'3fr 1.5fr 1fr 1fr 140px', padding:'12px 16px', borderBottom:'1px solid #f0f5f0', alignItems:'center', gap:8 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:22 }}>📁</span>
                    <button onClick={()=>openFolder(folder)} style={{ background:'none', border:'none', cursor:'pointer', fontWeight:600, fontSize:14, color:'#1a2e1d', textAlign:'left', padding:0 }}>{folder.name}</button>
                  </span>
                  <span style={{ fontSize:12, color:'#888' }}>Folder</span>
                  <span style={{ fontSize:12, color:'#888' }}>—</span>
                  <span style={{ fontSize:12, color:'#888' }}>{fmtDate(folder.created_at)}</span>
                  <span style={{ display:'flex', justifyContent:'flex-end', gap:6 }}>
                    <button onClick={()=>openFolder(folder)} style={{ background:'#f0f5f0', border:'none', borderRadius:6, padding:'6px 10px', cursor:'pointer', fontSize:12, fontWeight:600 }}>📂 Buka</button>
                    <button onClick={()=>setDelFolder(folder)} style={{ background:'#fff0f0', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', fontSize:13 }}>🗑️</button>
                  </span>
                </div>
              ))}

              {/* Files */}
              {filesLoading ? <div style={{ padding:32, textAlign:'center', color:'#aaa' }}>⏳ Memuat...</div>
              : filtered.length===0 && folders.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())).length===0 ? (
                <div style={{ padding:'48px 20px', textAlign:'center', color:'#aaa' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📂</div>
                  <p>Folder ini kosong. Unggah file atau buat folder baru.</p>
                </div>
              ) : filtered.map(f => {
                const cat = CATEGORIES.find(c=>c.id===f.category)
                return (
                  <div key={f.id} style={{ display:'grid', gridTemplateColumns:'3fr 1.5fr 1fr 1fr 140px', padding:'12px 16px', borderBottom:'1px solid #f0f5f0', alignItems:'center', gap:8 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{getFileIcon(f.name)}</span>
                      <button onClick={()=>setPreviewFile(f)} style={{ background:'none', border:'none', cursor:'pointer', fontWeight:500, fontSize:13, color:'#1a2e1d', textAlign:'left', padding:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }} title={f.name}>{f.name}</button>
                    </span>
                    <span>{cat && <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6, background:cat.color+'22', color:cat.color, border:`1px solid ${cat.color}44` }}>{cat.icon} {cat.label}</span>}</span>
                    <span style={{ fontSize:12, color:'#666' }}>{fmtBytes(f.size)}</span>
                    <span style={{ fontSize:12, color:'#666' }}>{fmtDate(f.created_at)}</span>
                    <span style={{ display:'flex', justifyContent:'flex-end', gap:5 }}>
                      <button onClick={()=>setPreviewFile(f)} style={{ background:'#f0f5f0', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', fontSize:13 }} title="Pratinjau">👁️</button>
                      <button onClick={()=>downloadFile(f)} style={{ background:'#f0f5f0', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', fontSize:13 }} title="Unduh">⬇️</button>
                      <button onClick={()=>setDelConfirm(f)} style={{ background:'#fff0f0', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', fontSize:13 }} title="Hapus">🗑️</button>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal Upload */}
      {uploadModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }} onClick={()=>setUploadModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, maxWidth:520, width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }} onClick={e=>e.stopPropagation()}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#1a2e1d', margin:'0 0 8px' }}>Unggah Dokumen</h2>
            {currentFolder && <p style={{ fontSize:12, color:'#888', margin:'0 0 16px', background:'#f4f7f4', padding:'6px 12px', borderRadius:6 }}>📁 Ke folder: {breadcrumb[breadcrumb.length-1]?.name}</p>}
            <p style={{ fontSize:13, fontWeight:600, color:'#555', alignSelf:'flex-start', marginBottom:10, marginTop:8 }}>Pilih kategori:</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', marginBottom:20 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={()=>setUploadCat(cat.id)}
                  style={{ padding:'12px 8px', borderRadius:10, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, border:`2px solid ${uploadCat===cat.id?cat.color:'#ddd'}`, background:uploadCat===cat.id?cat.color+'18':'#fff' }}>
                  <span style={{ fontSize:22 }}>{cat.icon}</span>
                  <span style={{ fontSize:12, fontWeight:500, color:'#1a2e1d', textAlign:'center' }}>{cat.label}</span>
                </button>
              ))}
            </div>
            <div onClick={()=>fileRef.current.click()}
              onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={()=>setIsDragging(false)}
              onDrop={e=>{e.preventDefault();setIsDragging(false);uploadFiles(e.dataTransfer.files,uploadCat)}}
              style={{ width:'100%', border:`2px dashed ${isDragging?'#2d7a3a':'#c5d4c5'}`, borderRadius:10, padding:'28px 20px', cursor:'pointer', marginBottom:20, background:'#f9fbf9', textAlign:'center', boxSizing:'border-box' }}>
              <span style={{ fontSize:36 }}>☁️</span>
              <p style={{ color:'#4a7c59', fontWeight:500, margin:'8px 0 4px' }}>Seret file ke sini atau klik untuk memilih</p>
              <p style={{ color:'#888', fontSize:12 }}>PDF, DOCX, XLSX, PPT, JPG, PNG, dan lainnya</p>
            </div>
            <button onClick={()=>setUploadModal(false)} style={{ background:'#f0f5f0', color:'#333', border:'none', padding:'11px 24px', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:14 }}>Batal</button>
          </div>
        </div>
      )}

      {/* Modal Folder Baru */}
      {folderModal && (
        <FolderModal
          parentId={currentFolder}
          parentPath={currentPath || null}
          onSave={createFolder}
          onClose={()=>setFolderModal(false)}
        />
      )}

      {/* Konfirmasi Hapus File */}
      {delConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }} onClick={()=>setDelConfirm(null)}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, maxWidth:400, width:'100%', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <span style={{ fontSize:40 }}>🗑️</span>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#1a2e1d', margin:'12px 0 8px' }}>Hapus File?</h2>
            <p style={{ color:'#555', margin:'0 0 20px', fontSize:14 }}>File <strong>"{delConfirm.name}"</strong> akan dihapus permanen.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>deleteFile(delConfirm.id)} style={{ flex:1, background:'#c0392b', color:'#fff', border:'none', padding:12, borderRadius:8, fontWeight:700, cursor:'pointer' }}>Ya, Hapus</button>
              <button onClick={()=>setDelConfirm(null)} style={{ flex:1, background:'#f0f5f0', border:'none', padding:12, borderRadius:8, fontWeight:600, cursor:'pointer' }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi Hapus Folder */}
      {delFolder && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }} onClick={()=>setDelFolder(null)}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, maxWidth:400, width:'100%', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <span style={{ fontSize:40 }}>📁</span>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#1a2e1d', margin:'12px 0 8px' }}>Hapus Folder?</h2>
            <p style={{ color:'#555', margin:'0 0 8px', fontSize:14 }}>Folder <strong>"{delFolder.name}"</strong> akan dihapus.</p>
            <p style={{ color:'#e74c3c', margin:'0 0 20px', fontSize:13 }}>⚠️ File di dalam folder tidak akan terhapus.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>handleDeleteFolder(delFolder)} style={{ flex:1, background:'#c0392b', color:'#fff', border:'none', padding:12, borderRadius:8, fontWeight:700, cursor:'pointer' }}>Ya, Hapus</button>
              <button onClick={()=>setDelFolder(null)} style={{ flex:1, background:'#f0f5f0', border:'none', padding:12, borderRadius:8, fontWeight:600, cursor:'pointer' }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
