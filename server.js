import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.use(routes);

app.listen(5000, () => {
    console.log(`Server ON: http://localhost:5000`);
});