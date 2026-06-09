import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  limit
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

import { escapeHtml, initialsFromName, formatDate } from './utils.js';

const commentUnsubscribers = new Map();

export function cleanupCommentListeners() {
  commentUnsubscribers.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch {}
  });
  commentUnsubscribers.clear();
}

export function setPostMessage(els, message, isError = false) {
  if (!els.postStatus) return;
  els.postStatus.textContent = message;
  els.postStatus.style.color = isError ? '#ff9eb8' : '#b8a9d6';
}

export function defaultPostsMarkup() {
  return `
    <article class="post">
      <div class="post-top">
        <div class="author">
          <div class="avatar">DJ</div>
          <div>
            <strong>DJ EchoFalls</strong>
            <small>Verified DJ • 7 mins ago</small>
          </div>
        </div>
        <span class="badge">Pinned Update</span>
      </div>
      <p>Going live tonight with a proper multi-genre workout. Drop your requests, jump in the chat, and let’s make it a madness 🔥</p>
      <div class="post-actions">
        <button class="like-btn" data-liked="false"><span class="like-count">128</span> Likes</button>
        <button class="comment-toggle" data-target="comments-demo-1">💬 <span class="comment-count">2</span> Comments</button>
        <button>📌 Pinned</button>
      </div>
      <div class="comments-box" id="comments-demo-1">
        <div class="comment-item"><strong>Laura:</strong> Can’t wait for tonight 🔥</div>
        <div class="comment-item"><strong>Mike:</strong> Requests locked and loaded!</div>
        <form class="comment-form">
          <input type="text" placeholder="Write a comment..." maxlength="140">
          <button type="submit">Post</button>
        </form>
      </div>
    </article>
  `;
}

export function bindDemoInteractions() {
  document.querySelectorAll('.like-btn').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const countEl = btn.querySelector('.like-count');
      if (!countEl) return;

      let count = Number(countEl.textContent || 0);
      const liked = btn.dataset.liked === 'true';

      if (liked) {
        count -= 1;
        btn.dataset.liked = 'false';
        btn.classList.remove('liked');
      } else {
        count += 1;
        btn.dataset.liked = 'true';
        btn.classList.add('liked');
      }

      countEl.textContent = String(count);
    });
  });

  document.querySelectorAll('.comment-toggle').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.toggle('open');
    });
  });

  document.querySelectorAll('.comment-form').forEach((form) => {
    if (form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const value = input?.value.trim();
      if (!value) return;

      const box = form.closest('.comments-box');
      const toggleBtn = box ? document.querySelector(`[data-target="${box.id}"]`) : null;
      const countEl = toggleBtn?.querySelector('.comment-count');

      const item = document.createElement('div');
      item.className = 'comment-item';
      item.innerHTML = `<strong>You:</strong> ${escapeHtml(value)}`;
      form.before(item);

      if (input) input.value = '';
      if (countEl) countEl.textContent = String(Number(countEl.textContent || 0) + 1);
    });
  });
}

export async function createPost({ auth, db, els, usingPlaceholders, currentUserProfile, openAuth }) {
  if (usingPlaceholders || !auth || !db) {
    setPostMessage(els, 'Paste your Firebase config first.', true);
    return;
  }

  if (!auth.currentUser || !currentUserProfile) {
    setPostMessage(els, 'Login to create a post.', true);
    openAuth();
    return;
  }

  const text = els.postInput?.value.trim();
  if (!text) {
    setPostMessage(els, 'Write something before posting.', true);
    return;
  }

  try {
    els.createPostBtn.disabled = true;
    els.createPostBtn.textContent = 'Posting...';
    setPostMessage(els, '');

    await addDoc(collection(db, 'posts'), {
      uid: auth.currentUser.uid,
      authorName: currentUserProfile.displayName,
      role: currentUserProfile.role || 'Listener',
      text,
      likesCount: 0,
      createdAt: serverTimestamp()
    });

    els.postInput.value = '';
    setPostMessage(els, '✅ Post published!');
  } catch (error) {
    console.error('Create post error:', error);
    setPostMessage(els, error.message, true);
  } finally {
    els.createPostBtn.disabled = false;
    els.createPostBtn.textContent = 'Post Now';
  }
}

export async function addComment({ auth, db, els, usingPlaceholders, currentUserProfile, openAuth, postId }) {
  if (usingPlaceholders || !db || !auth) {
    setPostMessage(els, 'Paste your Firebase config first.', true);
    return;
  }

  if (!auth.currentUser || !currentUserProfile) {
    setPostMessage(els, 'Login to comment.', true);
    openAuth();
    return;
  }

  const input = document.getElementById(`comment-input-${postId}`);
  const text = input?.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      uid: auth.currentUser.uid,
      authorName: currentUserProfile.displayName,
      text,
      createdAt: serverTimestamp()
    });

    input.value = '';
  } catch (error) {
    console.error('Add comment error:', error);
  }
}

