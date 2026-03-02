import { Router } from 'express';
// Certifique-se que o nome do arquivo bate (se é maiúsculo ou minúsculo)
import WebhookController from './controllers/webhookController.js'; 

const routes = new Router();

// CORREÇÃO: Não usamos 'new WebhookController()'.
// Chamamos direto a classe WebhookController.handle porque o método é static.
routes.post('/webhook', WebhookController.handle);

routes.get('/', (req, res) => {
    res.send('🎡 API do Parque Temático está ONLINE! O Webhook está pronto em /webhook');
});

export default routes;