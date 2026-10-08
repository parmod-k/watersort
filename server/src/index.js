import { createApp } from './app.js';
import { createPool } from './db.js';

const port = Number(process.env.PORT ?? 4000);
const corsOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const db = createPool();
const app = createApp(db, { corsOrigins });

// 0.0.0.0 so phones on the same Wi-Fi (and the Android emulator via 10.0.2.2) can reach it.
app.listen(port, '0.0.0.0', () => console.log(`Water Sort API listening on http://localhost:${port}`));