export async function likePost({ auth, db, els, usingPlaceholders, openAuth, postId }) {
  if (usingPlaceholders || !db || !auth) {
    setPostMessage(els, 'Paste your Firebase config first.', true);
    return;
  }

  if (!auth.currentUser) {
    setPostMessage(els, 'Login to like posts.', true);
    openAuth();
    return;
  }

  const userId = auth.currentUser.uid;
  const postRef = doc(db, 'posts', postId);
  const likeRef = doc(db, 'posts', postId, 'likes', userId);

  try {
    await runTransaction(db, async (transaction) => {
      const postSnap = await transaction.get(postRef);
      const likeSnap = await transaction.get(likeRef);

      if (!postSnap.exists()) throw new Error('Post not found.');

      const currentLikes = Number(postSnap.data().likesCount || 0);

      if (likeSnap.exists()) {
        transaction.delete(likeRef);
        transaction.update(postRef, {
          likesCount: Math.max(0, currentLikes - 1)
        });
      } else {
        transaction.set(likeRef, {
          uid: userId,
          createdAt: serverTimestamp()
        });
        transaction.update(postRef, {
          likesCount: currentLikes + 1
        });
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
  }
}

export async function deletePost({ auth, db, els, usingPlaceholders, openAuth, postId }) {
  if (usingPlaceholders || !db || !auth) {
    setPostMessage(els, 'Paste your Firebase config first.', true);
    return;
  }

  if (!auth.currentUser) {
    setPostMessage(els, 'Login to delete posts.', true);
    openAuth();
    return;
  }

  const ok = confirm('Delete this post?');
  if (!ok) return;

  try {
    await deleteDoc(doc(db, 'posts', postId));
    setPostMessage(els, '🗑️ Post deleted.');
  } catch (error) {
    console.error('Delete post error:', error);
    setPostMessage(els, error.message, true);
  }
}

function listenForComments({ db, postId }) {
  const commentsList = document.getElementById(`comments-list-${postId}`);
  if (!commentsList) return;

  if (commentUnsubscribers.has(postId)) {
    commentUnsubscribers.get(postId)();
    commentUnsubscribers.delete(postId);
  }

  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    commentsList.innerHTML = '';

    snapshot.forEach((docSnap) => {
      const comment = docSnap.data();

      commentsList.innerHTML += `
        <div class="comment-item">
          <strong>${escapeHtml(comment.authorName || 'User')}</strong>
          <div>${escapeHtml(comment.text || '')}</div>
          <small style="display:block;margin-top:6px;color:#b8a9d6;">${escapeHtml(formatDate(comment.createdAt))}</small>
        </div>
      `;
    });
  }, (error) => {
    console.error('Comments listener error:', error);
  });

  commentUnsubscribers.set(postId, unsubscribe);
}

function bindLivePostButtons({ auth, db, els, usingPlaceholders, currentUserProfile, openAuth }) {
  document.querySelectorAll('.comment-toggle').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.toggle('open');
    });
  });

  document.querySelectorAll('.live-comment-submit').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', async () => {
      await addComment({
        auth, db, els, usingPlaceholders, currentUserProfile, openAuth,
        postId: btn.dataset.postId
      });
    });
  });

  document.querySelectorAll('.delete-post-btn').forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', async () => {
      await deletePost({
        auth, db, els, usingPlaceholders, openAuth,
        postId: btn.dataset.postId
      });
    });
  });
}

function renderFeed({ auth, db, els, posts, usingPlaceholders, currentUserProfile, openAuth }) {
  if (!els.feedContainer) return;

  cleanupCommentListeners();

  if (!posts.length) {
    els.feedContainer.innerHTML = defaultPostsMarkup();
    bindDemoInteractions();
    return;
  }

  els.feedContainer.innerHTML = '';

  posts.forEach((post) => {
    const article = document.createElement('article');
    article.className = 'post';

    const created = formatDate(post.createdAt);
    const canDelete = auth?.currentUser && post.uid === auth.currentUser.uid;

    article.innerHTML = `
      <div class="post-top">
        <div class="author">
          <div class="avatar">${initialsFromName(post.authorName || 'WS')}</div>
          <div>
            <strong>${escapeHtml(post.authorName || 'Wildstyle User')}</strong>
            <small>${escapeHtml(post.role || 'Listener')} • ${escapeHtml(created)}</small>
          </div>
        </div>
        <span class="badge">Live Post</span>
      </div>

      <p>${escapeHtml(post.text || '')}</p>

      <div class="post-actions">
        <button onclick="likePost('${post.id}')">
          ❤️ ${Number(post.likesCount || 0)} Likes
        </button>
        <button class="comment-toggle" data-target="comments-box-${post.id}">
          💬 Comments
        </button>
        ${canDelete ? `<button class="delete-post-btn" data-post-id="${post.id}">🗑 Delete</button>` : ''}
      </div>

      <div class="comments-box" id="comments-box-${post.id}">
        <div id="comments-list-${post.id}"></div>
        <div class="comment-form">
          <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." maxlength="140" />
          <button type="button" class="live-comment-submit" data-post-id="${post.id}">Post</button>
        </div>
      </div>
    `;

    els.feedContainer.appendChild(article);
  });

  const defaults = document.createElement('div');
  defaults.innerHTML = defaultPostsMarkup();
  while (defaults.firstChild) {
    els.feedContainer.appendChild(defaults.firstChild);
  }

  bindLivePostButtons({ auth, db, els, usingPlaceholders, currentUserProfile, openAuth });
  bindDemoInteractions();

  posts.forEach((post) => {
    listenForComments({ db, postId: post.id });
  });
}

export function startFeedListener({
  auth,
  db,
  els,
  usingPlaceholders,
  currentUserProfile,
  openAuth,
  onPostsUpdated
}) {
  if (!els.feedContainer) return () => {};

  if (usingPlaceholders || !db) {
    renderFeed({ auth, db, els, posts: [], usingPlaceholders, currentUserProfile, openAuth });
    return () => {};
  }

  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(12)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderFeed({ auth, db, els, posts, usingPlaceholders, currentUserProfile, openAuth });
    onPostsUpdated?.();
  }, (error) => {
    console.error('Feed error:', error);
    renderFeed({ auth, db, els, posts: [], usingPlaceholders, currentUserProfile, openAuth });
  });

  return unsubscribe;
} 
