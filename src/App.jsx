import { useState, useEffect, useMemo } from "react";
import logoImg from "./logo.png";

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB2t0DPn-t_-bYuEJKd3X0h8j6v6bSTuAg",
  authDomain: "fitmgwear-app.firebaseapp.com",
  projectId: "fitmgwear-app",
  storageBucket: "fitmgwear-app.firebasestorage.app",
  messagingSenderId: "324978242715",
  appId: "1:324978242715:web:c0eae2c0ebd6ad8626c23e",
  measurementId: "G-NF8VNZ0GXD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}

function formatData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR");
}

// ─────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0c0c0c;
    --surface: #161616;
    --surface2: #1e1e1e;
    --surface3: #282828;
    --border: rgba(255,255,255,0.06);
    --border2: rgba(255,255,255,0.1);
    --text: #f2f2f2;
    --text2: #888;
    --accent: #e8b84b;
    --accent2: #f5d07a;
    --green: #3ecf8e;
    --red: #f06060;
    --yellow: #f5a623;
    --blue: #4da6ff;
    --sidebar-w: 260px;
    --radius: 10px;
    --radius-sm: 7px;
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; line-height: 1.5; min-height: 100vh; }
  h1,h2,h3,h4 { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 99px; }

  .app { display: flex; height: 100vh; overflow: hidden; }

  .sidebar {
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; flex-shrink: 0;
    transition: transform 0.3s cubic-bezier(.4,0,.2,1);
    z-index: 100;
  }
  .sidebar-logo { padding: 22px 20px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
  .logo-img { width: 38px; height: 38px; border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
  .logo-img img { width: 100%; height: 100%; object-fit: contain; }
  .logo-name { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 2px; color: var(--accent); line-height: 1; }
  .logo-sub { font-size: 10px; color: var(--text2); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }

  .sidebar-nav { flex: 1; overflow-y: auto; padding: 14px 10px; }
  .nav-label { font-size: 10px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 1.2px; padding: 10px 10px 4px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); cursor: pointer; color: var(--text2); font-size: 13.5px; font-weight: 500; transition: all 0.15s; user-select: none; border-left: 2px solid transparent; margin-bottom: 2px; }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: rgba(232,184,75,0.08); color: var(--accent2); border-left-color: var(--accent); }
  .nav-item svg { width: 16px; height: 16px; flex-shrink: 0; }

  .sidebar-footer { padding: 12px 10px 16px; border-top: 1px solid var(--border); }
  .footer-btn { display: flex; align-items: center; gap: 9px; padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer; color: var(--text2); font-size: 12.5px; font-weight: 500; background: none; border: none; width: 100%; text-align: left; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .footer-btn:hover { background: var(--surface2); color: var(--text); }
  .footer-btn.danger:hover { color: var(--red); background: rgba(240,96,96,0.07); }
  .footer-btn svg { width: 14px; height: 14px; }
  .sync-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); margin-left: auto; box-shadow: 0 0 6px var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; min-width: 0; }
  .page { padding: 36px 48px; flex: 1; max-width: 1600px; width: 100%; margin: 0 auto; }
  .page-header { margin-bottom: 28px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .page-title { font-size: 28px; color: var(--text); line-height: 1; }
  .page-sub { font-size: 13px; color: var(--text2); margin-top: 4px; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .card-header { padding: 18px 20px 0; display: flex; align-items: center; justify-content: space-between; }
  .card-title { font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 1px; color: var(--text2); }
  .card-body { padding: 18px 20px; }

  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 28px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 26px; position: relative; overflow: hidden; transition: transform 0.15s, box-shadow 0.15s; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.3); }
  .stat-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; }
  .stat-card.green::after { background: linear-gradient(90deg, var(--green), transparent); }
  .stat-card.red::after   { background: linear-gradient(90deg, var(--red), transparent); }
  .stat-card.blue::after  { background: linear-gradient(90deg, var(--blue), transparent); }
  .stat-card.gold::after  { background: linear-gradient(90deg, var(--accent), transparent); }
  .stat-card.green { border-color: rgba(62,207,142,0.2); }
  .stat-card.red   { border-color: rgba(240,96,96,0.2); }
  .stat-card.blue  { border-color: rgba(77,166,255,0.2); }
  .stat-card.gold  { border-color: rgba(232,184,75,0.2); }
  .stat-label { font-size: 12px; color: var(--text2); text-transform: uppercase; letter-spacing: 0.9px; margin-bottom: 14px; font-weight: 700; }
  .stat-value { font-family: 'Bebas Neue', sans-serif; font-size: 38px; letter-spacing: 1px; line-height: 1; }
  .stat-card.green .stat-value { color: var(--green); }
  .stat-card.red .stat-value   { color: var(--red); }
  .stat-card.blue .stat-value  { color: var(--blue); }
  .stat-card.gold .stat-value  { color: var(--accent); }
  .stat-sub { font-size: 12px; color: var(--text2); margin-top: 8px; }

  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 18px; border-radius: var(--radius-sm); font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; text-decoration: none; white-space: nowrap; }
  .btn svg { width: 15px; height: 15px; }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover { background: var(--accent2); transform: translateY(-1px); }
  .btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border2); }
  .btn-secondary:hover { background: var(--surface3); }
  .btn-success { background: rgba(62,207,142,0.12); color: var(--green); border: 1px solid rgba(62,207,142,0.25); }
  .btn-success:hover { background: rgba(62,207,142,0.22); }
  .btn-danger { background: rgba(240,96,96,0.1); color: var(--red); border: 1px solid rgba(240,96,96,0.2); }
  .btn-danger:hover { background: rgba(240,96,96,0.2); }
  .btn-info { background: rgba(77,166,255,0.1); color: var(--blue); border: 1px solid rgba(77,166,255,0.2); }
  .btn-info:hover { background: rgba(77,166,255,0.2); }
  .btn-sm { padding: 6px 13px; font-size: 12px; }
  .btn-icon { padding: 7px; background: var(--surface2); border: 1px solid var(--border); color: var(--text2); border-radius: var(--radius-sm); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .btn-icon:hover { color: var(--text); background: var(--surface3); }
  .btn-icon.danger:hover { color: var(--red); background: rgba(240,96,96,0.1); border-color: rgba(240,96,96,0.3); }
  .btn-icon svg { width: 14px; height: 14px; }

  .input-group { display: flex; flex-direction: column; gap: 6px; }
  .input-label { font-size: 11.5px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 0.6px; }
  .input { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--radius-sm); padding: 10px 13px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 13.5px; width: 100%; transition: border-color 0.15s; outline: none; }
  .input:focus { border-color: var(--accent); }
  .input::placeholder { color: var(--text2); }
  select.input { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; }
  textarea.input { resize: vertical; min-height: 80px; }

  .form-grid { display: grid; gap: 16px; }
  .form-grid-2 { grid-template-columns: 1fr 1fr; }
  .form-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
  .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px; }

  .margem-preview { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--radius-sm); padding: 12px 16px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .margem-item { display: flex; flex-direction: column; gap: 2px; }
  .margem-item-label { font-size: 10px; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; }
  .margem-item-value { font-family: 'Bebas Neue', sans-serif; font-size: 18px; }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 11px 16px; font-size: 10.5px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 0.7px; border-bottom: 1px solid var(--border); background: var(--surface); position: sticky; top: 0; z-index: 1; }
  td { padding: 13px 16px; border-bottom: 1px solid var(--border); font-size: 13px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,0.015); }

  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 600; }
  .badge-green  { background: rgba(62,207,142,0.12); color: var(--green); }
  .badge-red    { background: rgba(240,96,96,0.12); color: var(--red); }
  .badge-yellow { background: rgba(245,166,35,0.12); color: var(--yellow); }
  .badge-blue   { background: rgba(77,166,255,0.12); color: var(--blue); }
  .badge-gold   { background: rgba(232,184,75,0.12); color: var(--accent); }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; animation: fadeIn 0.15s; }
  .modal { background: var(--surface); border: 1px solid var(--border2); border-radius: var(--radius); width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.2s cubic-bezier(.34,1.56,.64,1); }
  .modal-wide { max-width: 760px; }
  .modal-header { padding: 22px 24px 0; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 1px; }
  .modal-body { padding: 0 24px 24px; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:none} }

  .login-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); position:relative; overflow:hidden; }
  .login-bg { position:absolute; inset:0; pointer-events:none; }
  .login-blob { position:absolute; border-radius:50%; filter:blur(90px); opacity:0.18; }
  .login-error { background:rgba(240,96,96,0.1); border:1px solid rgba(240,96,96,0.3); border-radius:var(--radius-sm); padding:10px 14px; font-size:13px; color:var(--red); margin-bottom:16px; }
  .login-card { background:var(--surface); border:1px solid var(--border2); border-radius:16px; padding:44px 40px; width:100%; max-width:420px; position:relative; z-index:1; animation:slideUp 0.4s cubic-bezier(.34,1.56,.64,1); }
  .login-logo { display:flex; align-items:center; gap:14px; margin-bottom:28px; }
  .login-logo-img { width:56px; height:56px; border-radius:12px; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .login-logo-img img { width:100%; height:100%; object-fit:contain; }
  .login-logo-text h1 { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:3px; color:var(--accent); line-height:1; }
  .login-logo-text p { font-size:12px; color:var(--text2); margin-top:2px; }

  .toast-container { position:fixed; bottom:24px; right:24px; z-index:999; display:flex; flex-direction:column; gap:8px; }
  .toast { background:var(--surface); border:1px solid var(--border2); border-radius:var(--radius-sm); padding:12px 16px; font-size:13px; min-width:260px; display:flex; align-items:center; gap:10px; animation:slideUp 0.25s cubic-bezier(.34,1.56,.64,1); box-shadow:0 8px 32px rgba(0,0,0,0.5); }
  .toast-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .toast.success .toast-dot { background:var(--green); }
  .toast.error .toast-dot { background:var(--red); }
  .toast.info .toast-dot { background:var(--blue); }

  .usuarios-grid { display: grid; gap: 12px; }
  .usuario-card { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .usuario-card-top { display: flex; align-items: center; gap: 12px; }
  .usuario-avatar { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
  .usuario-info { flex: 1; min-width: 0; }
  .usuario-nome { font-size: 14px; font-weight: 700; color: var(--text); word-break: break-word; }
  .usuario-email { font-size: 12px; color: var(--text2); word-break: break-all; margin-top: 2px; }
  .usuario-card-bottom { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 10px; gap: 8px; }
  .usuario-role { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 99px; }
  .role-dono { background: rgba(232,184,75,0.15); color: var(--accent); }
  .role-func { background: rgba(77,166,255,0.12); color: var(--blue); }

  .sidebar-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:99; }
  .empty-state { padding:52px; text-align:center; color:var(--text2); }
  .empty-icon { font-size:42px; margin-bottom:12px; opacity:0.45; }
  .empty-text { font-size:14px; }
  .mobile-navbar { display: none; position: fixed; top: 0; left: 0; right: 0; height: 60px; background: var(--surface); border-bottom: 1px solid var(--border); z-index: 101; align-items: center; padding: 0 16px; gap: 12px; }
  .mobile-menu-btn { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--radius-sm); padding: 8px; cursor: pointer; color: var(--text); display: flex; align-items: center; justify-content: center; }
  .mobile-logo { display: flex; align-items: center; gap: 10px; flex: 1; }
  .mobile-logo-img { width: 32px; height: 32px; border-radius: 6px; background: #fff; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .mobile-logo-img img { width: 100%; height: 100%; object-fit: contain; }
  .mobile-logo-name { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 1.5px; color: var(--accent); line-height: 1; }
  .mobile-menu-btn svg { width:18px; height:18px; display:block; }
  .confirm-dialog { background:var(--surface); border:1px solid var(--border2); border-radius:var(--radius); padding:26px; max-width:420px; width:100%; }
  .confirm-title { font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:1px; margin-bottom:10px; }
  .confirm-text { font-size:13px; color:var(--text2); margin-bottom:22px; }
  .confirm-actions { display:flex; gap:10px; justify-content:flex-end; }
  .product-thumb { width:36px; height:36px; border-radius:8px; background:var(--surface3); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }

  .tags-selector { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .tag-opt { padding: 5px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--border2); background: var(--surface2); color: var(--text2); transition: all 0.15s; user-select: none; }
  .tag-opt:hover { border-color: var(--accent); color: var(--accent); }
  .tag-opt.selected { background: rgba(232,184,75,0.15); border-color: var(--accent); color: var(--accent); }
  .tag-custom-row { display: flex; gap: 8px; margin-top: 6px; }
  .tag-display { display: flex; flex-wrap: wrap; gap: 4px; }
  .tag-pill { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; background: rgba(232,184,75,0.12); color: var(--accent); border: 1px solid rgba(232,184,75,0.25); }

  .loading-screen { min-height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:16px; background:var(--bg); }
  .spinner { width:32px; height:32px; border:3px solid var(--border2); border-top-color:var(--accent); border-radius:50%; animation:spin 0.7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }

  .produto-pai-row td { background: var(--surface); }
  .produto-pai-row:hover td { background: rgba(232,184,75,0.03) !important; }
  .produto-expand-btn { background: none; border: 1px solid var(--border2); border-radius: 6px; padding: 4px 8px; cursor: pointer; color: var(--text2); font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s; white-space: nowrap; }
  .produto-expand-btn:hover { border-color: var(--accent); color: var(--accent); }
  .variante-row td { background: rgba(255,255,255,0.015); padding-top: 9px; padding-bottom: 9px; }
  .variante-row:hover td { background: rgba(255,255,255,0.03) !important; }
  .variante-indent { padding-left: 52px !important; }
  .variante-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text2); }
  .variante-label-badge { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; background: rgba(77,166,255,0.1); color: var(--blue); border: 1px solid rgba(77,166,255,0.2); }

  .variante-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  .variante-item { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--radius-sm); padding: 12px 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .variante-item-label { font-size: 13px; font-weight: 700; color: var(--text); flex: 1; min-width: 140px; }
  .variante-item-estoque { font-size: 12px; color: var(--text2); }
  .add-variante-row { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; margin-top: 10px; }

  .variante-grade-section { margin-top: 14px; }
  .variante-grade-label { font-size: 11px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
  .variante-grade-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .variante-chip {
    padding: 7px 16px; border-radius: 99px; font-size: 13px; font-weight: 700;
    border: 1.5px solid var(--border2); background: var(--surface2);
    color: var(--text2); cursor: pointer; transition: all 0.15s; user-select: none;
    position: relative;
  }
  .variante-chip:hover:not(.disabled) { border-color: var(--accent); color: var(--accent); }
  .variante-chip.active { border-color: var(--accent); background: rgba(232,184,75,0.12); color: var(--accent); }
  .variante-chip.active-cor { border-color: var(--blue); background: rgba(77,166,255,0.12); color: var(--blue); }
  .variante-chip.disabled { opacity: 0.35; cursor: not-allowed; text-decoration: line-through; }
  .variante-chip-estoque {
    position: absolute; top: -6px; right: -4px;
    font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 99px;
    background: var(--yellow); color: #000; line-height: 1.4;
  }
  .variante-chip-estoque.zero { background: var(--red); color: #fff; }
  .variante-resultado {
    margin-top: 12px; padding: 10px 14px; border-radius: var(--radius-sm);
    background: rgba(232,184,75,0.07); border: 1px solid rgba(232,184,75,0.25);
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  }
  .variante-resultado-nome { font-size: 13px; font-weight: 700; color: var(--accent); }
  .variante-resultado-estoque { font-size: 12px; color: var(--text2); }

  .info-box { background: rgba(77,166,255,0.07); border: 1px solid rgba(77,166,255,0.2); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 12px; color: var(--text2); }
  .warn-box { background: rgba(245,166,35,0.07); border: 1px solid rgba(245,166,35,0.25); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 12px; color: var(--yellow); }

  @media (max-width: 1200px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .page { padding: 28px 28px; }
  }
  @media (max-width: 768px) {
    .sidebar { position:fixed; left:0; top:0; bottom:0; transform:translateX(-100%); }
    .sidebar.open { transform:translateX(0); box-shadow:8px 0 40px rgba(0,0,0,0.5); }
    .sidebar-overlay { display:block; }
    .mobile-navbar { display: flex; }
    .page { padding:20px 16px; padding-top:80px; }
    .stats-grid { grid-template-columns:1fr 1fr; }
    .form-grid-2, .form-grid-3 { grid-template-columns:1fr; }
  }
  @media (max-width: 420px) {
    .stats-grid { grid-template-columns: 1fr; }
  }
`;

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>,
    sell: <><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="currentColor"/></>,
    expense: <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"/>,
    stock: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="currentColor"/>,
    clients: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>,
    categories: <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5S15.01 22 17.5 22s4.5-2.01 4.5-4.5S19.99 13 17.5 13zm0 7c-1.38 0-2.5-1.12-2.5-2.5S16.12 15 17.5 15s2.5 1.12 2.5 2.5S18.88 20 17.5 20zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" fill="currentColor"/>,
    pdf: <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" fill="currentColor"/>,
    download: <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>,
    trash: <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>,
    edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>,
    plus: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>,
    menu: <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>,
    close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>,
    lock: <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" fill="currentColor"/>,
    eye: <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>,
    eyeoff: <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>,
    warn: <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>,
    check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>,
    sync: <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="currentColor"/>,
    chevronDown: <path d="M7 10l5 5 5-5z" fill="currentColor"/>,
    chevronRight: <path d="M10 17l5-5-5-5v10z" fill="currentColor"/>,
    variant: <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" fill="currentColor"/>,
    refresh: <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {icons[name] || null}
    </svg>
  );
};

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
let toastCount = 0;
let setToastsGlobal = null;

function useToasts() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => { setToastsGlobal = setToasts; }, []);
  return toasts;
}

function toast(msg, type = "success") {
  if (!setToastsGlobal) return;
  const id = ++toastCount;
  setToastsGlobal(p => [...p, { id, msg, type }]);
  setTimeout(() => setToastsGlobal(p => p.filter(t => t.id !== id)), 3500);
}

function ToastContainer() {
  const toasts = useToasts();
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <div className="toast-dot" />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL / CONFIRM
// ─────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, title, text, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-dialog">
        <div className="confirm-title">{title}</div>
        <div className="confirm-text">{text}</div>
        <div className="confirm-actions">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
          <button className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function LoginScreen({ primeiroAcesso }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [nome, setNome] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function entrar(e) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !senha.trim()) return setErro("Preencha e-mail e senha.");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "E-mail não cadastrado.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/invalid-email": "E-mail inválido.",
        "auth/invalid-credential": "E-mail ou senha incorretos.",
        "auth/too-many-requests": "Muitas tentativas. Tente mais tarde.",
      };
      setErro(msgs[err.code] || "Erro ao entrar.");
    } finally { setLoading(false); }
  }

  async function criarDono(e) {
    e.preventDefault();
    setErro("");
    if (!nome.trim()) return setErro("Digite seu nome.");
    if (!email.trim()) return setErro("Digite seu e-mail.");
    if (senha.length < 6) return setErro("Senha deve ter no mínimo 6 caracteres.");
    if (senha !== confirmar) return setErro("As senhas não conferem.");
    setLoading(true);
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${auth.app.options.apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password: senha, returnSecureToken: true }) }
      );
      const data = await res.json();
      if (data.error) { const msgs = { "EMAIL_EXISTS": "E-mail já cadastrado.", "WEAK_PASSWORD": "Senha fraca." }; throw new Error(msgs[data.error.message] || data.error.message); }
      await setDoc(doc(db, "usuarios", data.localId), { uid: data.localId, nome: nome.trim(), email: email.trim(), cargo: "dono", criadoEm: new Date().toISOString() });
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (err) { setErro(err.message || "Erro ao criar conta."); setLoading(false); }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-blob" style={{ width: 500, height: 500, background: "#e8b84b", top: -150, right: -150 }} />
        <div className="login-blob" style={{ width: 400, height: 400, background: "#3ecf8e", bottom: -100, left: -100 }} />
      </div>
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-img"><img src={logoImg} alt="FitMGwear" /></div>
          <div className="login-logo-text"><h1>FITMGWEAR</h1><p>Sistema de Gestão</p></div>
        </div>
        {primeiroAcesso ? (
          <>
            <div style={{ background: "rgba(232,184,75,0.08)", border: "1px solid rgba(232,184,75,0.25)", borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 13, color: "var(--accent)", marginBottom: 20 }}>
              👋 Primeira vez? Crie a conta do dono.
            </div>
            {erro && <div className="login-error">⚠️ {erro}</div>}
            <form onSubmit={criarDono}>
              <div className="form-grid" style={{ gap: 14 }}>
                <div className="input-group"><label className="input-label">Nome</label><input className="input" placeholder="João Silva" value={nome} onChange={e => setNome(e.target.value)} /></div>
                <div className="input-group"><label className="input-label">E-mail</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="input-group"><label className="input-label">Senha</label>
                  <div style={{ position: "relative" }}>
                    <input className="input" type={show ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)} style={{ paddingRight: 40 }} />
                    <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><Icon name={show ? "eyeoff" : "eye"} size={16} /></button>
                  </div>
                </div>
                <div className="input-group"><label className="input-label">Confirmar Senha</label><input className="input" type={show ? "text" : "password"} value={confirmar} onChange={e => setConfirmar(e.target.value)} /></div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", padding: "11px" }}><Icon name="check" />{loading ? "Criando..." : "Criar Conta"}</button>
              </div>
            </form>
          </>
        ) : (
          <>
            {erro && <div className="login-error">⚠️ {erro}</div>}
            <form onSubmit={entrar}>
              <div className="form-grid" style={{ gap: 14 }}>
                <div className="input-group"><label className="input-label">E-mail</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="input-group"><label className="input-label">Senha</label>
                  <div style={{ position: "relative" }}>
                    <input className="input" type={show ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)} style={{ paddingRight: 40 }} />
                    <button type="button" onClick={() => setShow(!show)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><Icon name={show ? "eyeoff" : "eye"} size={16} /></button>
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", padding: "11px" }}><Icon name="lock" />{loading ? "Entrando..." : "Entrar"}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GERENCIAR USUÁRIOS — com correção EMAIL_EXISTS + troca de senha
// ─────────────────────────────────────────────
function GerenciarUsuarios({ usuarioAtual }) {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", cargo: "funcionario" });
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [confirmRemover, setConfirmRemover] = useState(null);
  // Modal troca de senha
  const [modalSenha, setModalSenha] = useState(null); // usuário alvo { id, uid, nome, email }
  const [formSenha, setFormSenha] = useState({ senhaAtual: "", senhaNova: "", confirmar: "" });
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [showSenhas, setShowSenhas] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "usuarios"), snap => {
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingUsers(false);
    });
    return unsub;
  }, []);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }
  function setSenha(k, v) { setFormSenha(p => ({ ...p, [k]: v })); }

  // ── CRIAR USUÁRIO ──
  async function criarUsuario(e) {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || form.senha.length < 6)
      return toast("Preencha todos os campos. Senha mínima: 6 caracteres.", "error");

    setLoading(true);
    try {
      const resCriar = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${auth.app.options.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim(), password: form.senha, returnSecureToken: true }),
        }
      );
      const dataCriar = await resCriar.json();

      if (dataCriar.error) {
        if (dataCriar.error.message === "EMAIL_EXISTS") {
          const resSignin = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${auth.app.options.apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: form.email.trim(), password: form.senha, returnSecureToken: true }),
            }
          );
          const dataSignin = await resSignin.json();

          if (dataSignin.error) {
            toast(
              `E-mail já registrado com outra senha. Use "Alterar Senha" no usuário existente, ou use um e-mail diferente.`,
              "error"
            );
            setLoading(false);
            return;
          }

          const localId = dataSignin.localId;
          const jaExiste = usuarios.find(u => u.uid === localId);
          if (jaExiste) {
            toast(`Este e-mail já está ativo no sistema como "${jaExiste.nome}".`, "error");
            setLoading(false);
            return;
          }

          await setDoc(doc(db, "usuarios", localId), {
            uid: localId, nome: form.nome.trim(), email: form.email.trim(),
            cargo: form.cargo, criadoEm: new Date().toISOString(), criadoPor: usuarioAtual?.uid,
          });
          toast(`Usuário ${form.nome} reativado com sucesso! ✓`);
          setForm({ nome: "", email: "", senha: "", cargo: "funcionario" });
          setModal(false);
          setLoading(false);
          return;
        }
        const msgs = { "WEAK_PASSWORD": "Senha fraca (mínimo 6 caracteres).", "INVALID_EMAIL": "E-mail inválido." };
        throw new Error(msgs[dataCriar.error.message] || dataCriar.error.message);
      }

      const localId = dataCriar.localId;
      await setDoc(doc(db, "usuarios", localId), {
        uid: localId, nome: form.nome.trim(), email: form.email.trim(),
        cargo: form.cargo, criadoEm: new Date().toISOString(), criadoPor: usuarioAtual?.uid,
      });
      toast(`Usuário ${form.nome} criado! ✓`);
      setForm({ nome: "", email: "", senha: "", cargo: "funcionario" });
      setModal(false);
    } catch (err) {
      toast(err.message || "Erro ao criar usuário.", "error");
    } finally {
      setLoading(false);
    }
  }

  // ── ALTERAR SENHA ──
  // Faz login temporário com a senha atual para obter o idToken,
  // depois atualiza a senha via API do Firebase.
  async function alterarSenha(e) {
    e.preventDefault();
    if (!formSenha.senhaAtual) return toast("Informe a senha atual.", "error");
    if (formSenha.senhaNova.length < 6) return toast("Nova senha deve ter mínimo 6 caracteres.", "error");
    if (formSenha.senhaNova !== formSenha.confirmar) return toast("As senhas não conferem.", "error");
    if (!modalSenha) return;

    setLoadingSenha(true);
    try {
      // 1) Faz login com a senha atual para obter o idToken
      const resLogin = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${auth.app.options.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: modalSenha.email, password: formSenha.senhaAtual, returnSecureToken: true }),
        }
      );
      const dataLogin = await resLogin.json();

      if (dataLogin.error) {
        const msgs = {
          "INVALID_PASSWORD": "Senha atual incorreta.",
          "INVALID_LOGIN_CREDENTIALS": "Senha atual incorreta.",
          "TOO_MANY_ATTEMPTS_TRY_LATER": "Muitas tentativas. Tente mais tarde.",
        };
        throw new Error(msgs[dataLogin.error.message] || "Senha atual incorreta.");
      }

      // 2) Atualiza a senha usando o idToken obtido
      const resUpdate = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${auth.app.options.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: dataLogin.idToken, password: formSenha.senhaNova, returnSecureToken: true }),
        }
      );
      const dataUpdate = await resUpdate.json();

      if (dataUpdate.error) throw new Error("Erro ao atualizar senha: " + dataUpdate.error.message);

      toast(`Senha de "${modalSenha.nome}" alterada com sucesso! ✓`);
      setModalSenha(null);
      setFormSenha({ senhaAtual: "", senhaNova: "", confirmar: "" });
    } catch (err) {
      toast(err.message || "Erro ao alterar senha.", "error");
    } finally {
      setLoadingSenha(false);
    }
  }

  // ── REMOVER USUÁRIO ──
  async function confirmarRemover() {
    if (!confirmRemover) return;
    await deleteDoc(doc(db, "usuarios", confirmRemover.id));
    toast(`Usuário "${confirmRemover.nome}" removido do sistema.`);
    setConfirmRemover(null);
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Usuários</h1><p className="page-sub">Gerencie quem tem acesso ao sistema</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Icon name="plus" />Novo Usuário</button>
      </div>

      <div className="info-box" style={{ marginBottom: 16 }}>
        💡 <strong>Dica:</strong> Ao remover um usuário e precisar recadastrá-lo com o mesmo e-mail,
        use <strong>exatamente a mesma senha</strong> e o sistema reativará o acesso automaticamente.
        Para trocar a senha, use o botão <strong>🔑 Alterar Senha</strong>.
      </div>

      <div className="card"><div className="card-body">
        {loadingUsers
          ? <div style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>Carregando...</div>
          : usuarios.length === 0
            ? <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-text">Nenhum usuário</div></div>
            : <div className="usuarios-grid">
              {usuarios.map(u => (
                <div key={u.id} className="usuario-card">
                  <div className="usuario-card-top">
                    <div className="usuario-avatar" style={{
                      background: u.cargo === "dono" ? "rgba(232,184,75,0.15)" : "rgba(77,166,255,0.12)",
                      color: u.cargo === "dono" ? "var(--accent)" : "var(--blue)"
                    }}>
                      {(u.nome || "?")[0].toUpperCase()}
                    </div>
                    <div className="usuario-info">
                      <div className="usuario-nome">{u.nome}</div>
                      <div className="usuario-email">{u.email}</div>
                    </div>
                  </div>
                  <div className="usuario-card-bottom">
                    <span className={`usuario-role ${u.cargo === "dono" ? "role-dono" : "role-func"}`}>
                      {u.cargo === "dono" ? "👑 Dono" : "👤 Funcionário"}
                    </span>
                    {u.uid === usuarioAtual?.uid
                      ? <span style={{ fontSize: 11, color: "var(--text2)", padding: "4px 8px", borderRadius: 99, background: "var(--surface3)" }}>Você</span>
                      : <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => { setModalSenha(u); setFormSenha({ senhaAtual: "", senhaNova: "", confirmar: "" }); setShowSenhas(false); }}
                          >
                            🔑 Alterar Senha
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setConfirmRemover({ id: u.id, uid: u.uid, nome: u.nome })}
                          >
                            <Icon name="trash" size={13} />Remover
                          </button>
                        </div>
                    }
                  </div>
                </div>
              ))}
            </div>
        }
      </div></div>

      {/* Modal criar usuário */}
      <Modal open={modal} onClose={() => { setModal(false); setForm({ nome: "", email: "", senha: "", cargo: "funcionario" }); }} title="Novo Usuário">
        <form onSubmit={criarUsuario}>
          <div className="form-grid" style={{ gap: 14 }}>
            <div className="input-group"><label className="input-label">Nome</label><input className="input" value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
            <div className="input-group"><label className="input-label">E-mail</label><input className="input" type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div className="input-group">
              <label className="input-label">Senha</label>
              <input className="input" type="password" value={form.senha} onChange={e => set("senha", e.target.value)} placeholder="Mínimo 6 caracteres" />
              <span style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                Se estiver reativando um usuário removido, use a mesma senha anterior.
              </span>
            </div>
            <div className="input-group"><label className="input-label">Cargo</label>
              <select className="input" value={form.cargo} onChange={e => set("cargo", e.target.value)}>
                <option value="funcionario">Funcionário</option>
                <option value="dono">Dono / Admin</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Processando..." : "Criar"}</button>
          </div>
        </form>
      </Modal>

      {/* Modal alterar senha */}
      <Modal open={!!modalSenha} onClose={() => { setModalSenha(null); setFormSenha({ senhaAtual: "", senhaNova: "", confirmar: "" }); }} title={`Alterar Senha — ${modalSenha?.nome || ""}`}>
        <div className="warn-box" style={{ marginBottom: 16 }}>
          🔑 Informe a senha <strong>atual</strong> do usuário e a nova senha desejada.
        </div>
        <form onSubmit={alterarSenha}>
          <div className="form-grid" style={{ gap: 14 }}>
            <div className="input-group">
              <label className="input-label">Senha Atual</label>
              <div style={{ position: "relative" }}>
                <input className="input" type={showSenhas ? "text" : "password"} value={formSenha.senhaAtual}
                  onChange={e => setSenha("senhaAtual", e.target.value)} placeholder="Senha atual do usuário"
                  style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowSenhas(s => !s)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}>
                  <Icon name={showSenhas ? "eyeoff" : "eye"} size={16} />
                </button>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Nova Senha</label>
              <input className="input" type={showSenhas ? "text" : "password"} value={formSenha.senhaNova}
                onChange={e => setSenha("senhaNova", e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="input-group">
              <label className="input-label">Confirmar Nova Senha</label>
              <input className="input" type={showSenhas ? "text" : "password"} value={formSenha.confirmar}
                onChange={e => setSenha("confirmar", e.target.value)} placeholder="Repita a nova senha"
                style={formSenha.confirmar && formSenha.confirmar !== formSenha.senhaNova ? { borderColor: "var(--red)" } : {}} />
              {formSenha.confirmar && formSenha.confirmar !== formSenha.senhaNova &&
                <span style={{ fontSize: 11, color: "var(--red)" }}>As senhas não conferem</span>}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalSenha(null)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loadingSenha}>
              {loadingSenha ? "Alterando..." : "Salvar Nova Senha"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm remover */}
      <ConfirmDialog
        open={!!confirmRemover}
        title="Remover Usuário?"
        text={`"${confirmRemover?.nome}" perderá o acesso ao sistema. Para reativar depois, use o mesmo e-mail e senha.`}
        danger
        onConfirm={confirmarRemover}
        onCancel={() => setConfirmRemover(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// RELATÓRIO PDF
// ─────────────────────────────────────────────
function RelatorioPDF({ dados }) {
  const transacoes = dados.transacoes || [];
  const produtos = dados.produtos || [];
  const variantesProduto = dados.variantesProduto || [];

  const totalReceitas = transacoes.filter(t => t.tipo === "venda").reduce((s, t) => s + t.valor, 0);
  const totalDespesas = transacoes.filter(t => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  const [mes, setMes] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const transacoesFiltradas = useMemo(() => transacoes.filter(t => t.data && t.data.startsWith(mes)).sort((a, b) => new Date(b.data) - new Date(a.data)), [transacoes, mes]);
  const receitasMes = transacoesFiltradas.filter(t => t.tipo === "venda").reduce((s, t) => s + t.valor, 0);
  const despesasMes = transacoesFiltradas.filter(t => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
  const saldoMes = receitasMes - despesasMes;

  const produtosAbaixo = [];
  produtos.forEach(p => {
    const vars = variantesProduto.filter(v => v.produtoPaiId === p.id);
    if (vars.length > 0) {
      vars.forEach(v => { if (v.estoque <= (p.quantidadeMinima || 5)) produtosAbaixo.push({ nome: `${p.nome} (${v.label})`, estoque: v.estoque }); });
    } else {
      if (p.quantidadeEstoque <= p.quantidadeMinima) produtosAbaixo.push({ nome: p.nome, estoque: p.quantidadeEstoque });
    }
  });

  function gerarPDF() {
    const [ano, mesNum] = mes.split("-");
    const nomeMes = new Date(parseInt(ano), parseInt(mesNum) - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });
    const linhas = transacoesFiltradas.map(t => `<tr><td>${formatData(t.data)}</td><td>${t.descricao || "—"}</td><td style="color:${t.tipo === "venda" ? "#22c55e" : "#ef4444"}">${t.tipo === "venda" ? "Venda" : "Despesa"}</td><td style="text-align:right;font-weight:600;color:${t.tipo === "venda" ? "#22c55e" : "#ef4444"}">${formatBRL(t.valor)}</td></tr>`).join("");
    const linhasProd = produtos.map(p => {
      const vars = variantesProduto.filter(v => v.produtoPaiId === p.id);
      const estoqueTotal = vars.length > 0 ? vars.reduce((s, v) => s + (v.estoque || 0), 0) : p.quantidadeEstoque;
      const margem = p.precoCompra > 0 ? ((p.precoVenda - p.precoCompra) / p.precoCompra * 100).toFixed(0) : "—";
      const varStr = vars.length > 0 ? vars.map(v => `${v.label}: ${v.estoque}`).join(", ") : "—";
      return `<tr><td>${p.nome}</td><td style="text-align:center">${estoqueTotal}</td><td style="font-size:10px;color:#666">${varStr}</td><td>${formatBRL(p.precoVenda)}</td><td style="text-align:center">${margem}%</td></tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório FitMGwear</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:32px}h1{font-size:26px;font-weight:900;letter-spacing:3px;color:#e8b84b}h2{font-size:14px;font-weight:700;text-transform:uppercase;margin:24px 0 10px;color:#333;border-bottom:2px solid #e8b84b;padding-bottom:4px}.header{display:flex;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid #ddd;padding-bottom:16px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}.stat{padding:14px;border-radius:8px;border:1px solid #ddd}.stat-label{font-size:10px;text-transform:uppercase;color:#666;margin-bottom:4px}.stat-value{font-size:20px;font-weight:900}.green{color:#22c55e}.red{color:#ef4444}.blue{color:#3b82f6}table{width:100%;border-collapse:collapse;margin-bottom:8px}th{text-align:left;padding:8px;font-size:10px;text-transform:uppercase;background:#f5f5f5;border-bottom:1px solid #ddd;color:#666}td{padding:8px;border-bottom:1px solid #eee;font-size:11px}.footer{margin-top:32px;font-size:10px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:12px}</style></head><body>
<div class="header"><div><h1>FITMGWEAR</h1><div style="color:#666;margin-top:2px">Relatório — ${nomeMes}</div></div><div style="text-align:right;font-size:11px;color:#666">Gerado: ${new Date().toLocaleDateString("pt-BR")}</div></div>
<h2>📊 Resumo do Mês</h2><div class="stats"><div class="stat"><div class="stat-label">Receitas</div><div class="stat-value green">${formatBRL(receitasMes)}</div></div><div class="stat"><div class="stat-label">Despesas</div><div class="stat-value red">${formatBRL(despesasMes)}</div></div><div class="stat"><div class="stat-label">Saldo</div><div class="stat-value ${saldoMes >= 0 ? "blue" : "red"}">${formatBRL(saldoMes)}</div></div></div>
${produtosAbaixo.length > 0 ? `<div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:6px;padding:10px;font-size:11px;color:#92400e;margin-bottom:16px">⚠️ Estoque crítico: ${produtosAbaixo.map(p => `${p.nome} (${p.estoque} un.)`).join(", ")}</div>` : ""}
<h2>💳 Transações (${transacoesFiltradas.length})</h2>${transacoesFiltradas.length === 0 ? "<p style='color:#aaa'>Nenhuma transação.</p>" : `<table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th style="text-align:right">Valor</th></tr></thead><tbody>${linhas}</tbody></table>`}
<h2>📦 Estoque (${produtos.length} produtos)</h2>${produtos.length === 0 ? "<p style='color:#aaa'>Nenhum produto.</p>" : `<table><thead><tr><th>Produto</th><th style="text-align:center">Total</th><th>Variantes</th><th>Venda</th><th style="text-align:center">Margem</th></tr></thead><tbody>${linhasProd}</tbody></table>`}
<div class="footer">FitMGwear Sistema de Gestão</div></body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Relatório PDF</h1><p className="page-sub">Gere um relatório financeiro completo</p></div>
        <button className="btn btn-primary" onClick={gerarPDF}><Icon name="download" />Gerar e Imprimir PDF</button>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div className="input-group" style={{ minWidth: 200 }}><label className="input-label">Mês</label><input className="input" type="month" value={mes} onChange={e => setMes(e.target.value)} /></div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 20 }}>
              <div style={{ fontSize: 13 }}><span style={{ color: "var(--text2)" }}>Receitas: </span><span style={{ color: "var(--green)", fontWeight: 700 }}>{formatBRL(receitasMes)}</span></div>
              <div style={{ fontSize: 13 }}><span style={{ color: "var(--text2)" }}>Despesas: </span><span style={{ color: "var(--red)", fontWeight: 700 }}>{formatBRL(despesasMes)}</span></div>
              <div style={{ fontSize: 13 }}><span style={{ color: "var(--text2)" }}>Saldo: </span><span style={{ color: saldoMes >= 0 ? "var(--blue)" : "var(--red)", fontWeight: 700 }}>{formatBRL(saldoMes)}</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header" style={{ padding: "18px 20px 14px" }}><span className="card-title">Transações ({transacoesFiltradas.length})</span></div>
        <div className="table-wrap">
          {transacoesFiltradas.length === 0
            ? <div className="empty-state"><div className="empty-icon">📄</div><div className="empty-text">Nenhuma transação neste mês</div></div>
            : <table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
              <tbody>{transacoesFiltradas.map(t => (
                <tr key={t.id}>
                  <td style={{ color: "var(--text2)", whiteSpace: "nowrap" }}>{formatData(t.data)}</td>
                  <td>{t.descricao}</td>
                  <td><span className={`badge ${t.tipo === "venda" ? "badge-green" : "badge-red"}`}>{t.tipo === "venda" ? "Venda" : "Despesa"}</span></td>
                  <td style={{ fontWeight: 700, color: t.tipo === "venda" ? "var(--green)" : "var(--red)", textAlign: "right" }}>{formatBRL(t.valor)}</td>
                </tr>
              ))}</tbody></table>
          }
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ dados }) {
  const transacoes = dados.transacoes || [];
  const hojeISO = new Date().toISOString().split("T")[0];
  const totalReceitas = transacoes.filter(t => t.tipo === "venda").reduce((s, t) => s + t.valor, 0);
  const totalDespesas = transacoes.filter(t => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;
  const hojeCount = transacoes.filter(t => t.data && t.data.slice(0, 10) === hojeISO).length;

  const produtosAbaixo = [];
  (dados.produtos || []).forEach(p => {
    const vars = (dados.variantesProduto || []).filter(v => v.produtoPaiId === p.id);
    if (vars.length > 0) {
      vars.forEach(v => { if (v.estoque <= (p.quantidadeMinima || 5)) produtosAbaixo.push(`${p.nome} (${v.label})`); });
    } else {
      if (p.quantidadeEstoque <= p.quantidadeMinima) produtosAbaixo.push(p.nome);
    }
  });

  const ultimas = [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 8);

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Painel de Controle</h1><p className="page-sub">Visão geral do seu negócio em tempo real</p></div></div>
      <div className="stats-grid">
        <div className="stat-card green"><div className="stat-label">Receitas Totais</div><div className="stat-value">{formatBRL(totalReceitas)}</div></div>
        <div className="stat-card red"><div className="stat-label">Despesas Totais</div><div className="stat-value">{formatBRL(totalDespesas)}</div></div>
        <div className={`stat-card ${saldo >= 0 ? "blue" : "red"}`}><div className="stat-label">Saldo Líquido</div><div className="stat-value">{formatBRL(saldo)}</div></div>
        <div className="stat-card gold"><div className="stat-label">Hoje</div><div className="stat-value">{hojeCount}</div><div className="stat-sub">Transações</div></div>
      </div>
      {produtosAbaixo.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: "rgba(245,166,35,0.3)", background: "rgba(245,166,35,0.04)" }}>
          <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 24 }}>⚠️</div>
            <div><div style={{ fontWeight: 700, fontSize: 14, color: "var(--yellow)" }}>Estoque crítico</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>{produtosAbaixo.join(", ")}</div></div>
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-header" style={{ padding: "20px 20px 14px" }}><span className="card-title">Últimas Transações</span></div>
        <div className="table-wrap">
          {ultimas.length === 0
            ? <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">Nenhuma transação ainda</div></div>
            : <table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
              <tbody>{ultimas.map(t => (
                <tr key={t.id}>
                  <td style={{ color: "var(--text2)", whiteSpace: "nowrap" }}>{formatData(t.data)}</td>
                  <td>{t.descricao}</td>
                  <td><span className={`badge ${t.tipo === "venda" ? "badge-green" : "badge-red"}`}>{t.tipo === "venda" ? "Venda" : "Despesa"}</span></td>
                  <td style={{ fontWeight: 700, color: t.tipo === "venda" ? "var(--green)" : "var(--red)", textAlign: "right", whiteSpace: "nowrap" }}>{formatBRL(t.valor)}</td>
                </tr>
              ))}</tbody></table>
          }
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FORM TRANSAÇÃO
// ─────────────────────────────────────────────
function FormTransacao({ tipo, dados, onSalvar, onCancelar }) {
  const [form, setForm] = useState({
    descricao: "", valor: "", categoria: "", cliente: "",
    data: new Date().toISOString().split("T")[0],
    observacoes: "", produtoId: "", varianteId: "", quantidade: "1",
  });
  const [tamSel, setTamSel] = useState("");
  const [corSel, setCorSel] = useState("");

  const categorias = (dados.categorias || []).filter(c => tipo === "venda" ? c.tipo === "receita" : c.tipo === "despesa");
  const produtos = dados.produtos || [];
  const variantesProduto = dados.variantesProduto || [];

  const produtoSelecionado = produtos.find(p => p.id === form.produtoId);

  const variantesDisponiveis = useMemo(() => {
    if (!form.produtoId) return [];
    return variantesProduto.filter(v => v.produtoPaiId === form.produtoId);
  }, [form.produtoId, variantesProduto]);

  const temVariantes = variantesDisponiveis.length > 0;

  const { tamanhos, coresParaTam } = useMemo(() => {
    if (!temVariantes) return { tamanhos: [], coresParaTam: {} };
    const tamSet = new Set();
    const coresMap = {};
    variantesDisponiveis.forEach(v => {
      const partes = v.label.split("/").map(s => s.trim());
      if (partes.length >= 2) {
        const [tam, ...corParts] = partes;
        const cor = corParts.join("/");
        tamSet.add(tam);
        if (!coresMap[tam]) coresMap[tam] = [];
        if (!coresMap[tam].find(c => c.cor === cor)) coresMap[tam].push({ cor, variante: v });
      } else {
        tamSet.add(v.label);
        coresMap[v.label] = [{ cor: "", variante: v }];
      }
    });
    return { tamanhos: [...tamSet], coresParaTam: coresMap };
  }, [variantesDisponiveis, temVariantes]);

  const varianteSelecionada = useMemo(() => {
    if (!tamSel) return null;
    const opcoes = coresParaTam[tamSel] || [];
    if (opcoes.length === 1 && opcoes[0].cor === "") return opcoes[0].variante;
    if (!corSel) return null;
    return opcoes.find(o => o.cor === corSel)?.variante || null;
  }, [tamSel, corSel, coresParaTam]);

  useEffect(() => {
    if (varianteSelecionada) {
      setForm(p => ({
        ...p, varianteId: varianteSelecionada.id,
        descricao: produtoSelecionado ? `${produtoSelecionado.nome} — ${varianteSelecionada.label}` : varianteSelecionada.label,
        valor: produtoSelecionado ? (produtoSelecionado.precoVenda * (parseInt(p.quantidade) || 1)).toFixed(2) : p.valor
      }));
    } else {
      setForm(p => ({ ...p, varianteId: "" }));
    }
  }, [varianteSelecionada]);

  const estoqueDisponivel = varianteSelecionada
    ? varianteSelecionada.estoque
    : (!temVariantes && produtoSelecionado ? produtoSelecionado.quantidadeEstoque : 0);

  const valorVenda = parseFloat(form.valor) || 0;
  const custoUnitario = produtoSelecionado ? produtoSelecionado.precoCompra : 0;
  const qtd = parseInt(form.quantidade) || 1;
  const custoTotal = custoUnitario * qtd;
  const lucro = valorVenda - custoTotal;
  const margem = custoTotal > 0 ? (lucro / custoTotal * 100) : 0;

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function handleProduto(id) {
    setForm(p => ({ ...p, produtoId: id, varianteId: "", descricao: "", valor: "" }));
    setTamSel(""); setCorSel("");
    if (id) {
      const p = produtos.find(x => x.id === id);
      if (p) setForm(prev => ({ ...prev, produtoId: id, descricao: p.nome, valor: p.precoVenda.toFixed(2) }));
    }
  }

  function handleTam(tam) {
    setTamSel(tam); setCorSel("");
  }

  function handleQtd(q) {
    set("quantidade", q);
    const n = parseInt(q) || 1;
    if (produtoSelecionado) {
      set("valor", (produtoSelecionado.precoVenda * n).toFixed(2));
      if (n > estoqueDisponivel) toast(`⚠️ Disponível: ${estoqueDisponivel} un.`, "error");
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!form.descricao.trim()) return toast("Preencha a descrição", "error");
    if (!form.valor || parseFloat(form.valor) <= 0) return toast("Valor inválido", "error");
    if (tipo === "venda" && form.produtoId) {
      if (temVariantes && !form.varianteId) return toast("Selecione uma variante para registrar a venda", "error");
      if (qtd > estoqueDisponivel) return toast("Estoque insuficiente!", "error");
    }
    const payload = {
      tipo, descricao: form.descricao, valor: parseFloat(form.valor),
      categoria: form.categoria || "", cliente: form.cliente || "",
      data: form.data || new Date().toISOString().split("T")[0],
      observacoes: form.observacoes || "", quantidade: qtd,
    };
    if (form.produtoId) payload.produtoId = form.produtoId;
    if (form.varianteId) payload.varianteId = form.varianteId;
    onSalvar(payload);
  }

  const produtosDisponiveis = produtos.filter(p => {
    const vars = variantesProduto.filter(v => v.produtoPaiId === p.id);
    if (vars.length > 0) return vars.some(v => v.estoque > 0);
    return p.quantidadeEstoque > 0;
  });

  return (
    <form onSubmit={submit}>
      {tipo === "venda" && produtosDisponiveis.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="card" style={{ padding: 18, background: "var(--surface2)", border: "1px solid var(--border2)" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.6px" }}>Vincular Produto do Estoque</div>
            <div className="form-grid form-grid-2">
              <div className="input-group">
                <label className="input-label">Produto</label>
                <select className="input" value={form.produtoId} onChange={e => handleProduto(e.target.value)}>
                  <option value="">Selecionar produto...</option>
                  {produtosDisponiveis.map(p => {
                    const vars = variantesProduto.filter(v => v.produtoPaiId === p.id);
                    const estoqueTotal = vars.length > 0 ? vars.reduce((s, v) => s + v.estoque, 0) : p.quantidadeEstoque;
                    return <option key={p.id} value={p.id}>{p.nome} (Estq: {estoqueTotal})</option>;
                  })}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Quantidade <span style={{ color: "var(--text2)", fontWeight: 400 }}>(máx: {estoqueDisponivel})</span></label>
                <input className="input" type="number" min="1" max={estoqueDisponivel || undefined} value={form.quantidade}
                  onChange={e => handleQtd(e.target.value)}
                  style={qtd > estoqueDisponivel ? { borderColor: "var(--red)" } : {}} />
              </div>
            </div>

            {form.produtoId && temVariantes && (
              <div className="variante-grade-section">
                <div className="variante-grade-label">Tamanho</div>
                <div className="variante-grade-chips">
                  {tamanhos.map(tam => {
                    const opcoes = coresParaTam[tam] || [];
                    const temEstoque = opcoes.some(o => o.variante.estoque > 0);
                    const estoqueTotal = opcoes.reduce((s, o) => s + (o.variante.estoque || 0), 0);
                    return (
                      <div key={tam}
                        className={`variante-chip ${tamSel === tam ? "active" : ""} ${!temEstoque ? "disabled" : ""}`}
                        onClick={() => temEstoque && handleTam(tam)}>
                        {tam}
                        {estoqueTotal <= 5 && estoqueTotal > 0 && <span className="variante-chip-estoque">{estoqueTotal}</span>}
                        {estoqueTotal === 0 && <span className="variante-chip-estoque zero">0</span>}
                      </div>
                    );
                  })}
                </div>

                {tamSel && coresParaTam[tamSel] && coresParaTam[tamSel][0]?.cor !== "" && (
                  <div style={{ marginTop: 12 }}>
                    <div className="variante-grade-label">Cor</div>
                    <div className="variante-grade-chips">
                      {(coresParaTam[tamSel] || []).map(({ cor, variante: v }) => (
                        <div key={cor}
                          className={`variante-chip ${corSel === cor ? "active-cor" : ""} ${v.estoque === 0 ? "disabled" : ""}`}
                          onClick={() => v.estoque > 0 && setCorSel(cor)}>
                          {cor}
                          {v.estoque <= 5 && v.estoque > 0 && <span className="variante-chip-estoque">{v.estoque}</span>}
                          {v.estoque === 0 && <span className="variante-chip-estoque zero">0</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {varianteSelecionada && (
                  <div className="variante-resultado">
                    <span className="variante-resultado-nome">✓ {varianteSelecionada.label}</span>
                    <span className={`badge ${varianteSelecionada.estoque <= 5 ? "badge-yellow" : "badge-green"}`}>
                      {varianteSelecionada.estoque} un. em estoque
                    </span>
                  </div>
                )}
              </div>
            )}

            {produtoSelecionado && valorVenda > 0 && (
              <div className="margem-preview" style={{ marginTop: 14 }}>
                <div className="margem-item"><span className="margem-item-label">Custo Total</span><span className="margem-item-value" style={{ color: "var(--red)" }}>{formatBRL(custoTotal)}</span></div>
                <div style={{ color: "var(--border2)", fontSize: 20 }}>→</div>
                <div className="margem-item"><span className="margem-item-label">Venda</span><span className="margem-item-value" style={{ color: "var(--green)" }}>{formatBRL(valorVenda)}</span></div>
                <div style={{ color: "var(--border2)", fontSize: 20 }}>→</div>
                <div className="margem-item"><span className="margem-item-label">Lucro</span><span className="margem-item-value" style={{ color: lucro >= 0 ? "var(--green)" : "var(--red)" }}>{formatBRL(lucro)}</span></div>
                <div style={{ marginLeft: "auto" }}><span className={`badge ${margem > 30 ? "badge-green" : margem > 10 ? "badge-gold" : "badge-red"}`} style={{ fontSize: 14, padding: "5px 12px" }}>{margem.toFixed(1)}%</span></div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="form-grid form-grid-2" style={{ marginBottom: 14 }}>
        <div className="input-group"><label className="input-label">Descrição *</label><input className="input" placeholder="Ex: Camiseta Dry-Fit" value={form.descricao} onChange={e => set("descricao", e.target.value)} /></div>
        <div className="input-group"><label className="input-label">Valor (R$) *</label><input className="input" type="number" step="0.01" min="0" value={form.valor} onChange={e => set("valor", e.target.value)} /></div>
        <div className="input-group">
          <label className="input-label">Categoria</label>
          <select className="input" value={form.categoria} onChange={e => set("categoria", e.target.value)}>
            <option value="">Selecione...</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        {tipo === "venda" && (
          <div className="input-group">
            <label className="input-label">Cliente</label>
            <select className="input" value={form.cliente} onChange={e => set("cliente", e.target.value)}>
              <option value="">Nenhum</option>
              {(dados.clientes || []).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        )}
        <div className="input-group"><label className="input-label">Data</label><input className="input" type="date" value={form.data} onChange={e => set("data", e.target.value)} /></div>
        <div className="input-group" style={{ gridColumn: "1 / -1" }}>
          <label className="input-label">Observações</label>
          <textarea className="input" value={form.observacoes} onChange={e => set("observacoes", e.target.value)} style={{ minHeight: 60 }} />
        </div>
      </div>
      <div className="form-actions">
        {onCancelar && <button type="button" className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>}
        <button type="submit" className={`btn ${tipo === "venda" ? "btn-success" : "btn-danger"}`}>
          <Icon name={tipo === "venda" ? "check" : "expense"} />
          {tipo === "venda" ? "Registrar Venda" : "Registrar Despesa"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// TRANSAÇÕES
// ─────────────────────────────────────────────
function Transacoes({ dados, onRemover }) {
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const transacoes = useMemo(() => {
    let list = [...(dados.transacoes || [])].sort((a, b) => new Date(b.data) - new Date(a.data));
    if (filtro !== "todos") list = list.filter(t => t.tipo === filtro);
    if (busca) list = list.filter(t => t.descricao.toLowerCase().includes(busca.toLowerCase()));
    return list;
  }, [dados.transacoes, filtro, busca]);

  function nomeCliente(id) { return (dados.clientes || []).find(x => x.id === id)?.nome || ""; }

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Transações</h1><p className="page-sub">Histórico completo</p></div></div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input className="input" style={{ maxWidth: 260 }} placeholder="🔍 Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
        {["todos", "venda", "despesa"].map(f => (
          <button key={f} className={`btn btn-sm ${filtro === f ? "btn-primary" : "btn-secondary"}`} onClick={() => setFiltro(f)}>
            {f === "todos" ? "Todos" : f === "venda" ? "Vendas" : "Despesas"}
          </button>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap">
          {transacoes.length === 0
            ? <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">Nenhuma transação</div></div>
            : <table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Cliente</th><th style={{ textAlign: "right" }}>Valor</th><th></th></tr></thead>
              <tbody>{transacoes.map(t => (
                <tr key={t.id}>
                  <td style={{ color: "var(--text2)", whiteSpace: "nowrap" }}>{formatData(t.data)}</td>
                  <td>{t.descricao}{t.observacoes && <div style={{ fontSize: 11, color: "var(--text2)" }}>{t.observacoes}</div>}</td>
                  <td><span className={`badge ${t.tipo === "venda" ? "badge-green" : "badge-red"}`}>{t.tipo === "venda" ? "Venda" : "Despesa"}</span></td>
                  <td style={{ color: "var(--text2)" }}>{nomeCliente(t.cliente)}</td>
                  <td style={{ fontWeight: 700, color: t.tipo === "venda" ? "var(--green)" : "var(--red)", textAlign: "right", whiteSpace: "nowrap" }}>{formatBRL(t.valor)}</td>
                  <td><button className="btn-icon danger" onClick={() => setConfirmId(t.id)}><Icon name="trash" /></button></td>
                </tr>
              ))}</tbody></table>
          }
        </div>
      </div>
      <ConfirmDialog open={!!confirmId} title="Remover Transação?" text="Esta ação não pode ser desfeita." danger
        onConfirm={() => { onRemover(confirmId); setConfirmId(null); toast("Transação removida"); }}
        onCancel={() => setConfirmId(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────
// ESTOQUE com VARIANTES
// ─────────────────────────────────────────────
function Estoque({ dados, onAdicionar, onRemover, onAtualizar, onAdicionarVariante, onRemoverVariante, onAtualizarVariante }) {
  const [modal, setModal] = useState(false);
  const [modalVariantes, setModalVariantes] = useState(null);
  const [editando, setEditando] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [expandidos, setExpandidos] = useState({});
  const [form, setForm] = useState({ nome: "", descricao: "", precoCompra: "", precoVenda: "", quantidadeEstoque: "", quantidadeMinima: "5", sku: "" });

  const [novaVariante, setNovaVariante] = useState({ label: "", estoque: "" });
  const [editandoVariante, setEditandoVariante] = useState(null);

  const produtos = dados.produtos || [];
  const variantesProduto = dados.variantesProduto || [];

  const pc = parseFloat(form.precoCompra) || 0;
  const pv = parseFloat(form.precoVenda) || 0;
  const margemForm = pc > 0 && pv > 0 ? ((pv - pc) / pc * 100) : null;

  function abrirModal(p = null) {
    if (p) {
      setEditando(p.id);
      setForm({ nome: p.nome, descricao: p.descricao || "", precoCompra: p.precoCompra, precoVenda: p.precoVenda, quantidadeEstoque: p.quantidadeEstoque, quantidadeMinima: p.quantidadeMinima, sku: p.sku || "" });
    } else {
      setEditando(null);
      setForm({ nome: "", descricao: "", precoCompra: "", precoVenda: "", quantidadeEstoque: "", quantidadeMinima: "5", sku: "" });
    }
    setModal(true);
  }

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function toggleExpand(id) { setExpandidos(p => ({ ...p, [id]: !p[id] })); }

  function submit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return toast("Preencha o nome", "error");
    if (!form.precoVenda || parseFloat(form.precoVenda) <= 0) return toast("Preço de venda inválido", "error");
    const d = { nome: form.nome, descricao: form.descricao, precoCompra: parseFloat(form.precoCompra) || 0, precoVenda: parseFloat(form.precoVenda), quantidadeEstoque: parseInt(form.quantidadeEstoque) || 0, quantidadeMinima: parseInt(form.quantidadeMinima) || 5, sku: form.sku };
    if (editando) { onAtualizar(editando, d); toast("Produto atualizado"); }
    else { onAdicionar(d); toast("Produto adicionado"); }
    setModal(false);
  }

  async function salvarVariante(e) {
    e.preventDefault();
    if (!novaVariante.label.trim()) return toast("Informe o label da variante (ex: P/Preto)", "error");
    if (!modalVariantes) return;
    await onAdicionarVariante({ produtoPaiId: modalVariantes.id, label: novaVariante.label.trim(), estoque: parseInt(novaVariante.estoque) || 0 });
    setNovaVariante({ label: "", estoque: "" });
    toast("Variante adicionada ✓");
  }

  async function salvarEdicaoVariante(e) {
    e.preventDefault();
    if (!editandoVariante) return;
    await onAtualizarVariante(editandoVariante.id, { label: editandoVariante.label, estoque: parseInt(editandoVariante.estoque) || 0 });
    setEditandoVariante(null);
    toast("Variante atualizada ✓");
  }

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Estoque</h1><p className="page-sub">Gerencie produtos e variantes (tamanho/cor)</p></div>
        <button className="btn btn-primary" onClick={() => abrirModal()}><Icon name="plus" /> Novo Produto</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          {produtos.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-text">Nenhum produto cadastrado</div></div>
          ) : (
            <table>
              <thead><tr><th>Produto</th><th>SKU</th><th>Compra</th><th>Venda</th><th>Estoque</th><th>Margem</th><th></th></tr></thead>
              <tbody>
                {produtos.map(p => {
                  const vars = variantesProduto.filter(v => v.produtoPaiId === p.id);
                  const temVars = vars.length > 0;
                  const estoqueTotal = temVars ? vars.reduce((s, v) => s + (v.estoque || 0), 0) : p.quantidadeEstoque;
                  const baixo = estoqueTotal <= p.quantidadeMinima;
                  const margem = p.precoCompra > 0 ? ((p.precoVenda - p.precoCompra) / p.precoCompra * 100) : 0;
                  const expandido = expandidos[p.id];
                  return [
                    <tr key={p.id} className="produto-pai-row">
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="product-thumb">👕</div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{p.nome}</div>
                            {p.descricao && <div style={{ fontSize: 11, color: "var(--text2)" }}>{p.descricao}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--text2)", fontSize: 12 }}>{p.sku || "—"}</td>
                      <td>{formatBRL(p.precoCompra)}</td>
                      <td style={{ fontWeight: 700 }}>{formatBRL(p.precoVenda)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span className={`badge ${baixo ? "badge-yellow" : "badge-green"}`}>{estoqueTotal} un.</span>
                          {baixo && <span style={{ fontSize: 11, color: "var(--yellow)" }}>⚠ mín: {p.quantidadeMinima}</span>}
                          {temVars && (
                            <button className="produto-expand-btn" onClick={() => toggleExpand(p.id)}>
                              <Icon name={expandido ? "chevronDown" : "chevronRight"} size={12} />
                              {vars.length} variant{vars.length === 1 ? "e" : "es"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td><span className={`badge ${margem > 30 ? "badge-green" : margem > 10 ? "badge-gold" : "badge-red"}`}>{margem.toFixed(0)}%</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button className="btn-icon" title="Gerenciar Variantes" onClick={() => { setModalVariantes(p); setNovaVariante({ label: "", estoque: "" }); setEditandoVariante(null); }} style={{ color: "var(--blue)", borderColor: "rgba(77,166,255,0.3)" }}>
                            <Icon name="variant" />
                          </button>
                          <button className="btn-icon" onClick={() => abrirModal(p)}><Icon name="edit" /></button>
                          <button className="btn-icon danger" onClick={() => setConfirmId(p.id)}><Icon name="trash" /></button>
                        </div>
                      </td>
                    </tr>,
                    ...(temVars && expandido ? vars.map(v => {
                      const vBaixo = v.estoque <= (p.quantidadeMinima || 5);
                      return (
                        <tr key={`var-${v.id}`} className="variante-row">
                          <td className="variante-indent" colSpan={1}>
                            <div className="variante-label">
                              <span style={{ color: "var(--text2)", fontSize: 16 }}>↳</span>
                              <span className="variante-label-badge">{v.label}</span>
                            </div>
                          </td>
                          <td style={{ color: "var(--text2)", fontSize: 11 }}>—</td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>—</td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>—</td>
                          <td><span className={`badge ${v.estoque === 0 ? "badge-red" : vBaixo ? "badge-yellow" : "badge-green"}`}>{v.estoque} un.</span></td>
                          <td></td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="btn-icon" onClick={() => setEditandoVariante({ id: v.id, label: v.label, estoque: v.estoque })}><Icon name="edit" /></button>
                              <button className="btn-icon danger" onClick={async () => { await onRemoverVariante(v.id); toast("Variante removida"); }}><Icon name="trash" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : [])
                  ];
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Produto" : "Novo Produto"} wide>
        <form onSubmit={submit}>
          <div className="form-grid form-grid-2">
            <div className="input-group" style={{ gridColumn: "1 / -1" }}><label className="input-label">Nome *</label><input className="input" value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
            <div className="input-group"><label className="input-label">SKU</label><input className="input" value={form.sku} onChange={e => set("sku", e.target.value)} /></div>
            <div className="input-group"><label className="input-label">Descrição</label><input className="input" value={form.descricao} onChange={e => set("descricao", e.target.value)} /></div>
            <div className="input-group"><label className="input-label">Preço de Compra</label><input className="input" type="number" step="0.01" min="0" value={form.precoCompra} onChange={e => set("precoCompra", e.target.value)} /></div>
            <div className="input-group"><label className="input-label">Preço de Venda *</label><input className="input" type="number" step="0.01" min="0" value={form.precoVenda} onChange={e => set("precoVenda", e.target.value)} /></div>
            {margemForm !== null && (
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="margem-preview">
                  <div className="margem-item"><span className="margem-item-label">Custo</span><span className="margem-item-value" style={{ color: "var(--red)" }}>{formatBRL(pc)}</span></div>
                  <div style={{ color: "var(--border2)", fontSize: 20 }}>→</div>
                  <div className="margem-item"><span className="margem-item-label">Venda</span><span className="margem-item-value" style={{ color: "var(--green)" }}>{formatBRL(pv)}</span></div>
                  <div style={{ color: "var(--border2)", fontSize: 20 }}>→</div>
                  <div className="margem-item"><span className="margem-item-label">Lucro</span><span className="margem-item-value" style={{ color: pv >= pc ? "var(--green)" : "var(--red)" }}>{formatBRL(pv - pc)}</span></div>
                  <div style={{ marginLeft: "auto" }}><span className={`badge ${margemForm > 30 ? "badge-green" : margemForm > 10 ? "badge-gold" : "badge-red"}`} style={{ fontSize: 14, padding: "5px 12px" }}>{margemForm.toFixed(1)}%</span></div>
                </div>
              </div>
            )}
            <div className="input-group">
              <label className="input-label">Estoque padrão <span style={{ fontWeight: 400, color: "var(--text2)", textTransform: "none" }}>(usado se não houver variantes)</span></label>
              <input className="input" type="number" min="0" value={form.quantidadeEstoque} onChange={e => set("quantidadeEstoque", e.target.value)} />
            </div>
            <div className="input-group"><label className="input-label">Qtd. Mínima (alerta)</label><input className="input" type="number" min="0" value={form.quantidadeMinima} onChange={e => set("quantidadeMinima", e.target.value)} /></div>
            <div style={{ gridColumn: "1 / -1", background: "rgba(77,166,255,0.07)", border: "1px solid rgba(77,166,255,0.2)", borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 12, color: "var(--text2)" }}>
              💡 Depois de criar o produto, clique em <strong style={{ color: "var(--blue)" }}>Gerenciar Variantes</strong> para adicionar combinações como P/Preto, G/Azul, etc.
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{editando ? "Salvar" : "Adicionar"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editandoVariante} onClose={() => setEditandoVariante(null)} title="Editar Variante">
        {editandoVariante && (
          <form onSubmit={salvarEdicaoVariante}>
            <div className="form-grid" style={{ gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Label da variante</label>
                <input className="input" placeholder="Ex: P/Preto" value={editandoVariante.label} onChange={e => setEditandoVariante(p => ({ ...p, label: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Estoque</label>
                <input className="input" type="number" min="0" value={editandoVariante.estoque} onChange={e => setEditandoVariante(p => ({ ...p, estoque: e.target.value }))} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditandoVariante(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!modalVariantes} onClose={() => setModalVariantes(null)} title={`Variantes — ${modalVariantes?.nome || ""}`} wide>
        {modalVariantes && (() => {
          const vars = variantesProduto.filter(v => v.produtoPaiId === modalVariantes.id);
          return (
            <div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
                Cada variante é uma combinação livre, ex: <strong style={{ color: "var(--text)" }}>P/Preto</strong>, <strong style={{ color: "var(--text)" }}>G/Azul</strong>, <strong style={{ color: "var(--text)" }}>M/Branco</strong>. Você define o label livremente.
              </div>
              {vars.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text2)", fontSize: 13 }}>Nenhuma variante ainda. Adicione abaixo.</div>
              ) : (
                <div className="variante-list" style={{ marginBottom: 20 }}>
                  {vars.map(v => (
                    <div key={v.id} className="variante-item">
                      <span className="variante-label-badge" style={{ fontSize: 13, padding: "4px 12px" }}>{v.label}</span>
                      <span className="variante-item-estoque"><span className={`badge ${v.estoque === 0 ? "badge-red" : v.estoque <= 5 ? "badge-yellow" : "badge-green"}`}>{v.estoque} un.</span></span>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <button className="btn-icon" onClick={() => setEditandoVariante({ id: v.id, label: v.label, estoque: v.estoque })}><Icon name="edit" /></button>
                        <button className="btn-icon danger" onClick={async () => { await onRemoverVariante(v.id); toast("Variante removida"); }}><Icon name="trash" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <div className="input-label" style={{ marginBottom: 10 }}>Adicionar nova variante</div>
                <form onSubmit={salvarVariante}>
                  <div className="add-variante-row">
                    <div className="input-group" style={{ flex: 2 }}>
                      <label className="input-label">Label (ex: P/Preto, G/Azul)</label>
                      <input className="input" placeholder="P/Preto" value={novaVariante.label} onChange={e => setNovaVariante(p => ({ ...p, label: e.target.value }))} />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">Estoque</label>
                      <input className="input" type="number" min="0" placeholder="0" value={novaVariante.estoque} onChange={e => setNovaVariante(p => ({ ...p, estoque: e.target.value }))} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}><Icon name="plus" />Adicionar</button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog open={!!confirmId} title="Remover Produto?" text="Todas as variantes também serão removidas. Ação irreversível." danger
        onConfirm={() => { onRemover(confirmId); setConfirmId(null); toast("Produto removido"); }}
        onCancel={() => setConfirmId(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────
function Clientes({ dados, onAdicionar, onRemover, onAtualizar }) {
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "" });
  const clientes = dados.clientes || [];

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }
  function abrirModal(c = null) {
    if (c) { setEditando(c.id); setForm({ nome: c.nome, telefone: c.telefone || "", email: c.email || "" }); }
    else { setEditando(null); setForm({ nome: "", telefone: "", email: "" }); }
    setModal(true);
  }
  function submit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return toast("Preencha o nome", "error");
    if (editando) { onAtualizar(editando, { ...form }); toast("Cliente atualizado"); }
    else { onAdicionar({ ...form }); toast("Cliente adicionado"); }
    setModal(false);
  }

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Clientes</h1><p className="page-sub">Base de clientes</p></div><button className="btn btn-primary" onClick={() => abrirModal()}><Icon name="plus" /> Novo</button></div>
      <div className="card"><div className="table-wrap">
        {clientes.length === 0
          ? <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-text">Nenhum cliente</div></div>
          : <table><thead><tr><th>Nome</th><th>Telefone</th><th>Email</th><th>Desde</th><th></th></tr></thead>
            <tbody>{clientes.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.nome}</td>
                <td style={{ color: "var(--text2)" }}>{c.telefone || "—"}</td>
                <td style={{ color: "var(--text2)" }}>{c.email || "—"}</td>
                <td style={{ color: "var(--text2)" }}>{formatData(c.dataCriacao)}</td>
                <td><div style={{ display: "flex", gap: 6 }}><button className="btn-icon" onClick={() => abrirModal(c)}><Icon name="edit" /></button><button className="btn-icon danger" onClick={() => setConfirmId(c.id)}><Icon name="trash" /></button></div></td>
              </tr>
            ))}</tbody></table>
        }
      </div></div>
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar Cliente" : "Novo Cliente"}>
        <form onSubmit={submit}>
          <div className="form-grid" style={{ gap: 14 }}>
            <div className="input-group"><label className="input-label">Nome *</label><input className="input" value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
            <div className="input-group"><label className="input-label">Telefone</label><input className="input" value={form.telefone} onChange={e => set("telefone", e.target.value)} /></div>
            <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary">{editando ? "Salvar" : "Adicionar"}</button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirmId} title="Remover Cliente?" text="Ação irreversível." danger onConfirm={() => { onRemover(confirmId); setConfirmId(null); toast("Removido"); }} onCancel={() => setConfirmId(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────
// CATEGORIAS
// ─────────────────────────────────────────────
function Categorias({ dados, onAdicionar, onRemover }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "receita", cor: "#3ecf8e" });
  const [confirmId, setConfirmId] = useState(null);
  const categorias = dados.categorias || [];
  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }
  function submit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return toast("Preencha o nome", "error");
    onAdicionar({ ...form }); toast("Categoria adicionada");
    setModal(false); setForm({ nome: "", tipo: "receita", cor: "#3ecf8e" });
  }
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Categorias</h1></div><button className="btn btn-primary" onClick={() => setModal(true)}><Icon name="plus" /> Nova</button></div>
      <div className="card"><div className="table-wrap">
        {categorias.length === 0
          ? <div className="empty-state"><div className="empty-icon">🏷️</div><div className="empty-text">Nenhuma categoria</div></div>
          : <table><thead><tr><th>Nome</th><th>Tipo</th><th>Cor</th><th></th></tr></thead>
            <tbody>{categorias.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.nome}</td>
                <td><span className={`badge ${c.tipo === "receita" ? "badge-green" : "badge-red"}`}>{c.tipo}</span></td>
                <td><div style={{ width: 20, height: 20, borderRadius: 6, background: c.cor, border: "1px solid var(--border2)" }} /></td>
                <td><button className="btn-icon danger" onClick={() => setConfirmId(c.id)}><Icon name="trash" /></button></td>
              </tr>
            ))}</tbody></table>
        }
      </div></div>
      <Modal open={modal} onClose={() => setModal(false)} title="Nova Categoria">
        <form onSubmit={submit}>
          <div className="form-grid" style={{ gap: 14 }}>
            <div className="input-group"><label className="input-label">Nome *</label><input className="input" value={form.nome} onChange={e => set("nome", e.target.value)} /></div>
            <div className="input-group"><label className="input-label">Tipo</label><select className="input" value={form.tipo} onChange={e => set("tipo", e.target.value)}><option value="receita">Receita</option><option value="despesa">Despesa</option></select></div>
            <div className="input-group"><label className="input-label">Cor</label><input className="input" type="color" value={form.cor} onChange={e => set("cor", e.target.value)} /></div>
          </div>
          <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary">Adicionar</button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirmId} title="Remover?" text="Irreversível." danger onConfirm={() => { onRemover(confirmId); setConfirmId(null); }} onCancel={() => setConfirmId(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
const NAV_BASE = [
  { id: "painel", label: "Painel", icon: "dashboard", group: "Principal" },
  { id: "venda", label: "Nova Venda", icon: "sell", group: "Principal" },
  { id: "despesa", label: "Nova Despesa", icon: "expense", group: "Principal" },
  { id: "transacoes", label: "Transações", icon: "categories", group: "Dados" },
  { id: "estoque", label: "Estoque", icon: "stock", group: "Dados" },
  { id: "clientes", label: "Clientes", icon: "clients", group: "Dados" },
  { id: "categorias", label: "Categorias", icon: "categories", group: "Dados" },
  { id: "relatorio", label: "Relatório PDF", icon: "pdf", group: "Dados" },
];
const NAV_DONO = [{ id: "usuarios", label: "Usuários", icon: "clients", group: "Admin" }];

function Sidebar({ page, onNavigate, onLogout, open, onClose, perfil, isDono }) {
  const navItems = isDono ? [...NAV_BASE, ...NAV_DONO] : NAV_BASE;
  const groups = [...new Set(navItems.map(i => i.group))];
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-img"><img src={logoImg} alt="MG" /></div>
          <div><div className="logo-name">FITMGWEAR</div><div className="logo-sub">Gestão</div></div>
        </div>
        <nav className="sidebar-nav">
          {groups.map(g => (
            <div key={g}>
              <div className="nav-label">{g}</div>
              {navItems.filter(i => i.group === g).map(item => (
                <div key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => { onNavigate(item.id); onClose(); }}>
                  <Icon name={item.icon} size={16} />{item.label}
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          {perfil && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 8, background: "var(--surface2)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: perfil.cargo === "dono" ? "rgba(232,184,75,0.2)" : "rgba(77,166,255,0.15)", color: perfil.cargo === "dono" ? "var(--accent)" : "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                {(perfil.nome || "?")[0].toUpperCase()}
              </div>
              <div><div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{perfil.nome}</div><div style={{ fontSize: 10, color: perfil.cargo === "dono" ? "var(--accent)" : "var(--blue)", textTransform: "capitalize" }}>{perfil.cargo}</div></div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", padding: "4px 12px 8px", fontSize: 11, color: "var(--text2)" }}>
            <Icon name="sync" size={12} /><span style={{ marginLeft: 6 }}>Firebase — tempo real</span><div className="sync-dot" />
          </div>
          <button className="footer-btn danger" onClick={onLogout}><Icon name="lock" size={14} />Sair</button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────
// FIREBASE HOOKS
// ─────────────────────────────────────────────
const CATEGORIAS_PADRAO = [
  { id: "c1", nome: "Vendas", tipo: "receita", cor: "#3ecf8e" },
  { id: "c2", nome: "Serviços", tipo: "receita", cor: "#4da6ff" },
  { id: "c3", nome: "Aluguel", tipo: "despesa", cor: "#f06060" },
  { id: "c4", nome: "Fornecedores", tipo: "despesa", cor: "#f5a623" },
  { id: "c5", nome: "Funcionários", tipo: "despesa", cor: "#a78bfa" },
  { id: "c6", nome: "Utilidades", tipo: "despesa", cor: "#22d3ee" },
];

function useCollection(colName) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, colName), snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [colName]);
  return [items, loading];
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("painel");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUsuario(u);
      if (u) {
        const snap = await getDocs(collection(db, "usuarios"));
        const perfis = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const p = perfis.find(x => x.uid === u.uid);
        setPerfil(p || { cargo: "funcionario", nome: u.email });
        setPrimeiroAcesso(false);
      } else {
        setPerfil(null);
        try { const snap = await getDocs(collection(db, "usuarios")); setPrimeiroAcesso(snap.empty); } catch { setPrimeiroAcesso(false); }
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const isDono = perfil?.cargo === "dono";

  const [transacoes, loadingT] = useCollection("transacoes");
  const [produtos, loadingP] = useCollection("produtos");
  const [clientes, loadingC] = useCollection("clientes");
  const [categorias, loadingCat] = useCollection("categorias");
  const [variantesProduto, loadingVP] = useCollection("variantesProduto");

  const loading = loadingT || loadingP || loadingC || loadingCat || loadingVP;

  useEffect(() => {
    if (!loadingCat && categorias.length === 0) {
      CATEGORIAS_PADRAO.forEach(c => setDoc(doc(db, "categorias", c.id), c));
    }
  }, [loadingCat, categorias.length]);

  const dados = { transacoes, produtos, clientes, categorias, variantesProduto };

  async function handleLogout() { await signOut(auth); setPage("painel"); }

  async function adicionarTransacao(t) {
    const id = uid();
    const novaT = { ...t, id, data: t.data || new Date().toISOString() };

    if (t.produtoId && t.tipo === "venda") {
      if (t.varianteId) {
        const variante = variantesProduto.find(v => v.id === t.varianteId);
        if (variante) {
          await setDoc(doc(db, "variantesProduto", variante.id), { ...variante, estoque: Math.max(0, variante.estoque - t.quantidade) });
        }
      } else {
        const prod = produtos.find(p => p.id === t.produtoId);
        if (prod) {
          await setDoc(doc(db, "produtos", prod.id), { ...prod, quantidadeEstoque: Math.max(0, prod.quantidadeEstoque - t.quantidade) });
        }
      }
    }

    await setDoc(doc(db, "transacoes", id), novaT);
    toast(t.tipo === "venda" ? "Venda registrada! ✓" : "Despesa registrada! ✓");
    setPage("transacoes");
  }

  async function removerTransacao(id) { await deleteDoc(doc(db, "transacoes", id)); }

  async function adicionarCliente(c) { const id = uid(); await setDoc(doc(db, "clientes", id), { ...c, id, dataCriacao: new Date().toISOString() }); }
  async function removerCliente(id) { await deleteDoc(doc(db, "clientes", id)); }
  async function atualizarCliente(id, upd) { const c = clientes.find(x => x.id === id); if (c) await setDoc(doc(db, "clientes", id), { ...c, ...upd }); }

  async function adicionarCategoria(c) { const id = uid(); await setDoc(doc(db, "categorias", id), { ...c, id }); }
  async function removerCategoria(id) { await deleteDoc(doc(db, "categorias", id)); }

  async function adicionarProduto(p) { const id = uid(); await setDoc(doc(db, "produtos", id), { ...p, id, dataCriacao: new Date().toISOString() }); }
  async function removerProduto(id) {
    await deleteDoc(doc(db, "produtos", id));
    const vars = variantesProduto.filter(v => v.produtoPaiId === id);
    for (const v of vars) await deleteDoc(doc(db, "variantesProduto", v.id));
  }
  async function atualizarProduto(id, upd) { const p = produtos.find(x => x.id === id); if (p) await setDoc(doc(db, "produtos", id), { ...p, ...upd }); }

  async function adicionarVariante(v) { const id = uid(); await setDoc(doc(db, "variantesProduto", id), { ...v, id, criadoEm: new Date().toISOString() }); }
  async function removerVariante(id) { await deleteDoc(doc(db, "variantesProduto", id)); }
  async function atualizarVariante(id, upd) { const v = variantesProduto.find(x => x.id === id); if (v) await setDoc(doc(db, "variantesProduto", id), { ...v, ...upd }); }

  if (authLoading) return (<><style>{CSS}</style><div className="loading-screen"><div className="spinner" /><p style={{ color: "var(--text2)", fontSize: 13 }}>Verificando acesso...</p></div></>);
  if (!usuario) return (<><style>{CSS}</style><LoginScreen primeiroAcesso={primeiroAcesso} /><ToastContainer /></>);
  if (loading) return (<><style>{CSS}</style><div className="loading-screen"><div className="spinner" /><p style={{ color: "var(--text2)", fontSize: 13 }}>Carregando dados...</p></div></>);

  function renderPage() {
    if (page === "painel") return <Dashboard dados={dados} />;
    if (page === "venda") return (
      <div>
        <div className="page-header"><div><h1 className="page-title">Registrar Venda</h1><p className="page-sub">Adicione uma nova venda ao caixa</p></div></div>
        <div className="card"><div className="card-body"><FormTransacao tipo="venda" dados={dados} onSalvar={adicionarTransacao} onCancelar={() => setPage("painel")} /></div></div>
      </div>
    );
    if (page === "despesa") return (
      <div>
        <div className="page-header"><div><h1 className="page-title">Registrar Despesa</h1><p className="page-sub">Adicione uma nova despesa</p></div></div>
        <div className="card"><div className="card-body"><FormTransacao tipo="despesa" dados={dados} onSalvar={adicionarTransacao} onCancelar={() => setPage("painel")} /></div></div>
      </div>
    );
    if (page === "transacoes") return <Transacoes dados={dados} onRemover={removerTransacao} />;
    if (page === "estoque") return <Estoque dados={dados} onAdicionar={adicionarProduto} onRemover={removerProduto} onAtualizar={atualizarProduto} onAdicionarVariante={adicionarVariante} onRemoverVariante={removerVariante} onAtualizarVariante={atualizarVariante} />;
    if (page === "clientes") return <Clientes dados={dados} onAdicionar={adicionarCliente} onRemover={removerCliente} onAtualizar={atualizarCliente} />;
    if (page === "categorias") return <Categorias dados={dados} onAdicionar={adicionarCategoria} onRemover={removerCategoria} />;
    if (page === "relatorio") return <RelatorioPDF dados={dados} />;
    if (page === "usuarios" && isDono) return <GerenciarUsuarios usuarioAtual={usuario} />;
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="mobile-navbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Icon name="menu" size={18} /></button>
          <div className="mobile-logo">
            <div className="mobile-logo-img"><img src={logoImg} alt="Logo" /></div>
            <span className="mobile-logo-name">FITMGWEAR</span>
          </div>
        </div>
        <Sidebar page={page} onNavigate={setPage} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} perfil={perfil} isDono={isDono} />
        <main className="main"><div className="page">{renderPage()}</div></main>
      </div>
      <ToastContainer />
    </>
  );
}
