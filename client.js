window.__ModuleLoader__.load({
  id: '@local/dsh-session-mailbox',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useRef, useState } = React

    let flushSync = null
    try { flushSync = require('react-dom').flushSync } catch {}

    const commitView = (update) => {
      if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function' && flushSync) {
        document.startViewTransition(() => { flushSync(update) })
      } else {
        update()
      }
    }

    const API = '/session-mailbox'
    const CLIENT_VERSION = '0.3.24'
    const NO_FOLDER = '无文件夹'

    /* ---------------------------------------------------------------------
       「内嵌块」侧栏会话浏览器
       语义：挂接 = 一块沉进侧栏表面的容器（零连线）；当前会话 = 品牌蓝。
       所有颜色由宿主 token 派生（color-mix），随主题自动翻转，插件不自带主题。
       --------------------------------------------------------------------- */
    const CSS = `
.sm-root{
  position:relative;display:flex;flex-direction:column;flex:1;min-height:0;max-height:100cqh;
  --sm-fg:var(--dsw-alias-label-primary,#e9e7ec);
  --sm-fg-2:var(--dsw-alias-label-secondary,#a9a5b0);
  --sm-fg-3:var(--dsw-alias-label-tertiary,#8a8695);
  --sm-hair:color-mix(in srgb,var(--sm-fg) 6%,transparent);
  --sm-inset:color-mix(in srgb,var(--sm-fg) 4.5%,transparent);
  --sm-inset-ring:color-mix(in srgb,var(--sm-fg) 10%,transparent);
  --sm-inset-top:color-mix(in srgb,var(--sm-fg) 4.5%,transparent);
  --sm-hover:color-mix(in srgb,var(--sm-fg) 6%,transparent);
  --sm-press:color-mix(in srgb,var(--sm-fg) 10%,transparent);
  --sm-badge:color-mix(in srgb,var(--sm-fg) 7%,transparent);
  --sm-brand:var(--dsw-alias-state-business-primary,#4c8dff);
  --sm-brand-bg:color-mix(in srgb,var(--sm-brand) 11%,transparent);
  --sm-brand-bar:color-mix(in srgb,var(--sm-brand) 92%,transparent);
  --sm-ok:var(--dsw-alias-state-success,#3fb950);
  --sm-danger:var(--dsw-alias-state-error,#e5534b);
  --sm-pop:var(--dsw-alias-bg-elevated,#232833);
  --sm-ring:var(--dsw-alias-border-l1,color-mix(in srgb,var(--sm-fg) 14%,transparent));
  color:var(--sm-fg);
  font-family:var(--dsw-font-family,system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif);
  font-size:13px;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.sm-root *,.sm-root *::before,.sm-root *::after{box-sizing:border-box}
.sm-root :focus{outline:none}
.sm-root :focus-visible{outline:2px solid var(--sm-brand);outline-offset:-2px}
.sm-node:focus-visible,.sm-group:focus-visible{outline:none}
.sm-node:focus-visible>.sm-row{background:var(--sm-hover);box-shadow:inset 0 0 0 2px var(--sm-brand)}
.sm-group:focus-visible>.sm-gbody{background:var(--sm-hover);box-shadow:inset 0 0 0 2px var(--sm-brand)}
.sm-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* 工具条 32px（brief 约束） */
.sm-toolbar{flex:none;display:flex;align-items:center;height:32px;padding:0 12px;color:var(--sm-fg-3)}
.sm-toolbar-label{flex:1;min-width:0;font-size:12.5px;font-weight:500;letter-spacing:.03em;color:var(--sm-fg-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sm-acts{margin-left:auto;display:flex;align-items:center;gap:2px}
.sm-ver{font-size:9px;line-height:1;color:var(--sm-fg-3);opacity:.65;margin-right:2px;user-select:none}
.sm-icon{flex:none;display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--sm-fg-3);cursor:pointer;transition:background .12s,color .12s}
.sm-icon svg{width:14px;height:14px}
.sm-icon:hover{background:var(--sm-hover);color:var(--sm-fg)}
.sm-icon:focus-visible{box-shadow:inset 0 0 0 2px var(--sm-brand)}
.sm-searchbar{flex:1;display:flex;align-items:center;gap:6px;height:26px;padding:0 4px 0 7px;border-radius:6px;background:var(--sm-inset);box-shadow:inset 0 0 0 1px var(--sm-inset-ring)}
.sm-searchbar:focus-within{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sm-brand) 45%,transparent)}
.sm-searchbar .si{flex:none;width:13px;height:13px;color:var(--sm-fg-3);display:block}
.sm-searchbar input{flex:1;min-width:0;height:100%;border:0;outline:none;background:transparent;color:var(--sm-fg);font:inherit;font-size:12.5px;padding:0}
.sm-searchbar input::placeholder{color:var(--sm-fg-3)}
.sm-searchbar .clear{flex:none;display:grid;place-items:center;width:20px;height:20px;padding:0;border:0;border-radius:4px;background:transparent;color:var(--sm-fg-3);cursor:pointer}
.sm-searchbar .clear:hover{background:var(--sm-hover);color:var(--sm-fg)}
.sm-searchbar .clear svg{width:11px;height:11px}

/* 滚动区与树 */
.sm-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overflow-x:hidden;padding:0 12px 8px;scrollbar-width:thin}
.sm-tree{display:flex;flex-direction:column;padding-top:2px}
.sm-group{position:relative;display:flex;flex-direction:column}
.sm-group+.sm-group{margin-top:12px}
.sm-group+.sm-group::before{content:"";position:absolute;left:0;right:0;top:-7px;height:1px;background:var(--sm-hair)}
.sm-gbody{display:flex;align-items:center;height:26px;padding:0 6px 0 8px;border-radius:6px;cursor:pointer;user-select:none;transition:background .1s}
.sm-gbody:hover{background:var(--sm-hover)}
.sm-group:focus-visible>.sm-gbody{background:var(--sm-hover);box-shadow:inset 0 0 0 2px var(--sm-brand)}
.sm-gchev{flex:none;width:14px;height:20px;display:grid;place-items:center;color:var(--sm-fg-3)}
.sm-gchev svg{width:12px;height:12px;transition:transform .16s ease}
.sm-group[aria-expanded="true"]>.sm-gbody .sm-gchev svg{transform:rotate(90deg)}
.sm-gbody:hover .sm-gchev{color:var(--sm-fg-2)}
.sm-gname{flex:1;min-width:0;margin-left:6px;font-size:12px;font-weight:600;letter-spacing:.01em;color:var(--sm-fg-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sm-gbody:hover .sm-gname{color:var(--sm-fg)}
.sm-gcount{flex:none;margin-left:8px;padding-right:2px;font-size:10.5px;color:var(--sm-fg-3);font-variant-numeric:tabular-nums;letter-spacing:.02em}

/* 折叠：grid 0fr，网格项必须 min-height:0 且自身无间距 */
.sm-kids{display:grid;grid-template-rows:1fr;overflow:hidden;transition:grid-template-rows .19s cubic-bezier(.2,0,0,1)}
.sm-kids[data-open="0"]{grid-template-rows:0fr}
.sm-inner{min-height:0;overflow:hidden;margin:0;padding:0;border:0;background:none}
.sm-kids[data-open="0"]>.sm-inner{pointer-events:none}

/* 会话行 */
.sm-node{position:relative;display:flex;flex-direction:column}
.sm-row{position:relative;display:flex;align-items:center;height:32px;padding:0 6px 0 8px;border-radius:6px;cursor:pointer;user-select:none;transition:background .1s}
.sm-row:hover{background:var(--sm-hover)}
.sm-row[data-drop="1"]{background:color-mix(in srgb,var(--sm-brand) 14%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sm-brand) 45%,transparent)}
.sm-row[data-drag="1"]{opacity:.42}
.sm-row[data-drop-pos="before"]::after,.sm-row[data-drop-pos="after"]::after{content:"";position:absolute;left:6px;right:6px;height:2px;border-radius:1px;background:var(--sm-brand);pointer-events:none;z-index:3}
.sm-row[data-drop-pos="before"]::after{top:-1px}
.sm-row[data-drop-pos="after"]::after{bottom:-1px}
.sm-node[data-current="1"]>.sm-row{background:var(--sm-brand-bg)}
.sm-node[data-current="1"]>.sm-row::before{content:"";position:absolute;left:2px;top:8px;bottom:8px;width:2px;border-radius:1px;background:var(--sm-brand-bar)}
.sm-nchev{flex:none;display:grid;place-items:center;width:14px;height:20px;margin-right:6px;color:var(--sm-fg-3)}
.sm-nchev[data-has="1"]{cursor:pointer}
.sm-nchev[data-has="1"]:hover{color:var(--sm-fg)}
.sm-nchev svg{width:12px;height:12px;transition:transform .16s ease}
.sm-node[aria-expanded="true"]>.sm-row .sm-nchev svg{transform:rotate(90deg)}
.sm-row:hover .sm-nchev{color:var(--sm-fg-2)}
.sm-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:20px;font-weight:500;letter-spacing:.01em;color:var(--sm-fg)}
.sm-node[data-depth="1"]>.sm-row .sm-title{font-size:12.5px;font-weight:400;color:color-mix(in srgb,var(--sm-fg) 88%,transparent)}
.sm-node[data-depth="2"]>.sm-row .sm-title,.sm-node[data-depth="3"]>.sm-row .sm-title{font-size:12px;font-weight:400;color:var(--sm-fg-2)}
.sm-node[data-depth="1"]>.sm-row{padding-left:24px}
.sm-node[data-depth="2"]>.sm-row{padding-left:40px}
.sm-node[data-depth="3"]>.sm-row{padding-left:56px}
.sm-dot{flex:none;width:6px;height:6px;margin-left:6px;border-radius:50%;background:var(--sm-ok);box-shadow:0 0 0 2px var(--sm-dot-ring,transparent);animation:sm-pulse 1.8s ease-out infinite}
@keyframes sm-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--sm-ok) 45%,transparent)}70%{box-shadow:0 0 0 5px transparent}100%{box-shadow:0 0 0 0 transparent}}
.sm-cnt{flex:none;min-width:17px;height:15px;margin-left:6px;padding:0 4px;border-radius:5px;background:var(--sm-badge);color:var(--sm-fg-2);font-size:10.5px;line-height:15px;text-align:center;font-variant-numeric:tabular-nums}
.sm-more{flex:none;display:grid;place-items:center;width:20px;height:20px;margin-left:2px;border:0;border-radius:4px;background:transparent;color:var(--sm-fg-3);cursor:pointer;opacity:0;transition:opacity .1s,background .1s}
.sm-row:hover .sm-more,.sm-node:focus-visible>.sm-row .sm-more{opacity:1}
.sm-more:hover{background:var(--sm-press);color:var(--sm-fg)}
.sm-more svg{width:14px;height:14px}

/* 内嵌容器：子会话活在块里，块内无连线 */
.sm-inset{margin:4px 0 4px;padding:2px 0 2px;border-radius:8px;background:var(--sm-inset);box-shadow:inset 0 0 0 1px var(--sm-inset-ring),inset 0 2px 0 0 var(--sm-inset-top)}
.sm-plain{margin:0;padding:0}
.sm-kids[data-open="0"]>.sm-inner>.sm-inset{margin:0}

/* 搜索结果：扁平两行 */
.sm-res{display:flex;flex-direction:column;justify-content:center;min-height:44px;padding:5px 6px 5px 8px;border-radius:6px;cursor:pointer}
.sm-res:hover{background:var(--sm-hover)}
.sm-res .sm-title{line-height:18px}
.sm-crumb{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10.5px;line-height:14px;color:var(--sm-fg-3);margin-left:20px}
.sm-res[data-current="1"]{background:var(--sm-brand-bg)}

/* 状态：空、错、骨架、根投放 */
.sm-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;margin:10px 0 0;padding:22px 12px;border-radius:10px;background:var(--sm-inset);box-shadow:inset 0 0 0 1px var(--sm-inset-ring);color:var(--sm-fg-3);font-size:12px;text-align:center}
.sm-empty b{font-weight:500;color:var(--sm-fg-2)}
.sm-empty .sm-mini{font-size:11px;color:var(--sm-fg-3)}
.sm-empty button{margin-top:2px;border:0;border-radius:5px;padding:4px 8px;background:var(--sm-badge);color:var(--sm-fg-2);font:inherit;font-size:11.5px;cursor:pointer}
.sm-empty button:hover{background:var(--sm-hover);color:var(--sm-fg)}
.sm-error{display:flex;align-items:center;gap:6px;margin:2px 12px 6px;padding:6px 8px;border-radius:6px;background:color-mix(in srgb,var(--sm-danger) 12%,transparent);color:var(--sm-danger);font-size:11px}
.sm-error span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sm-error button{flex:none;border:none;background:transparent;color:inherit;font:inherit;text-decoration:underline;cursor:pointer}
.sm-skeleton{padding:6px 0}
.sm-skeleton i{display:block;height:26px;margin:6px 0;border-radius:6px;background:var(--sm-inset);animation:sm-shimmer 1.4s ease-in-out infinite}
@keyframes sm-shimmer{0%,100%{opacity:.45}50%{opacity:.85}}
.sm-rootdrop{display:flex;align-items:center;justify-content:center;height:32px;margin:10px 0 0;border:1px dashed var(--sm-inset-ring);border-radius:6px;color:var(--sm-fg-3);font-size:11px;user-select:none}
.sm-rootdrop[data-over="1"]{border-color:color-mix(in srgb,var(--sm-brand) 55%,transparent);color:var(--sm-brand)}

/* toast */
.sm-toast{position:absolute;left:8px;right:8px;bottom:8px;display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:8px;background:var(--sm-pop);border:1px solid var(--sm-ring);box-shadow:0 14px 30px rgba(0,0,0,.4);color:var(--sm-fg);font-size:12px;z-index:5;overflow:hidden}
.sm-toast[data-error="1"]{color:var(--sm-danger)}
.sm-toast-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sm-toast button{flex:none;border:none;border-radius:4px;background:transparent;color:var(--sm-brand);font:inherit;font-size:12px;cursor:pointer;padding:2px 4px}
.sm-toast button:hover{background:var(--sm-hover)}
.sm-toast .sm-x{color:var(--sm-fg-3);font-size:14px}
.sm-prog{position:absolute;left:0;right:0;bottom:0;height:2px;background:color-mix(in srgb,var(--sm-fg) 10%,transparent)}
.sm-prog i{display:block;height:100%;background:color-mix(in srgb,var(--sm-brand) 85%,transparent);transform-origin:left center;animation:sm-drain 5s linear forwards}
@keyframes sm-drain{from{transform:scaleX(1)}to{transform:scaleX(0)}}

/* 菜单 */
.sm-backdrop{position:absolute;inset:0;z-index:9998}
.sm-menu{position:absolute;z-index:9999;min-width:172px;max-height:min(60vh,360px);overflow:auto;padding:4px;border-radius:8px;background:var(--sm-pop);border:1px solid var(--sm-ring);box-shadow:0 14px 34px rgba(0,0,0,.45)}
.sm-menu-title{padding:4px 8px 6px;font-size:10.5px;letter-spacing:.04em;color:var(--sm-fg-3)}
.sm-menu-item{display:flex;align-items:center;gap:6px;width:100%;padding:6px 8px;border:none;border-radius:5px;background:transparent;color:var(--sm-fg);font:inherit;font-size:12px;text-align:left;cursor:pointer;white-space:nowrap}
.sm-menu-item .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.sm-menu-item:hover,.sm-menu-item:focus-visible{background:var(--sm-hover);outline:none}
.sm-menu-item[data-danger="1"]{color:var(--sm-danger)}

/* 已归档 */
.sm-arch-toggle{display:flex;align-items:center;width:auto;padding:0 6px;gap:4px;font-size:10px;color:var(--sm-fg-3)}
.sm-arch-toggle[data-on="1"]{background:var(--sm-brand-bg);color:var(--sm-brand)}
.sm-arch-n{font-variant-numeric:tabular-nums;opacity:.8}
.sm-archived{margin-top:12px;padding-top:10px;border-top:1px solid var(--sm-hair)}
.sm-arch-head{display:flex;align-items:center;height:22px;padding:0 6px;color:var(--sm-fg-3);font-size:10.5px;font-weight:600;letter-spacing:.04em}
.sm-arch-row{display:flex;align-items:center;height:30px;padding:0 6px 0 26px;border-radius:6px;color:var(--sm-fg-3);font-size:12px}
.sm-arch-row:hover{background:var(--sm-hover);color:var(--sm-fg-2)}
.sm-arch-row .sm-title{font-weight:400;color:inherit}
.sm-arch-restore{flex:none;border:0;background:transparent;color:var(--sm-brand);font:inherit;font-size:11px;padding:2px 5px;border-radius:4px;cursor:pointer}
.sm-arch-restore:hover{background:var(--sm-hover)}

/* 归档确认框 */
.sm-modal-bd{position:absolute;inset:0;z-index:10000;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.45);backdrop-filter:blur(1px)}
.sm-modal{width:100%;max-width:360px;padding:14px;border-radius:10px;background:var(--sm-pop);border:1px solid var(--sm-ring);box-shadow:0 24px 50px rgba(0,0,0,.5)}
.sm-modal-title{font-size:13px;font-weight:600;color:var(--sm-fg);margin-bottom:6px}
.sm-modal-text{font-size:12px;line-height:18px;color:var(--sm-fg-2);white-space:pre-wrap}
.sm-modal-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:14px}
.sm-modal-btn{border:0;border-radius:6px;padding:6px 10px;background:var(--sm-badge);color:var(--sm-fg-2);font:inherit;font-size:12px;cursor:pointer}
.sm-modal-btn:hover{background:var(--sm-hover);color:var(--sm-fg)}
.sm-modal-btn[data-primary="1"]{background:var(--sm-brand);color:#fff}
.sm-modal-btn[data-primary="1"]:hover{filter:brightness(1.08)}
.sm-modal-btn:disabled{opacity:.5;cursor:default}
`

    function Chevron(props) {
      return h('svg', {
        width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': 'true',
      }, h('path', { d: 'M6 4l4 4-4 4' }))
    }

    function SearchIcon() {
      return h('svg', { className: 'si', viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', 'aria-hidden': 'true' },
        h('circle', { cx: 7, cy: 7, r: 4.5 }),
        h('path', { d: 'M10.5 10.5L14 14' }))
    }

    function RefreshIcon() {
      return h('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' },
        h('path', { d: 'M13.5 7a5.5 5.5 0 1 0-1.3 5.2' }),
        h('path', { d: 'M13.5 3.5V7H10' }))
    }

    function MoreIcon() {
      return h('svg', { viewBox: '0 0 16 16', fill: 'currentColor', 'aria-hidden': 'true' },
        h('circle', { cx: 3.5, cy: 8, r: 1.15 }),
        h('circle', { cx: 8, cy: 8, r: 1.15 }),
        h('circle', { cx: 12.5, cy: 8, r: 1.15 }))
    }

    function CloseIcon() {
      return h('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', 'aria-hidden': 'true' },
        h('path', { d: 'M4 4l8 8M12 4l-8 8' }))
    }

    function basename(path) {
      if (!path) return NO_FOLDER
      const parts = String(path).split(/[\\/]+/).filter(Boolean)
      return parts.length ? parts[parts.length - 1] : path
    }

    function subtreeIds(childrenOf, rootId) {
      const seen = new Set()
      const stack = [rootId]
      while (stack.length) {
        const id = stack.pop()
        if (seen.has(id)) continue
        seen.add(id)
        const kids = childrenOf.get(id) || []
        for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i])
      }
      return seen
    }

    function isActiveRefusal(reason) {
      return !!(reason && reason.name === 'WorkspaceArchiveError' && reason.rpcError && reason.rpcError.code === 'workspace/session-active')
    }

    function normalizeTitle(row) {
      if (row && row.blank) return '新会话'
      return (row && (row.displayTitle || row.title)) || (row && row.id) || ''
    }

    function SessionBrowser(props) {
      const useSessions = props.useSessions
      const useWorkspaces = props.useWorkspaces
      const useSectionScroller = props.useSectionScroller
      const open = props.open
      const archiveSession = props.archiveSession
      const unarchiveSession = props.unarchiveSession

      const list = useSessions(state => state)
      const workspaces = useWorkspaces(state => state.items)
      const archivedSessionIds = useWorkspaces(state => state.archivedSessionIds)
      const sectionScroller = typeof useSectionScroller === 'function' ? useSectionScroller() : null
      const bindScrollerRef = sectionScroller && sectionScroller.bindScrollerRef

      const [data, setData] = useState({ edges: [], version: '', updatedAt: 0 })
      const [error, setError] = useState('')
      const [loading, setLoading] = useState(true)
      const [query, setQuery] = useState('')
      const [searchOpen, setSearchOpen] = useState(false)
      const [collapsed, setCollapsed] = useState(() => new Set())
      const [collapsedGroups, setCollapsedGroups] = useState(() => new Set())
      const [dropTarget, setDropTarget] = useState('')
      const [dropPos, setDropPos] = useState('')
      const [dragId, setDragId] = useState('')
      const [dragSet, setDragSet] = useState(() => new Set())
      const [busy, setBusy] = useState(false)
      const [menu, setMenu] = useState(null)
      const [toast, setToast] = useState(null)
      const [focusedId, setFocusedId] = useState('')
      const [showArchived, setShowArchived] = useState(false)
      const [archiveConfirm, setArchiveConfirm] = useState(null)
      const [archiveBusy, setArchiveBusy] = useState(false)

      const dragRef = useRef(null)
      const pointerRef = useRef(null)
      const pointerActionsRef = useRef(null)
      const didDragRef = useRef(false)
      const searchRef = useRef(null)
      const menuRef = useRef(null)
      const toastRef = useRef(null)
      const scrollRef = useRef(null)

      const request = useCallback(async (path, init) => {
        const response = await fetch(API + path, {
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { accept: 'application/json', ...(init && init.body ? { 'content-type': 'application/json' } : {}) },
          ...init,
        })
        let value = null
        try { value = await response.json() } catch {}
        if (!response.ok || !value || value.ok !== true) {
          const message = value && value.error ? value.error : `HTTP ${response.status}`
          const failure = new Error(message)
          failure.status = response.status
          throw failure
        }
        return value
      }, [])

      const log = useCallback((event, extra) => {
        try {
          fetch(API + '/client-log', {
            method: 'POST',
            cache: 'no-store',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ event, clientVersion: CLIENT_VERSION, ...(extra || {}) }),
          }).catch(() => {})
        } catch {}
      }, [])

      const load = useCallback(async () => {
        try {
          const value = await request('/state')
          setData(previous => previous.version === value.version ? previous : {
            edges: Array.isArray(value.edges) ? value.edges : [],
            version: typeof value.version === 'string' ? value.version : '',
            updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
          })
          setError('')
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : String(cause)
          setError(message === 'unauthorized' ? '未授权，请刷新页面' : message)
        } finally {
          setLoading(false)
        }
      }, [request])

      useEffect(() => {
        log('client-loaded')
        load()
        const timer = setInterval(load, 2500)
        return () => clearInterval(timer)
      }, [load, log])

      /* toast：5s 自动消失；若焦点在 toast 内，先归还给树 */
      useEffect(() => {
        if (!toast) return undefined
        const timer = setTimeout(() => {
          const node = toastRef.current
          if (node && node.contains(document.activeElement)) {
            const target = focusedId ? document.querySelector(`.sm-node[data-sid="${cssEscape(focusedId)}"]`) : null
            if (target) target.focus()
          }
          setToast(null)
        }, 5000)
        return () => clearTimeout(timer)
      }, [toast, focusedId])

      useEffect(() => {
        if (searchOpen && searchRef.current) searchRef.current.focus()
      }, [searchOpen])

      /* 菜单首次打开时把焦点放进第一项：可用键盘直接操作 */
      useEffect(() => {
        if (!menu || !menuRef.current) return
        const first = menuRef.current.querySelector('.sm-menu-item')
        if (first) first.focus()
      }, [menu])

      const tree = useMemo(() => {
        const source = list && list.byId ? list.byId : {}
        const ids = list && Array.isArray(list.ids) ? list.ids : []
        const all = ids.map(id => source[id]).filter(Boolean)
        const allById = new Map(all.map(row => [row.id, row]))
        const edges = (data.edges || []).filter(edge => allById.has(edge.childId) && allById.has(edge.parentId))
        const attached = new Set(edges.map(edge => edge.childId))
        const archived = new Set(archivedSessionIds || [])
        /* 父会话归档时整棵子树一起隐藏；groups.json 不动，取消归档即可原样恢复。 */
        const allChildrenOf = new Map()
        for (const edge of edges) {
          const kids = allChildrenOf.get(edge.parentId) || []
          kids.push(edge.childId)
          allChildrenOf.set(edge.parentId, kids)
        }
        const hidden = new Set()
        const hideSubtree = rootId => {
          const stack = [rootId]
          while (stack.length) {
            const id = stack.pop()
            if (hidden.has(id)) continue
            hidden.add(id)
            for (const kid of allChildrenOf.get(id) || []) stack.push(kid)
          }
        }
        for (const id of archived) if (allById.has(id)) hideSubtree(id)
        /* 子代理会话默认隐藏，但被邮箱挂接时必须显示（它就是子行） */
        const rows = all.filter(row => !hidden.has(row.id) && (row.origin !== 'subagent' || attached.has(row.id)))
        const archivedRows = all
          .filter(row => archived.has(row.id) && (row.origin !== 'subagent' || attached.has(row.id)))
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        const byId = new Map(rows.map(row => [row.id, row]))
        const parentOf = new Map()
        const orderOf = new Map()
        for (const edge of edges) {
          if (byId.has(edge.childId) && byId.has(edge.parentId)) {
            parentOf.set(edge.childId, edge.parentId)
            orderOf.set(edge.childId, Number.isFinite(edge.order) ? edge.order : 0)
          }
        }
        const childrenOf = new Map()
        for (const [childId, parentId] of parentOf) {
          const kids = childrenOf.get(parentId) || []
          kids.push(childId)
          childrenOf.set(parentId, kids)
        }
        for (const [id, kids] of childrenOf) {
          kids.sort((a, b) => {
            const left = orderOf.get(a) ?? 0
            const right = orderOf.get(b) ?? 0
            return left - right || (byId.get(a).updatedAt || 0) - (byId.get(b).updatedAt || 0)
          })
          childrenOf.set(id, kids)
        }
        const workspaceTitles = new Map()
        for (const item of workspaces || []) if (item && item.path) workspaceTitles.set(item.path, item.title)
        const groups = new Map()
        const roots = rows.filter(row => !parentOf.has(row.id)).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        for (const row of roots) {
          const cwd = row.cwd || ''
          const key = cwd || '__none__'
          let group = groups.get(key)
          if (!group) {
            const label = cwd ? (workspaceTitles.get(cwd) || basename(cwd)) : NO_FOLDER
            group = { key, label, roots: [] }
            groups.set(key, group)
          }
          group.roots.push(row.id)
        }
        const ordered = [...groups.values()].sort((a, b) => {
          if (a.key === '__none__') return -1
          if (b.key === '__none__') return 1
          return a.label.localeCompare(b.label, 'zh-Hans-CN')
        })
        return { rows, byId, parentOf, childrenOf, ordered, archivedRows }
      }, [list, data.edges, workspaces, archivedSessionIds])

      /* 当前会话：与原生同源判定 —— retainedBy.mainView 的那个 */
      const currentId = useMemo(() => {
        const byId = (list && list.byId) || {}
        for (const id of Object.keys(byId)) {
          const row = byId[id]
          if (row && row.retainedBy && (row.retainedBy.mainView || 0) > 0) return id
        }
        return ''
      }, [list])

      const search = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return null
        const hits = new Set()
        for (const row of tree.rows) {
          const title = normalizeTitle(row).toLowerCase()
          if (title.includes(q) || String(row.id).toLowerCase().includes(q)) hits.add(row.id)
        }
        const visible = new Set(hits)
        for (const id of hits) {
          let parent = tree.parentOf.get(id)
          const guard = new Set([id])
          while (parent && !guard.has(parent)) {
            guard.add(parent)
            visible.add(parent)
            parent = tree.parentOf.get(parent)
          }
        }
        return { hits, visible }
      }, [query, tree])

      const showNode = useCallback(id => !search || search.visible.has(id), [search])

      /* 可见行扁平序：键盘移动只在可见行之间发生 */
      const flat = useMemo(() => {
        const out = []
        if (search) {
          for (const group of tree.ordered) {
            for (const id of group.roots) {
              const walk = (nodeId, depth, groupKey) => {
                if (!search.hits.has(nodeId)) {
                  const kids = tree.childrenOf.get(nodeId) || []
                  for (const kid of kids) walk(kid, depth + 1, groupKey)
                  return
                }
                out.push({ kind: 'res', id: nodeId, depth, groupKey })
              }
              walk(id, 0, group.key)
            }
          }
          return out
        }
        for (const group of tree.ordered) {
          out.push({ kind: 'group', id: 'group:' + group.key, groupKey: group.key })
          if (collapsedGroups.has(group.key)) continue
          const walk = (id, depth) => {
            out.push({ kind: 'node', id, depth })
            if (collapsed.has(id)) return
            for (const kid of tree.childrenOf.get(id) || []) walk(kid, depth + 1)
          }
          for (const id of group.roots) walk(id, 0)
        }
        return out
      }, [tree, search, collapsed, collapsedGroups])

      const orderIndex = useMemo(() => {
        const map = new Map()
        flat.forEach((item, index) => map.set(item.id, index))
        return map
      }, [flat])

      /* 焦点行被折叠/过滤/移出后，回落到最近的可见祖先 */
      useEffect(() => {
        if (!focusedId) return
        if (orderIndex.has(focusedId)) return
        if (focusedId.startsWith('group:')) { setFocusedId(''); return }
        let parent = tree.parentOf.get(focusedId)
        while (parent) {
          if (orderIndex.has(parent)) { setFocusedId(parent); return }
          parent = tree.parentOf.get(parent)
        }
        setFocusedId('')
      }, [focusedId, orderIndex, tree.parentOf])

      const toggleNode = useCallback(id => {
        setCollapsed(previous => {
          const next = new Set(previous)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
      }, [])

      const toggleGroup = useCallback(key => {
        setCollapsedGroups(previous => {
          const next = new Set(previous)
          if (next.has(key)) next.delete(key)
          else next.add(key)
          return next
        })
      }, [])

      const clearDrag = useCallback(() => {
        dragRef.current = null
        pointerRef.current = null
        document.body.style.userSelect = ''
        setDragId('')
        setDragSet(new Set())
        setDropTarget('')
        setDropPos('')
      }, [])

      const attach = useCallback(async (childId, parentId, expectedParentId) => {
        setBusy(true)
        try {
          const value = await request('/attach', {
            method: 'POST',
            body: JSON.stringify({ childId, parentId, expectedParentId }),
          })
          commitView(() => setData(previous => ({
            ...previous,
            version: value.version || previous.version,
            edges: [...previous.edges.filter(edge => edge.childId !== childId), { childId, parentId, updatedAt: Date.now() }],
          })))
          setCollapsed(previous => { const next = new Set(previous); next.delete(parentId); return next })
          setToast({
            text: `已挂到 ${normalizeTitle(tree.byId.get(parentId)) || parentId}`,
            undo: async () => {
              if (expectedParentId) await attach(childId, expectedParentId, parentId)
              else await detach(childId, parentId)
            },
          })
          load()
        } catch (cause) {
          log('attach-failed', { childId, parentId, status: cause?.status, message: String(cause) })
          setToast({ text: `操作失败：${cause instanceof Error ? cause.message : String(cause)}`, error: true })
          load()
        } finally {
          setBusy(false)
        }
      }, [request, tree.byId, load, log])

      const detach = useCallback(async (childId, expectedParentId) => {
        setBusy(true)
        try {
          const value = await request('/detach', {
            method: 'POST',
            body: JSON.stringify({ childId, expectedParentId }),
          })
          commitView(() => setData(previous => ({
            ...previous,
            version: value.version || previous.version,
            edges: previous.edges.filter(edge => edge.childId !== childId),
          })))
          setToast({
            text: '已移出父会话',
            undo: async () => { if (expectedParentId) await attach(childId, expectedParentId, '') },
          })
          load()
        } catch (cause) {
          setToast({ text: `操作失败：${cause instanceof Error ? cause.message : String(cause)}`, error: true })
          load()
        } finally {
          setBusy(false)
        }
      }, [request, load])

      const reorder = useCallback(async (childId, targetId, after) => {
        const parentId = tree.parentOf.get(childId)
        if (!parentId) {
          log('reorder-skipped', { childId, targetId, reason: 'no-parent' })
          return
        }
        log('reorder-request', { childId, targetId, after, parentId })
        setBusy(true)
        try {
          await request('/reorder', {
            method: 'POST',
            body: JSON.stringify({ childId, targetId, after }),
          })
          setData(previous => {
            const siblings = previous.edges
              .filter(edge => edge.parentId === parentId)
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            const without = siblings.filter(edge => edge.childId !== childId)
            const index = without.findIndex(edge => edge.childId === targetId)
            if (index < 0) return previous
            const moved = siblings.find(edge => edge.childId === childId) || { childId, parentId, updatedAt: Date.now() }
            without.splice(after ? index + 1 : index, 0, moved)
            const nextOrder = new Map(without.map((edge, position) => [edge.childId, position]))
            return {
              ...previous,
              edges: previous.edges.map(edge => nextOrder.has(edge.childId) ? { ...edge, order: nextOrder.get(edge.childId) } : edge),
            }
          })
          load()
        } catch (cause) {
          log('reorder-failed', { childId, targetId, after, status: cause?.status, message: String(cause) })
          setToast({ text: `排序失败：${cause instanceof Error ? cause.message : String(cause)}`, error: true })
          load()
        } finally {
          setBusy(false)
        }
      }, [request, tree.parentOf, load, log])

      const unarchiveNow = useCallback(async id => {
        if (typeof unarchiveSession !== 'function') {
          setToast({ text: '当前环境不支持取消归档', error: true })
          return
        }
        setArchiveBusy(true)
        try {
          await unarchiveSession(id)
          setToast({ text: '已取消归档' })
          load()
        } catch (cause) {
          setToast({ text: `取消归档失败：${cause instanceof Error ? cause.message : String(cause)}`, error: true })
        } finally {
          setArchiveBusy(false)
        }
      }, [unarchiveSession, load])

      const archiveNow = useCallback(async (id, stopActivity) => {
        if (typeof archiveSession !== 'function') {
          setToast({ text: '当前环境不支持归档', error: true })
          return
        }
        setArchiveBusy(true)
        try {
          await archiveSession(id, stopActivity ? { stopActivity: true } : undefined)
          setToast({ text: '已归档', undo: () => { void unarchiveNow(id) } })
          load()
        } catch (cause) {
          if (!stopActivity && isActiveRefusal(cause)) {
            const row = tree.byId.get(id)
            const kids = tree.childrenOf.get(id) || []
            const subtree = subtreeIds(tree.childrenOf, id)
            setArchiveConfirm({
              id,
              title: row ? normalizeTitle(row) : id,
              running: true,
              stopActivity: true,
              childCount: kids.length,
              activeChildren: [...subtree].filter(childId => childId !== id && tree.byId.get(childId)?.running).length,
            })
          } else {
            setToast({ text: `归档失败：${cause instanceof Error ? cause.message : String(cause)}`, error: true })
          }
        } finally {
          setArchiveBusy(false)
        }
      }, [archiveSession, tree.byId, tree.childrenOf, unarchiveNow, load])

      const requestArchive = useCallback(row => {
        if (!row) return
        const kids = tree.childrenOf.get(row.id) || []
        const subtree = subtreeIds(tree.childrenOf, row.id)
        const activeChildren = [...subtree].filter(childId => childId !== row.id && tree.byId.get(childId)?.running).length
        if (row.running || kids.length > 0) {
          setArchiveConfirm({
            id: row.id,
            title: normalizeTitle(row),
            running: !!row.running,
            stopActivity: !!row.running,
            childCount: kids.length,
            activeChildren,
          })
        } else {
          void archiveNow(row.id, false)
        }
      }, [tree.childrenOf, tree.byId, archiveNow])

      const confirmArchive = useCallback(() => {
        const target = archiveConfirm
        if (!target) return
        setArchiveConfirm(null)
        void archiveNow(target.id, target.stopActivity)
      }, [archiveConfirm, archiveNow])

      const onDropRow = useCallback((event, targetId) => {
        event.preventDefault()
        event.stopPropagation()
        const drag = dragRef.current
        const rowEl = event.currentTarget.querySelector(':scope > .sm-row')
        const rect = (rowEl || event.currentTarget).getBoundingClientRect()
        const dropAfter = event.clientY > rect.top + rect.height / 2
        clearDrag()
        if (!drag || drag.id === targetId || drag.set.has(targetId)) return
        const dragParent = tree.parentOf.get(drag.id) || ''
        const targetParent = tree.parentOf.get(targetId) || ''
        if (dragParent && dragParent === targetParent) {
          reorder(drag.id, targetId, dropAfter)
        } else {
          attach(drag.id, targetId, dragParent)
        }
      }, [attach, clearDrag, reorder, tree.parentOf])

      const onDropRoot = useCallback(event => {
        event.preventDefault()
        const drag = dragRef.current
        clearDrag()
        if (!drag) return
        const parent = tree.parentOf.get(drag.id)
        if (parent) detach(drag.id, parent)
      }, [clearDrag, detach, tree.parentOf])

      const onDragStart = useCallback((event, id) => {
        event.stopPropagation()
        didDragRef.current = true
        if (busy) { event.preventDefault(); return }
        const set = subtreeIds(tree.childrenOf, id)
        const drag = { id, set }
        dragRef.current = drag
        setDragId(id)
        setDragSet(set)
        setMenu(null)
        try {
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', id)
        } catch {}
      }, [busy, tree.childrenOf])

      const onDragOverRow = useCallback((event, id) => {
        const drag = dragRef.current
        if (!drag || drag.id === id || drag.set.has(id)) return
        event.preventDefault()
        event.stopPropagation()
        try { event.dataTransfer.dropEffect = 'move' } catch {}
        const rowEl = event.currentTarget.querySelector(':scope > .sm-row')
        const rect = (rowEl || event.currentTarget).getBoundingClientRect()
        setDropTarget(id)
        setDropPos(event.clientY > rect.top + rect.height / 2 ? 'after' : 'before')
      }, [])

      const onPointerDownRow = useCallback((event, id) => {
        if (event.button !== 0) return
        if (busy || event.isPrimary === false) return
        if (event.target.closest && event.target.closest('button')) return
        didDragRef.current = false
        pointerRef.current = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, active: false }
        log('pointerdown', { id, button: event.button })
      }, [busy, log])

      pointerActionsRef.current = {
        tree,
        attach,
        detach,
        reorder,
        clearDrag,
        setDropTarget,
        setDropPos,
        setDragId,
        setDragSet,
        setMenu,
        log,
      }

      useEffect(() => {
        if (typeof window === 'undefined') return undefined
        const move = event => {
          const pointer = pointerRef.current
          if (!pointer || event.pointerId !== pointer.pointerId) return
          const actions = pointerActionsRef.current
          if (!pointer.active) {
            if (Math.abs(event.clientX - pointer.x) + Math.abs(event.clientY - pointer.y) < 5) return
            pointer.active = true
            didDragRef.current = true
            actions.log('dragstart', { id: pointer.id })
            const set = subtreeIds(actions.tree.childrenOf, pointer.id)
            dragRef.current = { id: pointer.id, set }
            actions.setDragId(pointer.id)
            actions.setDragSet(set)
            actions.setMenu(null)
            document.body.style.userSelect = 'none'
          }
          event.preventDefault()
          const element = document.elementFromPoint(event.clientX, event.clientY)
          const root = element && element.closest ? element.closest('.sm-rootdrop') : null
          if (root) {
            actions.setDropTarget('__root__')
            actions.setDropPos('')
            return
          }
          const node = element && element.closest ? element.closest('.sm-node[data-sid]') : null
          if (!node) {
            actions.setDropTarget('')
            actions.setDropPos('')
            return
          }
          const targetId = node.getAttribute('data-sid')
          const drag = dragRef.current
          if (!drag || drag.id === targetId || drag.set.has(targetId)) {
            actions.setDropTarget('')
            actions.setDropPos('')
            return
          }
          const rowEl = node.querySelector(':scope > .sm-row') || node
          const rect = rowEl.getBoundingClientRect()
          actions.setDropTarget(targetId)
          actions.setDropPos(event.clientY > rect.top + rect.height / 2 ? 'after' : 'before')
        }
        const up = event => {
          const pointer = pointerRef.current
          if (!pointer || event.pointerId !== pointer.pointerId) return
          const actions = pointerActionsRef.current
          if (event.type === 'pointercancel') {
            actions.clearDrag()
            actions.log('drag-cancel', { id: pointer.id, reason: 'pointercancel' })
            return
          }
          if (!pointer.active) {
            pointerRef.current = null
            actions.log('click', { id: pointer.id })
            return
          }
          const element = document.elementFromPoint(event.clientX, event.clientY)
          const root = element && element.closest ? element.closest('.sm-rootdrop') : null
          const node = element && element.closest ? element.closest('.sm-node[data-sid]') : null
          const drag = dragRef.current
          const targetId = node ? node.getAttribute('data-sid') : ''
          const dragParent = actions.tree.parentOf.get(pointer.id) || ''
          const targetParent = actions.tree.parentOf.get(targetId) || ''
          const logDrop = (branch, extra) => actions.log('drop', {
            id: pointer.id, target: root ? '__root__' : targetId, targetId, dragParent, targetParent, branch, ...extra,
          })
          actions.clearDrag()
          if (!drag) return logDrop('skip', { reason: 'missing-drag' })
          if (root) {
            if (!dragParent) return logDrop('skip', { reason: 'already-root' })
            logDrop('detach')
            actions.detach(drag.id, dragParent)
            return
          }
          if (!targetId) return logDrop('skip', { reason: 'no-target' })
          if (drag.id === targetId) return logDrop('skip', { reason: 'self' })
          if (drag.set.has(targetId)) return logDrop('skip', { reason: 'descendant' })
          const rowEl = node.querySelector(':scope > .sm-row') || node
          const rect = rowEl.getBoundingClientRect()
          const dropAfter = event.clientY > rect.top + rect.height / 2
          if (dragParent && dragParent === targetParent) {
            logDrop('reorder', { after: dropAfter })
            actions.reorder(drag.id, targetId, dropAfter)
          } else {
            logDrop('attach')
            actions.attach(drag.id, targetId, dragParent)
          }
        }
        window.addEventListener('pointermove', move, { passive: false })
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
        return () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
          window.removeEventListener('pointercancel', up)
          document.body.style.userSelect = ''
        }
      }, [])

      const anchorRect = (element) => {
        let target = element
        if (target && target.matches && target.matches('.sm-node, .sm-group')) {
          target = target.querySelector(':scope > .sm-row, :scope > .sm-gbody') || target
        }
        const rect = target && target.getBoundingClientRect ? target.getBoundingClientRect() : { right: 220, bottom: 80 }
        const root = target && target.closest ? target.closest('.sm-root') : null
        const base = root && root.getBoundingClientRect ? root.getBoundingClientRect() : { left: 0, top: 0 }
        return { right: rect.right - base.left, bottom: rect.bottom - base.top, left: rect.left - base.left, width: rect.width }
      }

      const openMenu = useCallback((event, id, mode) => {
        if (event) { event.preventDefault(); event.stopPropagation() }
        const direct = event && event.currentTarget && event.currentTarget.getAttribute && event.currentTarget.getAttribute('data-sid')
        const focused = document.activeElement && document.activeElement.closest ? document.activeElement.closest('[data-sid]') : null
        const anchor = direct ? event.currentTarget
          : (focused && focused.getAttribute('data-sid') === id ? focused
            : (scrollRef.current ? scrollRef.current.querySelector(`[data-sid="${cssEscape(id)}"]`) : null))
        const rect = anchorRect(anchor)
        const root = anchor && anchor.closest ? anchor.closest('.sm-root') : null
        const box = root ? root.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight }
        const width = mode === 'attach' ? 240 : 188
        const x = Math.max(8, Math.min(rect.right - width, box.width - width - 8))
        const y = Math.min(rect.bottom + 4, Math.max(8, box.height - 200))
        setMenu({ id, mode: mode || 'row', x, y })
      }, [])

      const copyId = useCallback(async id => {
        try { await navigator.clipboard.writeText(id) }
        catch {
          try {
            const area = document.createElement('textarea')
            area.value = id
            area.style.position = 'fixed'
            area.style.opacity = '0'
            document.body.appendChild(area)
            area.select()
            document.execCommand('copy')
            area.remove()
          } catch {}
        }
        setToast({ text: '已复制会话 ID' })
        setMenu(null)
      }, [])

      /* ---------------- 键盘 ---------------- */

      const focusSid = useCallback(id => {
        if (!id) return
        setFocusedId(id)
        const node = scrollRef.current && scrollRef.current.querySelector(`[data-sid="${cssEscape(id)}"]`)
        if (node) node.focus()
      }, [])

      /* 菜单打开期间接管 Esc：焦点不在菜单内时也能关闭并归还焦点 */
      useEffect(() => {
        if (!menu) return
        const onDocKey = event => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          event.stopPropagation()
          const back = menu.id
          setMenu(null)
          focusSid(back)
        }
        document.addEventListener('keydown', onDocKey, true)
        return () => document.removeEventListener('keydown', onDocKey, true)
      }, [menu, focusSid])

      useEffect(() => {
        if (!archiveConfirm) return
        const onDocKey = event => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          event.stopPropagation()
          setArchiveConfirm(null)
        }
        document.addEventListener('keydown', onDocKey, true)
        return () => document.removeEventListener('keydown', onDocKey, true)
      }, [archiveConfirm])

      const moveBy = useCallback((delta, anchor) => {
        if (!flat.length) return
        const from = anchor && orderIndex.has(anchor) ? anchor : focusedId
        const index = orderIndex.has(from) ? orderIndex.get(from) : -1
        if (index < 0) { focusSid(flat[0].id); return }
        const next = Math.min(flat.length - 1, Math.max(0, index + delta))
        const item = flat[next]
        if (item) focusSid(item.id)
      }, [flat, orderIndex, focusedId, focusSid])

      const onTreeKeyDown = useCallback((event) => {
        const target = event.target
        const holder = target && target.closest ? target.closest('[data-sid]') : null
        const sid = holder ? holder.getAttribute('data-sid') : ''
        if (!sid) return
        const item = flat.find(entry => entry.id === sid)
        if (!item) return
        const isGroup = item.kind === 'group'
        const key = event.key

        if (key === 'ArrowDown') { event.preventDefault(); moveBy(1, sid); return }
        if (key === 'ArrowUp') { event.preventDefault(); moveBy(-1, sid); return }
        if (key === 'Home') { event.preventDefault(); if (flat[0]) focusSid(flat[0].id); return }
        if (key === 'End') { event.preventDefault(); if (flat.length) focusSid(flat[flat.length - 1].id); return }
        if (key === '/') { event.preventDefault(); setSearchOpen(true); return }
        if (key === 'F10' && event.shiftKey) { event.preventDefault(); openMenu(event, sid, 'row'); return }
        if (key === 'ContextMenu') { event.preventDefault(); openMenu(event, sid, 'row'); return }

        if (isGroup) {
          const group = tree.ordered.find(entry => 'group:' + entry.key === sid)
          const isCollapsed = collapsedGroups.has(item.groupKey)
          if (key === 'ArrowRight' && isCollapsed) { event.preventDefault(); toggleGroup(item.groupKey); return }
          if (key === 'ArrowLeft' && !isCollapsed) { event.preventDefault(); toggleGroup(item.groupKey); return }
          if (key === 'Enter' || key === ' ') { event.preventDefault(); toggleGroup(item.groupKey); return }
          return
        }

        const isCollapsed = collapsed.has(sid)
        const hasKids = (tree.childrenOf.get(sid) || []).length > 0
        if (key === 'Enter' || key === ' ') { event.preventDefault(); open(sid); return }
        if (key === 'ArrowRight') {
          event.preventDefault()
          if (hasKids && isCollapsed) toggleNode(sid)
          else {
            const next = flat[orderIndex.get(sid) + 1]
            if (next && next.kind === 'node') focusSid(next.id)
          }
          return
        }
        if (key === 'ArrowLeft') {
          event.preventDefault()
          if (hasKids && !isCollapsed) { toggleNode(sid); return }
          // 行首级：跳到父行
          const parent = tree.parentOf.get(sid)
          if (parent) focusSid(parent)
          return
        }
        if (key === 's') { event.preventDefault(); setCollapsed(previous => {
          const next = new Set(previous)
          if (next.has(sid)) next.delete(sid); else next.add(sid)
          return next
        }) }
      }, [flat, orderIndex, focusSid, moveBy, open, tree.childrenOf, tree.parentOf, tree.ordered, collapsed, collapsedGroups, toggleNode, toggleGroup, openMenu])

      /* ---------------- 渲染 ---------------- */

      const isCurrent = id => currentId && id === currentId

      const groupNode = (group) => {
        const collapsedGroup = collapsedGroups.has(group.key) && !search
        const sid = 'group:' + group.key
        return h('div', {
          key: sid,
          className: 'sm-group',
          role: 'treeitem',
          'aria-level': 1,
          'aria-expanded': collapsedGroup ? 'false' : 'true',
          'aria-label': group.label,
          'data-sid': sid,
          'data-kind': 'group',
          tabIndex: flat.length && flat[0].id === sid ? 0 : (focusedId === sid ? 0 : -1),
        },
          h('div', {
            className: 'sm-gbody',
            onPointerDown: event => { if (event.button === 0) didDragRef.current = false },
            onClick: event => { if (!didDragRef.current || event.detail === 0) toggleGroup(group.key) },
          },
            h('span', { className: 'sm-gchev' }, h(Chevron)),
            h('span', { className: 'sm-gname' }, group.label),
            h('span', { className: 'sm-gcount' }, String(group.roots.length)),
          ),
          h('div', { className: 'sm-kids', 'data-open': collapsedGroup ? '0' : '1' },
            h('div', { className: 'sm-inner', role: 'group', 'aria-hidden': collapsedGroup ? 'true' : undefined },
              h('div', null, group.roots.map((id, index) => renderNode(id, 0, index === group.roots.length - 1))),
            ),
          ),
        )
      }

      const renderNode = (id, depth, isLast) => {
        const row = tree.byId.get(id)
        if (!row) return null
        if (!showNode(id)) return null
        const allKids = tree.childrenOf.get(id) || []
        const kids = allKids.filter(showNode)
        const entry = collapsed.has(id)
        const expanded = allKids.length > 0 && !entry
        const isFirst = flat.length && flat[0].id === id
        const tab = focusedId === id ? 0 : (focusedId ? -1 : (isFirst ? 0 : -1))
        const title = normalizeTitle(row)
        return h('div', {
          key: id,
          className: 'sm-node',
          role: 'treeitem',
          'aria-level': depth + 2,
          'aria-expanded': allKids.length ? (expanded ? 'true' : 'false') : undefined,
          'aria-current': isCurrent(id) ? 'true' : undefined,
          'aria-label': row.running ? `${title}，正在运行` : title,
          'data-sid': id,
          'data-depth': depth,
          'data-current': isCurrent(id) ? '1' : undefined,
          tabIndex: tab,
          onClick: event => {
            if (didDragRef.current) return
            if (event.target.closest && event.target.closest('button')) return
            setFocusedId(id)
            open(id)
          },
          onFocus: () => setFocusedId(id),
        },
          h('div', {
            className: 'sm-row',
            onPointerDown: event => onPointerDownRow(event, id),
            'data-drop': dropTarget === id ? '1' : undefined,
            'data-drop-pos': dropTarget === id && dropPos ? dropPos : undefined,
            'data-drag': dragSet.has(id) ? '1' : undefined,
            title,
            onClick: event => {
              event.stopPropagation()
              if (didDragRef.current) return
              if (event.target.closest && event.target.closest('button')) return
              setFocusedId(id)
              if (event.currentTarget.parentElement && event.currentTarget.parentElement.focus) event.currentTarget.parentElement.focus()
              open(id)
            },
          },
            h('span', {
              className: 'sm-nchev',
              'data-has': allKids.length ? '1' : undefined,
              role: allKids.length ? 'button' : undefined,
              tabIndex: allKids.length ? -1 : undefined,
              'aria-label': allKids.length ? (expanded ? '收起子会话' : '展开子会话') : undefined,
              title: allKids.length ? (expanded ? '收起子会话' : '展开子会话') : undefined,
              onClick: event => {
                if (!allKids.length) return
                event.preventDefault()
                event.stopPropagation()
                toggleNode(id)
              },
            }, allKids.length ? h(Chevron) : null),
            h('span', { className: 'sm-title' }, title || '未命名'),
            row.running ? h('span', { className: 'sm-dot', 'aria-hidden': 'true' }) : null,
            allKids.length ? h('span', { className: 'sm-cnt', 'aria-hidden': 'true' }, String(allKids.length)) : null,
            h('button', {
              className: 'sm-more',
              tabIndex: -1,
              title: '更多操作',
              'aria-label': '更多操作',
              onClick: event => { setFocusedId(id); openMenu(event, id, 'row') },
            }, h(MoreIcon)),
          ),
          allKids.length ? h('div', { className: 'sm-kids', 'data-open': expanded ? '1' : '0' },
            h('div', { className: 'sm-inner', role: 'group', 'aria-hidden': expanded ? undefined : 'true' },
              depth === 0
                ? h('div', { className: 'sm-inset' },
                  kids.map((kid, index) => renderNode(kid, depth + 1, index === kids.length - 1)),
                )
                : h('div', { className: 'sm-plain' },
                  kids.map((kid, index) => renderNode(kid, depth + 1, index === kids.length - 1)),
                ),
            ),
          ) : null,
        )
      }

      const renderSearch = () => {
        if (!search) return null
        const items = flat.filter(item => item.kind === 'res')
        if (!items.length) {
          return h('div', { className: 'sm-empty' },
            h('b', null, `没有找到「${query.trim()}」相关的会话`),
            h('span', { className: 'sm-mini' }, '搜索只匹配会话标题'),
            h('button', { onClick: () => setQuery('') }, '清除搜索'),
          )
        }
        return items.map((item, index) => {
          const row = tree.byId.get(item.id)
          if (!row) return null
          const chain = []
          let parent = tree.parentOf.get(item.id)
          const guard = new Set([item.id])
          while (parent && !guard.has(parent)) {
            guard.add(parent)
            chain.unshift(normalizeTitle(tree.byId.get(parent)))
            parent = tree.parentOf.get(parent)
          }
          const group = tree.ordered.find(entry => entry.key === item.groupKey)
          const crumb = [group ? group.label : '', ...chain].filter(Boolean).join(' · ')
          return h('div', {
            key: item.id,
            className: 'sm-res',
            role: 'treeitem',
            'aria-level': 2,
            'aria-label': crumb ? `${normalizeTitle(row)}，${crumb}` : normalizeTitle(row),
            'data-sid': item.id,
            'data-current': isCurrent(item.id) ? '1' : undefined,
            tabIndex: focusedId === item.id ? 0 : (focusedId ? -1 : (index === 0 ? 0 : -1)),
            onClick: () => { setFocusedId(item.id); open(item.id) },
            onFocus: () => setFocusedId(item.id),
          },
            h('span', { className: 'sm-title' }, normalizeTitle(row)),
            crumb ? h('span', { className: 'sm-crumb' }, crumb) : null,
          )
        })
      }

      const candidateParents = useMemo(() => {
        if (!menu || menu.mode !== 'attach') return []
        const blocked = subtreeIds(tree.childrenOf, menu.id)
        return tree.rows
          .filter(row => !blocked.has(row.id))
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
          .slice(0, 40)
      }, [menu, tree])

      const toastNode = toast ? h('div', {
        className: 'sm-toast',
        'data-error': toast.error ? '1' : undefined,
        role: 'status',
        ref: toastRef,
      },
        h('span', { className: 'sm-toast-text', title: toast.text }, toast.text),
        toast.undo ? h('button', { onClick: () => { const action = toast.undo; setToast(null); action() } }, '撤销') : null,
        h('button', { className: 'sm-x', 'aria-label': '关闭', onClick: () => setToast(null), style: { width: 22, padding: 0, display: 'grid', placeItems: 'center', border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer' } }, '×'),
        h('span', { className: 'sm-prog', 'aria-hidden': 'true' }, h('i')),
      ) : null

      const archivedSection = !search && showArchived && tree.archivedRows.length
        ? h('div', { className: 'sm-archived', key: 'archived' },
            h('div', { className: 'sm-arch-head' },
              h('span', null, '已归档'),
              h('span', { className: 'sm-gcount' }, String(tree.archivedRows.length)),
            ),
            tree.archivedRows.map(row => h('div', {
              key: 'archived:' + row.id,
              className: 'sm-arch-row',
              title: normalizeTitle(row),
            },
              h('span', { className: 'sm-title' }, normalizeTitle(row)),
              h('button', {
                className: 'sm-arch-restore',
                disabled: archiveBusy,
                onClick: () => { void unarchiveNow(row.id) },
              }, '恢复'),
            )),
          )
        : null

      const archiveConfirmNode = archiveConfirm ? h('div', {
        className: 'sm-modal-bd',
        onMouseDown: event => { if (event.target === event.currentTarget) setArchiveConfirm(null) },
      },
        h('div', {
          className: 'sm-modal',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': '归档会话',
        },
          h('div', { className: 'sm-modal-title' }, '归档会话？'),
          h('div', { className: 'sm-modal-text' },
            `「${archiveConfirm.title}」`,
            archiveConfirm.running ? '\n该会话正在运行，归档会停止当前工作。' : '',
            archiveConfirm.childCount
              ? `\n它还有 ${archiveConfirm.childCount} 个子会话；归档后整棵子树会一起隐藏，取消归档时原样恢复。`
              : '',
            archiveConfirm.activeChildren
              ? `\n其中 ${archiveConfirm.activeChildren} 个子会话正在运行，归档父会话不会停止它们。`
              : '',
          ),
          h('div', { className: 'sm-modal-actions' },
            h('button', { className: 'sm-modal-btn', onClick: () => setArchiveConfirm(null) }, '取消'),
            h('button', {
              className: 'sm-modal-btn',
              'data-primary': '1',
              disabled: archiveBusy,
              onClick: confirmArchive,
            }, archiveConfirm.stopActivity ? '停止并归档' : '归档'),
          ),
        ),
      ) : null

      const menuNode = menu ? [
        h('div', { key: 'bd', className: 'sm-backdrop', onMouseDown: () => setMenu(null) }),
        h('div', {
          key: 'menu',
          className: 'sm-menu',
          role: 'menu',
          ref: menuRef,
          'aria-label': menu.mode === 'attach' ? '挂到父会话' : '会话操作',
          style: { left: menu.x, top: menu.y },
          onKeyDown: event => {
            const items = [...(menuRef.current ? menuRef.current.querySelectorAll('.sm-menu-item') : [])]
            const index = items.indexOf(document.activeElement)
            if (event.key === 'Escape') { event.preventDefault(); setMenu(null); focusSid(menu.id); return }
            if (event.key === 'ArrowDown') { event.preventDefault(); (items[Math.min(items.length - 1, index + 1)] || items[0]).focus(); return }
            if (event.key === 'ArrowUp') { event.preventDefault(); (items[Math.max(0, index - 1)] || items[items.length - 1]).focus(); return }
            if (event.key === 'Home') { event.preventDefault(); if (items[0]) items[0].focus(); return }
            if (event.key === 'End') { event.preventDefault(); if (items.length) items[items.length - 1].focus(); return }
            if (event.key === '/') event.stopPropagation()
          },
        },
          menu.mode === 'attach'
            ? [
                h('div', { key: 't', className: 'sm-menu-title' }, '挂到…'),
                ...candidateParents.map(row => h('button', {
                  key: row.id,
                  className: 'sm-menu-item',
                  role: 'menuitem',
                  onClick: () => {
                    const targetId = menu.id
                    const expected = tree.parentOf.get(targetId) || ''
                    setMenu(null)
                    attach(targetId, row.id, expected)
                  },
                }, h('span', { className: 't' }, normalizeTitle(row)))),
              ]
            : [
                h('button', { key: 'open', className: 'sm-menu-item', role: 'menuitem', onClick: () => { setMenu(null); open(menu.id) } }, '打开会话'),
                h('button', { key: 'attach', className: 'sm-menu-item', role: 'menuitem', onClick: () => setMenu(previous => previous ? { ...previous, mode: 'attach' } : previous) }, '挂到父会话…'),
                h('button', { key: 'copy', className: 'sm-menu-item', role: 'menuitem', onClick: () => copyId(menu.id) }, '复制会话 ID'),
                h('button', {
                  key: 'archive',
                  className: 'sm-menu-item',
                  role: 'menuitem',
                  disabled: archiveBusy,
                  onClick: () => {
                    const row = tree.byId.get(menu.id)
                    setMenu(null)
                    requestArchive(row)
                  },
                }, '归档会话'),
                tree.parentOf.has(menu.id)
                  ? h('button', {
                      key: 'detach',
                      className: 'sm-menu-item',
                      role: 'menuitem',
                      'data-danger': '1',
                      onClick: () => { const parent = tree.parentOf.get(menu.id); setMenu(null); detach(menu.id, parent) },
                    }, '移出父会话')
                  : null,
              ],
        ),
      ] : null

      const searchItems = renderSearch()

      return h('div', { className: 'sm-root', 'data-busy': (busy || archiveBusy) ? '1' : undefined },
        h('div', { className: 'sm-toolbar' },
          searchOpen
            ? h('div', { className: 'sm-searchbar' },
                h(SearchIcon),
                h('input', {
                  ref: searchRef,
                  value: query,
                  placeholder: '搜索会话',
                  'aria-label': '搜索会话',
                  onChange: event => setQuery(event.target.value),
                  onKeyDown: event => {
                    if (event.key === 'Escape') { setQuery(''); setSearchOpen(false); setFocusedId('') }
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      const first = flat[0]
                      if (first) focusSid(first.id)
                    }
                  },
                }),
                h('button', { className: 'clear', 'aria-label': '清除并关闭搜索', onClick: () => { setQuery(''); setSearchOpen(false) } }, h(CloseIcon)),
              )
            : h('span', { className: 'sm-toolbar-label' }, '会话'),
          h('div', { className: 'sm-acts' },
            h('span', { className: 'sm-ver', title: 'session-mailbox ' + CLIENT_VERSION }, CLIENT_VERSION),
            tree.archivedRows.length
              ? h('button', {
                  className: 'sm-icon sm-arch-toggle',
                  title: showArchived ? '隐藏已归档' : `已归档 ${tree.archivedRows.length}`,
                  'aria-label': showArchived ? '隐藏已归档' : `查看已归档 ${tree.archivedRows.length}`,
                  'aria-pressed': showArchived ? 'true' : 'false',
                  'data-on': showArchived ? '1' : undefined,
                  onClick: () => setShowArchived(value => !value),
                }, '已归档 ', h('span', { className: 'sm-arch-n' }, String(tree.archivedRows.length)))
              : null,
            !searchOpen ? h('button', { className: 'sm-icon', title: '搜索', 'aria-label': '搜索', onClick: () => setSearchOpen(true) }, h(SearchIcon)) : null,
            !searchOpen ? h('button', { className: 'sm-icon', title: '刷新', 'aria-label': '刷新', onClick: load }, h(RefreshIcon)) : null,
          ),
        ),
        error ? h('div', { className: 'sm-error' },
          h('span', { title: error }, error),
          h('button', { onClick: load }, '重试'),
        ) : null,
        h('div', {
          className: 'sm-scroll',
          ref: node => { scrollRef.current = node; if (bindScrollerRef) bindScrollerRef(node) },
          onKeyDown: onTreeKeyDown,
        },
          loading && tree.rows.length === 0
            ? h('div', { className: 'sm-skeleton' }, [0, 1, 2, 3].map(index => h('i', { key: index })))
            : null,
          !loading && tree.rows.length === 0 && !(showArchived && tree.archivedRows.length)
            ? h('div', { className: 'sm-empty' },
                h('b', null, tree.archivedRows.length ? '没有活跃会话' : '还没有会话'),
                tree.archivedRows.length
                  ? h('button', { onClick: () => setShowArchived(true) }, `查看已归档 ${tree.archivedRows.length}`)
                  : h('span', { className: 'sm-mini' }, '新建会话后会显示在这里'),
              )
            : null,
          (tree.rows.length || (showArchived && tree.archivedRows.length))
            ? h('div', { className: 'sm-tree', role: 'tree', 'aria-label': '会话列表', 'aria-multiselectable': undefined },
                search
                  ? searchItems
                  : [...tree.ordered.map(group => groupNode(group)), archivedSection],
              )
            : null,
          dragId ? h('div', {
            className: 'sm-rootdrop',
            'data-over': dropTarget === '__root__' ? '1' : undefined,
          }, '拖到这里移出父会话（回到顶层）') : null,
        ),
        toastNode,
        menuNode,
        archiveConfirmNode,
      )
    }

    function cssEscape(value) {
      if (typeof CSS !== 'undefined' && CSS && typeof CSS.escape === 'function') return CSS.escape(value)
      return String(value).replace(/["\\]/g, '\\$&')
    }

    function apply(ctx) {
      const style = document.createElement('style')
      style.dataset.dshSessionMailbox = 'native-sidebar'
      style.textContent = CSS
      ctx.effect(() => {
        document.head.appendChild(style)
        return () => style.remove()
      })
      ctx.slots.inject('sidebar.workspaces', () => ctx.slots.register({
        name: 'sidebar.workspaces',
        priority: -100,
        inject: () => ({
          open: id => ctx.uiWorkspace.openSession(id),
          archiveSession: (id, options) => ctx.uiWorkspace.archiveSession(id, options),
          unarchiveSession: id => ctx.uiWorkspace.unarchiveSession(id),
        }),
      }, SessionBrowser))
    }

    return {
      inject: ['slots', 'uiWorkspace'],
      apply,
    }
  },
})
