document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadDevLogList();
  handleRouting();
});

function initNavigation() {
  // Handle back/forward and manual hash edits
  window.addEventListener('hashchange', () => {
    handleRouting();
  });
}

// Called from inline onclick handlers throughout index.html
function router(viewId) {
  const current = window.location.hash.substring(1);
  window.location.hash = viewId;
  // hashchange only fires when the hash actually changes, so route
  // directly when the requested view is already in the URL.
  if (current === viewId) {
    navigateTo(viewId);
  }
  closeMobileMenu();
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const button = document.getElementById('mobile-menu-button');
  if (!menu || !button) return;
  const isOpen = !menu.classList.contains('hidden');
  isOpen ? closeMobileMenu() : openMobileMenu();
}

function openMobileMenu() {
  document.getElementById('mobile-menu')?.classList.remove('hidden');
  document.getElementById('mobile-menu-icon-open')?.classList.add('hidden');
  document.getElementById('mobile-menu-icon-close')?.classList.remove('hidden');
  document.getElementById('mobile-menu-button')?.setAttribute('aria-expanded', 'true');
}

function closeMobileMenu() {
  document.getElementById('mobile-menu')?.classList.add('hidden');
  document.getElementById('mobile-menu-icon-open')?.classList.remove('hidden');
  document.getElementById('mobile-menu-icon-close')?.classList.add('hidden');
  document.getElementById('mobile-menu-button')?.setAttribute('aria-expanded', 'false');
}

function navigateTo(viewId) {
  // Hide all views
  const views = document.querySelectorAll('[id^="view-"]'); // Selecting elements that start with 'view-'
  views.forEach(view => {
    view.classList.add('hidden');
  });

  // Show the requested view
  let activeNav = viewId;
  if (viewId.startsWith('devlog-detail/')) {
    const slug = viewId.split('/').slice(1).join('/');
    const detailView = document.getElementById('view-devlog-detail');
    if (detailView) {
      detailView.classList.remove('hidden');
      loadDevLogDetail(slug);
    }
    activeNav = 'devlogs';
  } else {
    const targetView = document.getElementById('view-' + viewId);
    if (targetView) {
      targetView.classList.remove('hidden');
    } else {
      document.getElementById('view-home').classList.remove('hidden');
      activeNav = 'home';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update active nav styling
  ['home', 'devlogs', 'about'].forEach(name => {
    const isActive = name === activeNav;

    const link = document.getElementById('nav-' + name);
    if (link) {
      link.classList.toggle('border-b-2', isActive);
      link.classList.toggle('border-black', isActive);
    }

    const mobileLink = document.getElementById('nav-' + name + '-mobile');
    if (mobileLink) {
      mobileLink.classList.toggle('text-black', isActive);
    }
  });
}

function handleRouting(defaultHash) {
  const hash = defaultHash || window.location.hash.substring(1);
  navigateTo(hash || 'home');
}

// --- Interactive Stubs ---

function showNotification(message) {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toast-msg');
  if (!toast || !msg) return;

  msg.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0');

  clearTimeout(showNotification._timer);
  showNotification._timer = setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

function launchDemoStub() {
  showNotification('Web build not published yet — check back soon.');
}

function stubDownload(platform) {
  showNotification(`${platform} build not published yet — check back soon.`);
}


// --- Dev Log System (Manifest + Markdown) ---

async function loadDevLogList() {
  const container = document.getElementById('devlogs-container');
  if (!container) return;

  try {
    const response = await fetch('devlog/manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load manifest (${response.status})`);
    }

    const data = await response.json();
    const posts = data.devlogs || [];

    if (posts.length === 0) {
      container.innerHTML = `<p style="color: #3A3735; text-align: center; padding: 3rem 0;">No dev logs published yet.</p>`;
      return;
    }

    // Just render basic list with test posts for now
    container.innerHTML = posts.map(post => `
      <article class="devlog-card" onclick="openDevLog('${post.slug}')" style="cursor: pointer; display: flex; gap: 2rem; align-items: center; margin-bottom: 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid #E8E1D9;">
        ${post.image ? `
          <div class="devlog-card-img" style="flex: 0 0 320px; height: 200px; overflow: hidden; background: #eee;">
            <img src="${post.image}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        ` : ''}
        <div class="devlog-card-content" style="flex: 1;">
          <div style="font-size: 0.85rem; color: #3A3735; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">
            ${post.date} &bull; ${post.author}
          </div>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.75rem; font-family: 'Playfair Display', Georgia, serif;">${post.title}</h3>
          <p style="color: #3A3735; line-height: 1.6; margin-bottom: 1rem;">${post.summary}</p>
          <span style="color: #232120; font-size: 0.9rem; font-weight: 500; text-decoration: underline;">Read Dev Log &rarr;</span>
        </div>
      </article>
    `).join('');

  } catch (error) {
    console.error('Error loading dev log list:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 0; color: #3A3735;">
        <p>Could not load dev log manifest.</p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">Ensure <code>devlog/manifest.json</code> is correctly configured.</p>
      </div>
    `;
  }
}

function openDevLog(slug) {
  const route = `devlog-detail/${slug}`;
  window.location.hash = route;
  navigateTo(route);
}

async function loadDevLogDetail(slug) {
  const container = document.getElementById('detail-content');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 4rem 0; color: #3A3735;">
      <p>Loading dev log...</p>
    </div>
  `;

  try {
    const response = await fetch(`devlog/${slug}.md`);
    if (!response.ok) {
      throw new Error(`Failed to load post (${response.status})`);
    }

    const markdownText = await response.text();
    const parsedHtml = marked.parse(markdownText);

    container.innerHTML = parsedHtml;

    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('Error loading dev log detail:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 0;">
        <p style="color: #e74c3c;">Unable to load this dev log.</p>
        <p style="font-size: 0.9rem; color: #3A3735; margin-top: 0.5rem;">
          Make sure <code>devlog/${slug}.md</code> exists.
        </p>
        <a href="#devlogs" onclick="navigateTo('devlogs'); return false;" style="color: #232120; margin-top: 1rem; display: inline-block;">
          &larr; Back to Dev Logs
        </a>
      </div>
    `;
  }
}
