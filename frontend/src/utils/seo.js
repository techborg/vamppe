// Central SEO config — import useSEO in any page
import { useHelmet } from 'react-helmet-async';

const BASE = 'https://vamppe.com';
const DEFAULT_IMG = `${BASE}/og-image.png`;
const SITE_NAME = 'Vamppe';

export function buildSEO({
  title,
  description = 'Connect, share moments, discover trending content, and chat in real time on Vamppe.',
  image = DEFAULT_IMG,
  url = BASE,
  type = 'website',
  noIndex = false,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Connect, Share & Discover`;
  return { fullTitle, description, image, url, type, noIndex };
}

export const SEO_DEFAULTS = {
  home:          { title: 'Home',          description: 'Your personalised Vamppe feed — posts from people you follow.' },
  explore:       { title: 'Explore',       description: 'Discover trending posts and new people on Vamppe.' },
  notifications: { title: 'Notifications', description: 'Stay up to date with your latest activity on Vamppe.' },
  chat:          { title: 'Messages',      description: 'Chat in real time with your connections on Vamppe.' },
  login:         { title: 'Sign in',       description: 'Sign in to your Vamppe account.', noIndex: true },
  register:      { title: 'Create account', description: 'Join Vamppe — the modern social platform.', noIndex: true },
  notFound:      { title: '404 — Page not found', noIndex: true },
};
