import { sendHtml } from '../core/services.js';
import { withAuth } from '../middleware/auth.js';
import { routeAdmin } from './adminRouter.js';
import { errorPage } from '../views/renderers.js';
import { handlePublicRoutes } from './publicRoutes.js';
import { handlePostRoutes } from './postRoutes.js';
import { handleMemberRoutes } from './memberRoutes.js';

export function dispatchRequest(context) {
  const publicResult = handlePublicRoutes(context);
  if (publicResult !== null) return publicResult;

  const postResult = handlePostRoutes(context);
  if (postResult !== null) return postResult;

  const memberResult = handleMemberRoutes(context);
  if (memberResult !== null) return memberResult;

  if (context.url.pathname.startsWith('/admin')) {
    return withAuth(context, ['admin'], () => routeAdmin(context));
  }

  return sendHtml(context.res, 404, errorPage('404', 'Page not found.'));
}
