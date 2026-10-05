'use client';

import { useEffect } from 'react';
const KEY='cinerusubs-watchlist-v1';
const csrf=()=>decodeURIComponent(document.cookie.split('; ').find((item)=>item.startsWith('cinerusubs_csrf='))?.split('=').slice(1).join('=')||'');
export function WatchlistSync({authenticated}:{authenticated:boolean}){useEffect(()=>{document.documentElement.dataset.authenticated=authenticated?'true':'false';if(!authenticated)return;const local=JSON.parse(localStorage.getItem(KEY)||'[]') as Array<{id:string;type:'movie'|'series'}>;fetch('/api/watchlist',{method:'POST',headers:{'Content-Type':'application/json','x-csrf-token':csrf()},body:JSON.stringify({items:local.map((item)=>({contentType:item.type,contentId:item.id}))})}).then(async(response)=>response.ok?response.json():null).then((result)=>{if(!result)return;localStorage.setItem(KEY,JSON.stringify(result.items));dispatchEvent(new CustomEvent('cinerusubs-watchlist-change'));}).catch(()=>undefined);return()=>{delete document.documentElement.dataset.authenticated;};},[authenticated]);return null;}
