'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Store from '@/lib/store';
import { getMachineName, getTechName, getPoleName, formatMoney, formatDate } from '@/lib/utils';
import type { Intervention, Machine, Piece, Action, Signalement, BotMessage } from '@/lib/types';

const SUGGESTIONS = [
  'Resume des interventions en cours',
  'Alertes stock critiques',
  'Machines en panne',
  'Actions en retard',
  'Signalements non traites',
  'Analyse pannes repetitives',
  'KPI du mois',
];

function buildContext(): string {
  const ints = Store.getAll<Intervention>('interventions');
  const machines = Store.getAll<Machine>('machines');
  const pieces = Store.getAll<Piece>('pieces');
  const actions = Store.getAll<Action>('actions');
  const sigs = Store.getAll<Signalement>('signalements');

  const enCours = ints.filter((i) => i.statut === 'En cours' || i.statut === 'En attente piece');
  const termine = ints.filter((i) => i.statut === 'Termine');
  const nbCur = ints.filter((i) => i.type === 'Curatif').length;
  const nbPrev = ints.filter((i) => i.type === 'Preventif').length;
  const pannes = machines.filter((m) => m.etat === 'En panne');
  const stockCrit = pieces.filter((p) => p.stock_actuel <= p.seuil_reappro);
  const actRetard = actions.filter((a) => a.statut === 'En retard');
  const sigNouv = sigs.filter((s) => s.statut === 'Nouveau');
  const pannesRep = ints.filter((i) => i.panne_repetitive);

  const lines = [
    'CONTEXTE MAINTENANCE MULTIPRINT:',
    'Interventions: ' + ints.length + ' total, ' + enCours.length + ' en cours, ' + termine.length + ' terminees, ' + nbCur + ' curatives, ' + nbPrev + ' preventives',
    'Machines: ' + machines.length + ' total, ' + pannes.length + ' en panne: ' + pannes.map((m) => m.nom).join(', '),
    'Machines panne: ' + pannes.map((m) => m.nom + ' (' + m.code + ', ' + getPoleName(m.pole_id) + ')').join('; '),
    'Stock: ' + pieces.length + ' refs, ' + stockCrit.length + ' alertes: ' + stockCrit.map((p) => p.designation + ' (stock:' + p.stock_actuel + '/seuil:' + p.seuil_reappro + ')').join('; '),
    'Actions retard: ' + actRetard.length + ': ' + actRetard.map((a) => a.description.substring(0, 50) + ' (echeance:' + formatDate(a.echeance) + ')').join('; '),
    'Signalements nouveaux: ' + sigNouv.length + ': ' + sigNouv.map((s) => s.ref + ' ' + getMachineName(s.machine_id) + ' - ' + s.dysfonctionnement.substring(0, 40)).join('; '),
    'Pannes repetitives: ' + pannesRep.length + ': ' + pannesRep.map((i) => i.ref + ' ' + getMachineName(i.machine_id)).join('; '),
    'En cours detail: ' + enCours.map((i) => i.ref + ' ' + getMachineName(i.machine_id) + ' [' + i.statut + '] tech:' + getTechName(i.technicien_principal_id)).join('; '),
  ];
  return lines.join('\n');
}

export default function MaintBotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const msgsEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = Store.get<BotMessage[]>('bot_conversations') || [];
    if (saved.length > 0) setMessages(saved);
    else setMessages([{ role: 'bot', content: 'Bonjour' + (user ? ' ' + user.nom.split(' ')[0] : '') + ' ! Je suis MaintBot, votre assistant maintenance MULTIPRINT. Comment puis-je vous aider ?', timestamp: new Date().toISOString() }]);
  }, [user]);

  useEffect(() => { msgsEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: BotMessage = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const ctx = buildContext();
      const history = updated.slice(-10).map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }));

      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context: ctx,
          history,
          user: user ? { nom: user.nom, role: user.role, pole_id: user.pole_id } : null,
        }),
      });

      const data = await response.json();
      const botText = data.output || data.response || data.message || data.text || data.content || (typeof data === 'string' ? data : 'Desole, je n\'ai pas pu traiter votre demande.');
      const botMsg: BotMessage = { role: 'bot', content: botText, timestamp: new Date().toISOString() };
      const final = [...updated, botMsg];
      setMessages(final);
      Store.set('bot_conversations', final.slice(-50));
    } catch (err) {
      console.error('MaintBot error:', err);
      const errMsg: BotMessage = { role: 'bot', content: '⚠ Erreur de connexion au service IA. Verifiez la configuration du webhook n8n.', timestamp: new Date().toISOString() };
      const final = [...updated, errMsg];
      setMessages(final);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    const init: BotMessage[] = [{ role: 'bot', content: 'Conversation reinitilisee. Comment puis-je vous aider ?', timestamp: new Date().toISOString() }];
    setMessages(init);
    Store.set('bot_conversations', init);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  };

  return (
    <div className="bot-container">
      <div className="bot-header">
        <div className="bot-header-left">
          <div className="bot-avatar">🤖</div>
          <div><div className="bot-name">MaintBot</div><div className="bot-status"><span className="bot-status-dot" /> En ligne</div></div>
        </div>
        <div className="bot-header-actions">
          <button className="btn-icon" onClick={clearChat} title="Nouvelle conversation">🗑</button>
          <button className="btn-icon" onClick={() => window.print()} title="Imprimer">🖨</button>
        </div>
      </div>

      <div className="bot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={'bot-msg ' + msg.role}>
            {msg.role === 'bot' && <div className="bot-msg-header">🤖 MaintBot</div>}
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            <div className="bot-msg-time">{formatTime(msg.timestamp)}</div>
          </div>
        ))}
        {loading && <div className="bot-msg bot"><div className="bot-msg-header">🤖 MaintBot</div><div className="bot-typing"><div className="bot-typing-dot" /><div className="bot-typing-dot" /><div className="bot-typing-dot" /></div></div>}
        <div ref={msgsEnd} />
      </div>

      <div className="bot-suggestions">
        {SUGGESTIONS.map((s, i) => <div key={i} className="bot-suggestion" onClick={() => sendMessage(s)}>{s}</div>)}
      </div>

      <div className="bot-input-bar">
        <input className="bot-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(input); }} placeholder="Posez votre question..." disabled={loading} />
        <button className="bot-send" onClick={() => sendMessage(input)} disabled={loading}>➤</button>
      </div>
    </div>
  );
}
