'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import Store from '@/lib/store';
import { formatDateTime, formatMoney, getMachineName, formatDate } from '@/lib/utils';
import type { Piece, StockMovement, Machine, Organe, Intervention, DemandeAchat } from '@/lib/types';

type View = 'list' | 'detail' | 'movement';

export default function StockPage() {
  const auth = useAuth();
  const { hasPermission } = auth;
  const { toast } = useApp();
  const [view, setView] = useState<View>('list');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterAlert, setFilterAlert] = useState('all');
  const [page, setPage] = useState(1);
  const [pieceModal, setPieceModal] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const gv = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

  const exportCSV = () => { const pieces = Store.getAll<Piece>('pieces'); const lines = ['Ref;Designation;Prix unitaire;Stock;Seuil;Emplacement;Fournisseur;Delai']; pieces.forEach((p) => lines.push([p.ref, p.designation, p.prix_unitaire, p.stock_actuel, p.seuil_reappro, p.emplacement || '', p.fournisseur || '', p.delai_livraison || ''].join(';'))); const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'stock_export.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  const importCSV = () => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv'; input.onchange = (e: any) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev: any) => { const lines = ev.target.result.split('\n'); let count = 0; for (let i = 1; i < lines.length; i++) { const cols = lines[i].split(';'); if (cols.length < 4) continue; Store.upsert('pieces', { id: Store.generateId('pce'), ref: cols[0].trim(), designation: cols[1].trim(), prix_unitaire: parseInt(cols[2]) || 0, stock_actuel: parseInt(cols[3]) || 0, seuil_reappro: parseInt(cols[4]) || 0, emplacement: (cols[5] || '').trim(), machine_id: null, organe_id: null, fournisseur: (cols[6] || '').trim(), delai_livraison: parseInt(cols[7]) || 0 } as Piece); count++; } toast(count + ' pieces importees', 'success'); refresh(); }; reader.readAsText(file); }; input.click(); };
  const createDAFromPiece = (pieceId: string) => { const p = Store.findById<Piece>('pieces', pieceId); if (!p) return; const machine = p.machine_id ? Store.findById<Machine>('machines', p.machine_id) : null; const qtyPropose = Math.max(1, (p.seuil_reappro * 2) - p.stock_actuel); const da: DemandeAchat = { id: Store.generateId('da'), ref: 'DA-' + new Date().getFullYear() + '-' + ('000' + (Store.getAll<DemandeAchat>('demandes_achat').length + 1)).slice(-3), date: new Date().toISOString(), pole_id: machine?.pole_id || '', type_achat: 'Piece', urgence: p.stock_actuel === 0 ? 'Critique' : 'Haute', designation: p.designation, quantite: qtyPropose, montant_estime: qtyPropose * p.prix_unitaire, fournisseur_propose: p.fournisseur || '', date_souhaitee: '', machine_id: p.machine_id || '', intervention_id: '', piece_id: p.id, st_id: '', demandeur: auth.user?.nom || '', justification: 'Alerte stock - ' + (p.stock_actuel === 0 ? 'Rupture' : 'Stock bas'), statut: 'Brouillon' as any }; Store.upsert('demandes_achat', da); toast('DA creee: ' + da.ref, 'success'); refresh(); };
  const savePiece = () => { const ref = gv('pce_ref'), desig = gv('pce_desig'); if (!ref || !desig) { toast('Reference et designation requises', 'error'); return; } const existing = pieceModal && pieceModal !== 'new' ? Store.findById<Piece>('pieces', pieceModal) : null; Store.upsert('pieces', { id: existing?.id || Store.generateId('pce'), ref, designation: desig, prix_unitaire: parseInt(gv('pce_prix')) || 0, stock_actuel: parseInt(gv('pce_stock')) || 0, seuil_reappro: parseInt(gv('pce_seuil')) || 0, emplacement: gv('pce_empl'), machine_id: gv('pce_mach') || null, organe_id: gv('pce_org') || null, fournisseur: gv('pce_fourn'), delai_livraison: parseInt(gv('pce_delai')) || 0 } as Piece); setPieceModal(null); toast(existing ? 'Piece modifiee' : 'Piece creee', 'success'); refresh(); };

  if (view === 'list') {
    let pieces = Store.getAll<Piece>('pieces');
    const mvts = Store.getAll<StockMovement>('stock_movements');
    if (search) { const s = search.toLowerCase(); pieces = pieces.filter((p) => p.ref.toLowerCase().includes(s) || p.designation.toLowerCase().includes(s) || (p.fournisseur || '').toLowerCase().includes(s)); }
    if (filterAlert === 'rupture') pieces = pieces.filter((p) => p.stock_actuel === 0);
    else if (filterAlert === 'bas') pieces = pieces.filter((p) => p.stock_actuel > 0 && p.stock_actuel <= p.seuil_reappro);
    else if (filterAlert === 'ok') pieces = pieces.filter((p) => p.stock_actuel > p.seuil_reappro);
    const all = Store.getAll<Piece>('pieces');
    let totalVal = 0, rupture = 0, bas = 0;
    all.forEach((p) => { totalVal += p.stock_actuel * p.prix_unitaire; if (p.stock_actuel === 0) rupture++; else if (p.stock_actuel <= p.seuil_reappro) bas++; });
    const paged = paginate(pieces, page, 10);
    const recentMvts = mvts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return (<>
      <div className="int-toolbar">
        <div className="int-toolbar-left">
          <input className="int-search" placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="int-filter-select" value={filterAlert} onChange={(e) => { setFilterAlert(e.target.value); setPage(1); }}><option value="all">Tous</option><option value="rupture">Rupture</option><option value="bas">Stock bas</option><option value="ok">OK</option></select>
        </div>
        <div className="int-toolbar-right">
          {hasPermission('stock_edit') && <><button className="btn btn-primary" onClick={() => setView('movement')}>📦 Mouvement</button><button className="btn btn-outline" onClick={() => setPieceModal('new')}>➕ Piece</button></>}
          {hasPermission('stock_import') && <button className="btn btn-outline" onClick={importCSV}>📨 Import CSV</button>}
          {hasPermission('stock_export') && <button className="btn btn-outline" onClick={exportCSV}>📥 Export CSV</button>}
        </div>
      </div>
      <div className="stock-summary">
        {[{ v: all.length, l: 'References', c: 'var(--accent-blue)' }, { v: formatMoney(totalVal), l: 'Valeur stock', c: 'var(--accent-green)' }, { v: rupture, l: 'En rupture', c: 'var(--accent-red)' }, { v: bas, l: 'Stock bas', c: 'var(--accent-orange)' }].map((s, i) => (
          <div key={i} className="stock-summary-card"><div className="stock-summary-val" style={{ color: s.c }}>{s.v}</div><div className="stock-summary-lbl">{s.l}</div></div>
        ))}
      </div>
      <div className="data-table-wrap">
        <div className="data-table-header"><div className="data-table-title">Pieces ({pieces.length})</div></div>
        <table className="data-table"><thead><tr><th>Ref</th><th>Designation</th><th>Stock</th><th>Seuil</th><th>Niveau</th><th>Prix</th><th>Machine</th><th>Fournisseur</th><th>Actions</th></tr></thead><tbody>
          {paged.map((p) => {
            const lvl = p.stock_actuel === 0 ? 'crit' : p.stock_actuel <= p.seuil_reappro ? 'warn' : 'ok';
            const pct = p.seuil_reappro > 0 ? Math.min(100, Math.round((p.stock_actuel / (p.seuil_reappro * 3)) * 100)) : 100;
            return (<tr key={p.id}>
              <td><strong style={{ cursor: 'pointer', color: 'var(--accent-blue)' }} onClick={() => { setCurrentId(p.id); setView('detail'); }}>{p.ref}</strong></td>
              <td>{p.designation}</td><td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.stock_actuel}</td><td style={{ color: 'var(--text-muted)' }}>{p.seuil_reappro}</td>
              <td>{p.stock_actuel === 0 ? <span className="badge badge-red">RUPTURE</span> : p.stock_actuel <= p.seuil_reappro ? <span className="badge badge-orange">BAS</span> : <span className="badge badge-green">OK</span>}<div className="stock-bar"><div className={'stock-bar-fill ' + lvl} style={{ width: pct + '%' }} /></div></td>
              <td>{formatMoney(p.prix_unitaire)}</td><td>{getMachineName(p.machine_id)}</td><td>{p.fournisseur || '-'}</td>
              <td><div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-icon" title="Detail" onClick={() => { setCurrentId(p.id); setView('detail'); }}>👁</button>
                {hasPermission('stock_edit') && <button className="btn-icon" title="Modifier" onClick={() => setPieceModal(p.id)}>✏</button>}
                {p.stock_actuel <= p.seuil_reappro && hasPermission('da_create') && <button className="btn-icon" title="Creer DA" onClick={() => createDAFromPiece(p.id)} style={{ color: 'var(--accent-orange)' }}>📄</button>}
              </div></td>
            </tr>);
          })}
        </tbody></table>
        {pieces.length > 10 && <Pagination totalItems={pieces.length} currentPage={page} perPage={10} onPageChange={setPage} />}
      </div>
      <div className="data-table-wrap">
        <div className="data-table-header"><div className="data-table-title">Derniers mouvements</div></div>
        <div className="mvt-timeline" style={{ padding: 16 }}>
          {recentMvts.length === 0 ? <div className="alert-empty">Aucun</div> : recentMvts.map((mv) => {
            const pc = Store.findById<Piece>('pieces', mv.piece_id);
            return (<div key={mv.id} className="mvt-item">
              <div className={'mvt-icon ' + (mv.type === 'Entree' ? 'entree' : 'sortie')}>{mv.type === 'Entree' ? '↑' : '↓'}</div>
              <div style={{ flex: 1 }}><strong>{mv.type}</strong> — {pc?.designation || mv.piece_id}<div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{formatDateTime(mv.date)} | Qte: {mv.quantite}</div></div>
            </div>);
          })}
        </div>
      </div>
      {pieceModal && (() => { const editPc = pieceModal !== 'new' ? Store.findById<Piece>('pieces', pieceModal) : null; const machines = Store.getAll<Machine>('machines'); const organes = Store.getAll<Organe>('organes'); return <Modal isOpen={true} title={editPc ? 'Modifier piece' : 'Nouvelle piece'} onClose={() => setPieceModal(null)}>
        <div className="form-row"><div className="form-group"><label className="form-label">Reference *</label><input className="form-input" id="pce_ref" defaultValue={editPc?.ref || ''} /></div><div className="form-group"><label className="form-label">Designation *</label><input className="form-input" id="pce_desig" defaultValue={editPc?.designation || ''} /></div></div>
        <div className="form-row-3"><div className="form-group"><label className="form-label">Prix unitaire</label><input className="form-input" type="number" id="pce_prix" defaultValue={editPc?.prix_unitaire || ''} /></div><div className="form-group"><label className="form-label">Stock actuel</label><input className="form-input" type="number" id="pce_stock" defaultValue={editPc?.stock_actuel ?? 0} /></div><div className="form-group"><label className="form-label">Seuil reappro</label><input className="form-input" type="number" id="pce_seuil" defaultValue={editPc?.seuil_reappro ?? 0} /></div></div>
        <div className="form-row"><div className="form-group"><label className="form-label">Machine</label><select className="form-select" id="pce_mach" defaultValue={editPc?.machine_id || ''}><option value="">--</option>{machines.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></div><div className="form-group"><label className="form-label">Organe</label><select className="form-select" id="pce_org" defaultValue={editPc?.organe_id || ''}><option value="">--</option>{organes.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div></div>
        <div className="form-row"><div className="form-group"><label className="form-label">Emplacement</label><input className="form-input" id="pce_empl" defaultValue={editPc?.emplacement || ''} /></div><div className="form-group"><label className="form-label">Fournisseur</label><input className="form-input" id="pce_fourn" defaultValue={editPc?.fournisseur || ''} /></div></div>
        <div className="form-group"><label className="form-label">Delai livraison (jours)</label><input className="form-input" type="number" id="pce_delai" defaultValue={editPc?.delai_livraison || ''} /></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}><button className="btn btn-primary" onClick={savePiece}>Confirmer</button><button className="btn btn-outline" onClick={() => setPieceModal(null)}>Annuler</button></div>
      </Modal>; })()}
    </>);
  }

  if (view === 'detail' && currentId) {
    const p = Store.findById<Piece>('pieces', currentId);
    if (!p) { setView('list'); return null; }
    const mvts = Store.getAll<StockMovement>('stock_movements').filter((m) => m.piece_id === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const DR = ({ l, v }: { l: string; v: React.ReactNode }) => <div className="int-detail-row"><span className="int-detail-label">{l}</span><span className="int-detail-value">{v}</span></div>;
    return (<>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}><button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Retour</button><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700 }}>{p.ref}</span>
        {p.stock_actuel === 0 ? <span className="badge badge-red">RUPTURE</span> : p.stock_actuel <= p.seuil_reappro ? <span className="badge badge-orange">BAS</span> : <span className="badge badge-green">OK</span>}</div>
      <div className="int-detail-grid">
        <div className="int-detail-card"><div className="int-detail-card-title">📦 Fiche</div><DR l="Reference" v={p.ref} /><DR l="Designation" v={p.designation} /><DR l="Prix" v={formatMoney(p.prix_unitaire)} /><DR l="Emplacement" v={p.emplacement || '-'} /><DR l="Fournisseur" v={p.fournisseur || '-'} /><DR l="Delai" v={(p.delai_livraison || 0) + ' j'} /></div>
        <div className="int-detail-card"><div className="int-detail-card-title">📊 Niveaux</div><DR l="Stock actuel" v={<span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700 }}>{p.stock_actuel}</span>} /><DR l="Seuil" v={p.seuil_reappro} /><DR l="Valeur" v={formatMoney(p.stock_actuel * p.prix_unitaire)} /><DR l="Machine" v={getMachineName(p.machine_id)} /></div>
      </div>
      <div className="data-table-wrap"><div className="data-table-header"><div className="data-table-title">Mouvements ({mvts.length})</div></div>
        <table className="data-table"><thead><tr><th>Date</th><th>Type</th><th>Qte</th><th>Intervention</th><th>Commentaire</th></tr></thead><tbody>
          {mvts.map((mv) => { const intv = mv.intervention_id ? Store.findById<Intervention>('interventions', mv.intervention_id) : null; return (<tr key={mv.id}><td>{formatDateTime(mv.date)}</td><td>{mv.type === 'Entree' ? <span className="badge badge-green">Entree</span> : <span className="badge badge-red">Sortie</span>}</td><td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{mv.quantite}</td><td>{intv?.ref || '-'}</td><td>{mv.commentaire || '-'}</td></tr>); })}
        </tbody></table></div>
    </>);
  }

  // MOVEMENT FORM
  const pieces = Store.getAll<Piece>('pieces');
  const interventions = Store.getAll<Intervention>('interventions');
  const saveMvt = () => {
    const type = gv('mvt_type'), pieceId = gv('mvt_piece'), qty = parseInt(gv('mvt_qty')) || 0;
    if (!type || !pieceId || qty <= 0) { toast('Remplir type, piece et quantite', 'error'); return; }
    const piece = Store.findById<Piece>('pieces', pieceId);
    if (!piece) return;
    if (type === 'Sortie' && piece.stock_actuel < qty) { toast('Stock insuffisant: ' + piece.stock_actuel, 'error'); return; }
    piece.stock_actuel += type === 'Entree' ? qty : -qty;
    Store.upsert('pieces', piece);
    const mvts = Store.getAll<StockMovement>('stock_movements');
    mvts.push({ id: Store.generateId('mvt'), piece_id: pieceId, type: type as any, quantite: qty, date: new Date().toISOString(), intervention_id: gv('mvt_int') || null, commentaire: gv('mvt_comment'), operateur: 'Systeme' });
    Store.set('stock_movements', mvts);
    toast('Mouvement enregistre', 'success'); setView('list');
  };

  return (<>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}><button className="btn btn-outline btn-sm" onClick={() => setView('list')}>← Retour</button><span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Mouvement de stock</span></div>
    <div className="int-detail-card" style={{ maxWidth: 700 }}>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Type *</label><select className="form-select" id="mvt_type"><option value="">--</option><option value="Entree">Entree</option><option value="Sortie">Sortie</option></select></div>
        <div className="form-group"><label className="form-label">Piece *</label><select className="form-select" id="mvt_piece"><option value="">--</option>{pieces.map((p) => <option key={p.id} value={p.id}>{p.designation} (stock: {p.stock_actuel})</option>)}</select></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Quantite *</label><input className="form-input" type="number" id="mvt_qty" defaultValue={1} min={1} /></div>
        <div className="form-group"><label className="form-label">Intervention</label><select className="form-select" id="mvt_int"><option value="">--</option>{interventions.map((i) => <option key={i.id} value={i.id}>{i.ref}</option>)}</select></div>
      </div>
      <div className="form-group"><label className="form-label">Commentaire</label><textarea className="form-textarea" id="mvt_comment" /></div>
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={saveMvt}>💾 Enregistrer</button><button className="btn btn-outline" onClick={() => setView('list')}>Annuler</button></div>
    </div>
  </>);
}
