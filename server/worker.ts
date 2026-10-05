import { connectDb, disconnectDb } from './db.js';
import { expireReservations } from './services/orders.js';

let stopping=false;
async function run(){await connectDb();console.log('Background worker started');while(!stopping){try{const count=await expireReservations();if(count)console.log(`Expired ${count} reservations`)}catch(error:any){console.error('Reservation expiry failed',{message:error.message})}await new Promise(resolve=>setTimeout(resolve,30_000))}await disconnectDb()}
process.on('SIGTERM',()=>{stopping=true});process.on('SIGINT',()=>{stopping=true});run().catch(error=>{console.error(error);process.exit(1)});
