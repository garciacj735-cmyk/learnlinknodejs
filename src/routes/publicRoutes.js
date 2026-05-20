import { sendPage, match } from '../core/services.js';
import {
  renderLanding,
  renderAdminLogin,
  renderRegister,
  renderPending,
  renderForgot,
  renderReset,
  renderAbout,
  renderFaq,
  renderContact
} from '../views/renderers.js';
import { handleLogin, handleAdminLogin, handleRegister, handleVerify, handleForgot, handleReset, handleContact } from '../controllers/handlers.js';

export function handlePublicRoutes(context) {
  const { req, res, url } = context;

  if (req.method === 'GET' && url.pathname === '/') return sendPage(res, renderLanding(context));
  if (req.method === 'POST' && url.pathname === '/login') return handleLogin(context);
  if (req.method === 'GET' && url.pathname === '/admin/login') return sendPage(res, renderAdminLogin(context));
  if (req.method === 'POST' && url.pathname === '/admin/login') return handleAdminLogin(context);
  if (req.method === 'GET' && url.pathname === '/register') return sendPage(res, renderRegister(context));
  if (req.method === 'POST' && url.pathname === '/register') return handleRegister(context);
  if (req.method === 'GET' && url.pathname === '/tutor-pending') return sendPage(res, renderPending(context));

  const verifyMatch = match(url.pathname, /^\/verify-email\/([^/]+)$/);
  if (req.method === 'GET' && verifyMatch) return handleVerify(context, decodeURIComponent(verifyMatch[1]));

  if (req.method === 'GET' && url.pathname === '/forgot-password') return sendPage(res, renderForgot(context));
  if (req.method === 'POST' && url.pathname === '/forgot-password') return handleForgot(context);

  const resetMatch = match(url.pathname, /^\/reset-password\/([^/]+)$/);
  if (req.method === 'GET' && resetMatch) return sendPage(res, renderReset(context, decodeURIComponent(resetMatch[1])));
  if (req.method === 'POST' && resetMatch) return handleReset(context, decodeURIComponent(resetMatch[1]));

  if (req.method === 'GET' && url.pathname === '/about') return sendPage(res, renderAbout(context));
  if (req.method === 'GET' && url.pathname === '/faq') return sendPage(res, renderFaq(context));
  if (req.method === 'GET' && url.pathname === '/contact') return sendPage(res, renderContact(context));
  if (req.method === 'POST' && url.pathname === '/contact') return handleContact(context);

  return null;
}
