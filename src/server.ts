import {
    AngularNodeAppEngine,
    createNodeRequestHandler,
    isMainModule,
    writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createAuthRouter } from './server/routes/auth.routes';

const app = express();
const angularApp = new AngularNodeAppEngine();

// The application composition supplies real use cases and adapters at runtime.
// This router is intentionally mounted by the deployment composition root.
export { createAuthRouter };

app.use('*', (request, response, next) => {
    angularApp
        .handle(request)
        .then((result) => (result ? writeResponseToNodeResponse(result, response) : next()))
        .catch(next);
});

if (isMainModule(import.meta.url))
    app.listen(4000, () => console.log('SSR server listening on http://localhost:4000'));
export const reqHandler = createNodeRequestHandler(app);
