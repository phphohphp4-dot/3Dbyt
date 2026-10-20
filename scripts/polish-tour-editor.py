from pathlib import Path
p=Path('components/3d/TourEditor.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace('return <aside aria-label=', 'return <aside className="tour-editor-panel" aria-label=')
s=s.replace('<div style={{display:', '<style>{`@media(max-width:700px){.tour-editor-panel{top:auto!important;bottom:0!important;right:0!important;width:100%!important;max-height:52vh;box-sizing:border-box;border-radius:18px 18px 0 0!important}}.tour-editor-panel button:disabled{opacity:.45;cursor:default!important}`}</style>\n  <div style={{display:',1)
s=s.replace('Soukromá zkušební varianta v tomto prohlížeči · platnost 24 hodin.', 'Soukromá zkušební varianta v tomto prohlížeči · nejvýše 24 hodin, do restartu serveru.')
p.write_text(s,encoding='utf-8')
