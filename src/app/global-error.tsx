'use client';
export default function GlobalError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <html><body><main className="error-page"><span>500</span><h1>The projector stopped</h1><p>CineruSubs could not complete this request. No raw server details have been exposed.</p><button className="action-button" onClick={reset}>Try again</button></main></body></html>}
