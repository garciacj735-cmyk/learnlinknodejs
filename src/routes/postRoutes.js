import { sendPage, match } from '../core/services.js';
import { withAuth } from '../middleware/auth.js';
import { renderPosts, renderPostForm } from '../views/renderers.js';
import { handleStorePost, handleShowPost, handleEditPost, handleUpdatePost, handleDeletePost, handleSendRequest } from '../controllers/handlers.js';

export function handlePostRoutes(context) {
  const { req, res, url } = context;

  if (req.method === 'GET' && url.pathname === '/posts') return sendPage(res, renderPosts(context));
  if (req.method === 'GET' && url.pathname === '/posts/create') return withAuth(context, ['learner', 'tutor', 'admin'], () => sendPage(res, renderPostForm(context, null, 'create')));
  if (req.method === 'POST' && url.pathname === '/posts') return withAuth(context, ['learner', 'tutor', 'admin'], () => handleStorePost(context));

  const showPostMatch = match(url.pathname, /^\/posts\/(\d+)$/);
  if (req.method === 'GET' && showPostMatch) return handleShowPost(context, Number(showPostMatch[1]));

  const editPostMatch = match(url.pathname, /^\/posts\/(\d+)\/edit$/);
  if (req.method === 'GET' && editPostMatch) return withAuth(context, ['learner', 'tutor', 'admin'], () => handleEditPost(context, Number(editPostMatch[1])));
  if (req.method === 'PUT' && showPostMatch) return withAuth(context, ['learner', 'tutor', 'admin'], () => handleUpdatePost(context, Number(showPostMatch[1])));
  if (req.method === 'DELETE' && showPostMatch) return withAuth(context, ['learner', 'tutor', 'admin'], () => handleDeletePost(context, Number(showPostMatch[1])));

  const requestPostMatch = match(url.pathname, /^\/posts\/(\d+)\/request$/);
  if (req.method === 'POST' && requestPostMatch) return withAuth(context, ['learner', 'tutor', 'admin'], () => handleSendRequest(context, Number(requestPostMatch[1])));

  return null;
}
