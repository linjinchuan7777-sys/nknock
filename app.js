// 雷娜塔的家 (Renata's Home) - 核心邏輯控制
// 管理狀態、權限、視圖切換與各模組的互動渲染（完美支援傳統門戶風格）

(function() {
  // ==========================================================================
  // 1. 應用程式狀態 (State)
  // ==========================================================================
  let state = {
    settings: {},
    posts: [],
    books: [],
    todos: [],
    notes: "",
    media: [],
    spots: [],
    events: [],
    wardrobeItems: [],
    
    // 多用戶模擬
    activeProfile: null, 
    ownerProfile: {},
    friends: [],
    
    // 權限與安全
    role: "visitor", // visitor, friend, admin
    currentKey: "",
    
    // 導覽狀態
    currentView: "home-view",
    currentPostId: null,
    currentCategoryFilter: "all",
    currentSubCategoryFilter: null,
    
    // DVD/CD 架子過濾器
    mediaTypeFilter: "all", // all, movie, game, music
    
    // 行事曆顯示月份
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(), // 0-indexed
  };

  // Leaflet 地圖物件
  let leafletMap = null;
  let mapMarkers = [];

  // ==========================================================================
  // 2. 初始化與快取 (Initialization & Cache)
  // ==========================================================================
  function init() {
    loadDatabase();
    checkRoleFromUrlOrStorage();
    setupEventListeners();
    setupVisitEventListeners();
    initRichEditorToolbars(); // 初始化富文本工具列
    initMediaStarsInteraction(); // 初始化影音星級點選
    
    // 根據角色調整 UI
    applyRolePermissions();
    
    // 預設渲染首頁
    navigateTo("home-view");
  }

  // 載入資料庫，如果 localStorage 為空則載入 data.js 的預設資料
  function loadDatabase() {
    const getLocal = (key, defaultVar) => {
      try {
        const data = localStorage.getItem(`renata_blog_${key}`);
        if (!data || data === "undefined" || data === "null") {
          return defaultVar;
        }
        const parsed = JSON.parse(data);
        if (parsed === null || parsed === undefined) {
          return defaultVar;
        }
        if (Array.isArray(defaultVar) && !Array.isArray(parsed)) {
          return defaultVar;
        }
        return parsed;
      } catch (e) {
        console.error(`Error parsing localStorage key ${key}:`, e);
        return defaultVar;
      }
    };

    state.settings = getLocal("settings", window.DEFAULT_BLOG_SETTINGS);
    state.posts = getLocal("posts", window.DEFAULT_POSTS);
    state.books = getLocal("books", window.DEFAULT_BOOKS);
    state.todos = getLocal("todos", window.DEFAULT_TODOS);
    
    // notes 是純字串
    const savedNotes = localStorage.getItem("renata_blog_notes");
    state.notes = (savedNotes !== null && savedNotes !== "null") ? savedNotes : window.DEFAULT_NOTES;

    state.media = getLocal("media", window.DEFAULT_MEDIA);
    state.spots = getLocal("spots", window.DEFAULT_SPOTS);
    state.events = getLocal("events", window.DEFAULT_EVENTS);
    state.wardrobeItems = getLocal("wardrobe_items", window.DEFAULT_WARDROBE_ITEMS);
    
    state.ownerProfile = getLocal("owner_profile", window.DEFAULT_OWNER_PROFILE);
    state.friends = getLocal("friends", window.DEFAULT_FRIENDS);
    state.globalUserPool = getLocal("global_user_pool", window.GLOBAL_USER_POOL || []);
    
    // 載入系統通知
    state.notifications = getLocal("notifications", [
      {
        id: "notif-1",
        type: "friend_request",
        senderId: "datong456",
        senderName: "大同",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        text: "請求加您為好友",
        status: "pending",
        time: "2026-06-06 00:30"
      },
      {
        id: "notif-2",
        type: "comment",
        senderName: "阿明",
        senderAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        postId: "post-1",
        text: "在您的貼文『夏日向日葵花海隨筆』發表了新留言",
        commentText: "👍",
        status: "unread",
        time: "2026-06-06 00:34"
      },
      {
        id: "notif-3",
        type: "comment",
        senderName: "小華",
        senderAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        postId: "post-1",
        text: "在您的貼文『夏日向日葵花海隨筆』發表了新留言",
        commentText: "這張照片拍得太美了！🌻",
        status: "unread",
        time: "2026-06-06 00:38"
      }
    ]);
    updateNotificationsCount();
    
    // 更新網頁標題與個人介紹
    updateBlogInfoUI();
  }

  // 儲存特定資料到 localStorage
  function saveToLocal(key, data) {
    localStorage.setItem(`renata_blog_${key}`, JSON.stringify(data));
  }

  function updateBlogInfoUI() {
    const avatarEl = document.getElementById("blog-owner-avatar");
    const ownerIdEl = document.getElementById("blog-owner-id");
    
    if (state.activeProfile) {
      const friend = state.activeProfile;
      const displayTitle = `${friend.name} 的空間`;
      document.title = `${displayTitle} | ${state.settings.blogSubtitle}`;
      document.getElementById("blog-title-text").textContent = displayTitle;
      document.getElementById("blog-subtitle-text").textContent = "VISITING ROOM";
      
      document.getElementById("blog-owner-name").textContent = friend.name;
      document.getElementById("blog-owner-bio").textContent = friend.social?.status || friend.nickname || "來我的房間逛逛吧！";
      if (avatarEl) {
        avatarEl.src = friend.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150";
      }
      if (ownerIdEl) {
        ownerIdEl.textContent = friend.accountId ? `@${friend.accountId}` : "";
      }
    } else {
      document.title = `${state.settings.blogTitle} | ${state.settings.blogSubtitle}`;
      document.getElementById("blog-title-text").textContent = state.settings.blogTitle;
      document.getElementById("blog-subtitle-text").textContent = state.settings.blogSubtitle;
      
      document.getElementById("blog-owner-name").textContent = state.settings.ownerName;
      document.getElementById("blog-owner-bio").textContent = state.settings.ownerBio;
      if (avatarEl) {
        avatarEl.src = (state.ownerProfile && state.ownerProfile.avatar) ? state.ownerProfile.avatar : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300";
      }
      if (ownerIdEl) {
        const myId = (state.ownerProfile && state.ownerProfile.accountId) ? state.ownerProfile.accountId : "renata123";
        ownerIdEl.textContent = `@${myId}`;
      }
    }

    // 動態調整側邊欄按鈕：在自己的空間時顯示「編輯資訊」與「寫文章」，拜訪他人時轉為「個人資料」並隱藏「寫文章」
    const sideEditBtn = document.getElementById("sidebar-edit-profile-btn");
    const sideWriteBtn = document.getElementById("sidebar-write-post-btn");
    const isMySpace = !state.activeProfile;

    if (sideEditBtn) {
      if (isMySpace) {
        sideEditBtn.innerHTML = '<i class="fa-solid fa-cog"></i> 編輯資訊';
        sideEditBtn.title = "編輯網頁設定與個人檔案";
        sideEditBtn.onclick = (e) => {
          e.preventDefault();
          document.getElementById("edit-settings-btn").click();
        };
      } else {
        sideEditBtn.innerHTML = '<i class="fa-solid fa-address-card"></i> 個人資料';
        sideEditBtn.title = "查看個人活頁卡資料";
        sideEditBtn.onclick = (e) => {
          e.preventDefault();
          navigateTo("visit-view");
          showFriendBook(0); // 直接定位至活頁夾首頁（當前空間主人的個人資料頁）
        };
      }
    }

    if (sideWriteBtn) {
      if (isMySpace) {
        sideWriteBtn.style.display = "";
        sideWriteBtn.onclick = (e) => {
          e.preventDefault();
          document.getElementById("write-post-btn").click();
        };
      } else {
        sideWriteBtn.style.display = "none";
      }
    }
  }

  // 檢查身分：優先檢查網址 query 參數 `?key=...`，次之檢查 localStorage
  function checkRoleFromUrlOrStorage() {
    const urlParams = new URLSearchParams(window.location.search);
    let key = urlParams.get('key') || urlParams.get('code');
    
    if (!key) {
      key = localStorage.getItem("renata_blog_access_key") || "";
    }
    
    verifyKey(key, false); // 靜默驗證，不顯示 alert
  }

  // 驗證金鑰
  function verifyKey(key, showFeedback = true) {
    if (!key) {
      state.role = "visitor";
      state.currentKey = "";
      localStorage.removeItem("renata_blog_access_key");
      return false;
    }

    if (key === state.settings.adminKey) {
      state.role = "admin";
      state.currentKey = key;
      localStorage.setItem("renata_blog_access_key", key);
      if (showFeedback) alert("驗證成功！已解鎖：系統管理員權限");
      return true;
    } else if (key === state.settings.friendKey) {
      state.role = "friend";
      state.currentKey = key;
      localStorage.setItem("renata_blog_access_key", key);
      if (showFeedback) alert("驗證成功！已解鎖：特權好友模式");
      return true;
    } else {
      if (showFeedback) alert("金鑰錯誤，無法解鎖權限。");
      return false;
    }
  }

  // 調整 UI 的權限顯示
  function applyRolePermissions() {
    const badge = document.getElementById("role-badge");
    const badgeText = document.getElementById("role-text");
    const logoutBtn = document.getElementById("logout-btn");
    const noteTextarea = document.getElementById("notebook-textarea");

    badge.className = "role-badge";

    // 判斷當前有效角色：如果正在拜訪好友，強迫顯示一般訪客權限
    const effectiveRole = state.activeProfile ? "visitor" : state.role;

    if (effectiveRole === "admin") {
      badge.classList.add("role-admin");
      badgeText.innerHTML = '<i class="fa-solid fa-user-gear"></i> 系統管理員';
      if (logoutBtn) logoutBtn.style.display = "block";
    } else if (effectiveRole === "friend") {
      badge.classList.add("role-friend");
      badgeText.innerHTML = '<i class="fa-solid fa-user-shield"></i> 特權好友';
      if (logoutBtn) logoutBtn.style.display = "block";
    } else {
      badge.classList.add("role-visitor");
      badgeText.innerHTML = '<i class="fa-solid fa-user-clock"></i> 一般訪客';
      if (logoutBtn) logoutBtn.style.display = "none";
    }

    // 指示3：動態判斷拜訪狀態（state.activeProfile !== null）控制所有編輯組件顯示與否
    const isVisiting = state.activeProfile !== null;
    const hideOrShow = (id, show) => {
      const el = document.getElementById(id);
      if (el) el.style.display = show ? "" : "none";
    };

    hideOrShow("bookshelf-actions", !isVisiting);
    hideOrShow("todo-form", !isVisiting);
    hideOrShow("dvd-rack-actions", !isVisiting);
    hideOrShow("wardrobe-actions", !isVisiting);
    hideOrShow("map-actions", !isVisiting);
    hideOrShow("add-event-btn", !isVisiting);
    hideOrShow("book-detail-actions", !isVisiting);
    hideOrShow("media-detail-actions", !isVisiting);

    // 貼文詳情編輯與刪除操作欄
    const postActionsRow = document.querySelector("#post-detail-view .form-submit-row");
    if (postActionsRow) {
      postActionsRow.style.display = !isVisiting ? "" : "none";
    }

    // 筆記本禁用狀態與說明
    if (noteTextarea) {
      if (isVisiting) {
        noteTextarea.disabled = true;
        document.getElementById("notes-save-status").textContent = "正在拜訪中，唯讀模式";
      } else {
        noteTextarea.disabled = false;
        document.getElementById("notes-save-status").textContent = "隨手筆記：自動儲存中";
      }
    }

    // 留言表單永遠開放（包含拜訪模式）
    hideOrShow("post-comment-form", true);

    // 控制「拜訪中」橫幅的顯示
    const visitBanner = document.getElementById("visiting-banner");
    const visitingName = document.getElementById("visiting-name");
    if (visitBanner) {
      if (state.activeProfile) {
        visitBanner.style.display = "block";
        if (visitingName) visitingName.textContent = state.activeProfile.name;
      } else {
        visitBanner.style.display = "none";
      }
    }
    
    renderCurrentView();
  }

  // ==========================================================================
  // 3. 視圖切換與導覽 (Navigation Router)
  // ==========================================================================
  function navigateTo(viewId) {
    state.currentView = viewId;
    
    document.querySelectorAll(".view-panel").forEach(panel => {
      panel.style.display = "none";
    });
    
    const targetPanel = document.getElementById(viewId);
    if (targetPanel) {
      targetPanel.style.display = "block";
    }

    const leftCol = document.getElementById("left-column");
    const rightCol = document.getElementById("right-column");
    const mainGrid = document.getElementById("main-grid");

    if (viewId === "home-view" || viewId === "post-detail-view") {
      leftCol.style.display = "";
      rightCol.style.display = "";
      mainGrid.classList.add("three-column-layout");
      mainGrid.classList.remove("single-column-layout");
      document.getElementById("center-column").style.gridColumn = "span 1";
    } else {
      leftCol.style.display = "none";
      rightCol.style.display = "none";
      mainGrid.classList.remove("three-column-layout");
      mainGrid.classList.add("single-column-layout");
      document.getElementById("center-column").style.gridColumn = "span 1";
    }

    if (viewId === "map-view") {
      setTimeout(initLeafletMap, 100);
    }
    
    if (viewId === "calendar-view") {
      renderCalendar();
    }

    renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderCurrentView() {
    switch (state.currentView) {
      case "home-view":
        renderHomeView();
        break;
      case "post-detail-view":
        renderPostDetailView();
        break;
      case "notes-view":
        renderNotesView();
        break;
      case "bookshelf-view":
        renderBookshelfView();
        break;
      case "todo-view":
        renderTodoView();
        break;
      case "dvd-rack-view":
        renderDvdRackView();
        break;
      case "wardrobe-view":
        renderWardrobeView();
        break;
      case "map-view":
        renderMapView();
        break;
      case "calendar-view":
        renderCalendar();
        break;
      case "visit-view":
        renderVisitView();
        break;
    }
  }

  // ==========================================================================
  // 4. 首頁渲染 (Home View Renders)
  // ==========================================================================
  function renderHomeView() {
    const viewablePosts = getFilteredPostsByRole();
    const latestPost = viewablePosts[0];
    const featuredBox = document.getElementById("featured-post-box");

    // 4.1 左欄 - 最新貼文大圖卡
    if (latestPost) {
      featuredBox.innerHTML = `
        <img src="${latestPost.image || 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800'}" alt="${latestPost.title}" class="featured-post-img">
        <div class="featured-post-overlay">
          <h3 class="featured-post-title">${latestPost.title}</h3>
        </div>
      `;
      featuredBox.onclick = () => showPostDetail(latestPost.id);
      featuredBox.style.cursor = "pointer";
    } else {
      featuredBox.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-light);">暫無貼文</div>`;
      featuredBox.onclick = null;
    }

    // 4.2 左欄 - 放貼文類別[衣櫃]的所有貼文 (推薦信息)
    const wardrobePosts = viewablePosts.filter(p => p.category === "衣櫃");
    const wardrobeBox = document.getElementById("wardrobe-posts-box");
    wardrobeBox.innerHTML = "";
    if (wardrobePosts.length > 0) {
      wardrobePosts.forEach(post => {
        const li = document.createElement("li");
        li.className = "wardrobe-post-item";
        li.innerHTML = `
          <img src="${post.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100'}" alt="${post.title}" class="wardrobe-post-thumb">
          <div class="wardrobe-post-info">
            <h4 class="wardrobe-post-title">${post.title}</h4>
            <span class="wardrobe-post-date">${post.date.substring(5, 10)}</span>
          </div>
        `;
        li.onclick = () => showPostDetail(post.id);
        wardrobeBox.appendChild(li);
      });
    } else {
      wardrobeBox.innerHTML = `<li style="padding: 10px; color: var(--text-light); text-align: center; font-size: 12px;">暫無衣櫃貼文</li>`;
    }

    // 4.3 中欄 - 渲染主要貼文列表 (文字標題排版，帶分類字眼如 [衣櫃])
    const mainList = document.getElementById("main-posts-list");
    mainList.innerHTML = "";

    let displayPosts = viewablePosts;
    if (state.currentCategoryFilter !== "all") {
      displayPosts = displayPosts.filter(p => p.category === state.currentCategoryFilter);
    }
    if (state.currentSubCategoryFilter) {
      displayPosts = displayPosts.filter(p => p.subcategory === state.currentSubCategoryFilter);
    }

    const listTitle = document.getElementById("list-title");
    const postCount = document.getElementById("post-count");
    if (state.currentCategoryFilter === "all") {
      listTitle.textContent = "所有貼文隨筆";
    } else {
      listTitle.textContent = `${state.currentCategoryFilter}${state.currentSubCategoryFilter ? ' > ' + state.currentSubCategoryFilter : ''} 的文章`;
    }
    postCount.textContent = `共 ${displayPosts.length} 篇`;

    if (displayPosts.length > 0) {
      displayPosts.forEach(post => {
        const item = document.createElement("div");
        item.className = "post-item";
        
        const privateBadge = post.isPrivate ? `<span class="post-private-badge">[限好友]</span>` : "";

        item.innerHTML = `
          <div class="post-body">
            <span class="post-category-tag">[${post.subcategory}]</span>
            <span class="post-title">${post.title}</span>
            ${privateBadge}
          </div>
          <div class="post-meta">
            <span>${post.date.substring(5, 10)}</span>
          </div>
        `;
        item.onclick = () => showPostDetail(post.id);
        mainList.appendChild(item);
      });
    } else {
      mainList.innerHTML = `<div style="padding: 40px 0; text-align: center; color: var(--text-light);"><i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.3;"></i><br>目前分類下沒有符合權限的貼文喔！</div>`;
    }

    // 4.4 右欄 - 熱門推薦 (今日推薦，顯示紅頭排版)
    const popularBox = document.getElementById("popular-posts-box");
    popularBox.innerHTML = "";
    const popularPosts = viewablePosts.slice(0, 8); // 展示 8 篇
    if (popularPosts.length > 0) {
      popularPosts.forEach((post, index) => {
        const li = document.createElement("li");
        li.className = "hot-item";
        li.innerHTML = `
          <span class="hot-index">[${index + 1}]</span>
          <span class="hot-text">[${post.subcategory}] ${post.title}</span>
        `;
        li.onclick = () => showPostDetail(post.id);
        popularBox.appendChild(li);
      });
    } else {
      popularBox.innerHTML = `<li style="padding: 10px; text-align: center; color: var(--text-light); font-size: 12px;">暫無推薦</li>`;
    }

    // 更新藍色橫條 active 狀態
    document.querySelectorAll("#blue-nav-menu .blue-nav-item").forEach(li => {
      if (li.getAttribute("data-tab") === state.currentCategoryFilter) {
        li.classList.add("active");
      } else {
        li.classList.remove("active");
      }
    });
  }

  function getFilteredPostsByRole() {
    let list = state.activeProfile ? [...(state.activeProfile.posts || [])] : [...state.posts];
    if (state.role === "visitor") {
      list = list.filter(p => !p.isPrivate);
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }

  // ==========================================================================
  // 5. 貼文詳情頁 (Post Detail View Renders)
  // ==========================================================================
  function showPostDetail(postId) {
    state.currentPostId = postId;
    const postsSource = state.activeProfile ? (state.activeProfile.posts || []) : state.posts;
    const post = postsSource.find(p => p.id === postId);
    if (post && !state.activeProfile) {
      post.views = (post.views || 0) + 1;
      saveToLocal("posts", state.posts);
    }
    navigateTo("post-detail-view");
  }

  function renderPostDetailView() {
    const postsSource = state.activeProfile ? (state.activeProfile.posts || []) : state.posts;
    const post = postsSource.find(p => p.id === state.currentPostId);
    if (!post) {
      navigateTo("home-view");
      return;
    }

    if (post.isPrivate && state.role === "visitor") {
      alert("此文章為私密貼文，請先使用金鑰驗證登入。");
      navigateTo("home-view");
      return;
    }

    document.getElementById("post-breadcrumbs").innerHTML = `
      <a href="#" class="breadcrumb-home">首頁</a> &gt; 
      <a href="#" class="breadcrumb-cat" data-cat="${post.category}">${post.category}</a> &gt; 
      <span class="breadcrumb-sub" data-cat="${post.category}" data-sub="${post.subcategory}">${post.subcategory}</span> &gt; 正文
    `;
    
    document.querySelector(".breadcrumb-home").onclick = (e) => {
      e.preventDefault();
      state.currentCategoryFilter = "all";
      state.currentSubCategoryFilter = null;
      navigateTo("home-view");
    };
    document.querySelector(".breadcrumb-cat").onclick = (e) => {
      e.preventDefault();
      state.currentCategoryFilter = post.category;
      state.currentSubCategoryFilter = null;
      navigateTo("home-view");
    };
    document.querySelector(".breadcrumb-sub").onclick = (e) => {
      e.preventDefault();
      state.currentCategoryFilter = post.category;
      state.currentSubCategoryFilter = post.subcategory;
      navigateTo("home-view");
    };

    document.getElementById("post-detail-title").textContent = post.title;
    document.getElementById("post-detail-date").textContent = post.date;
    document.getElementById("post-detail-author").textContent = post.author || "雷娜塔";
    document.getElementById("post-detail-views").textContent = post.views || 1;
    
    const privacyTag = document.getElementById("post-detail-privacy-tag");
    if (post.isPrivate) {
      privacyTag.style.display = "";
    } else {
      privacyTag.style.display = "none";
    }

    document.getElementById("post-detail-summary").innerHTML = `<strong>核心提示：</strong>${post.summary}`;
    
    const detailImg = document.getElementById("post-detail-image");
    if (post.image) {
      detailImg.src = post.image;
      detailImg.style.display = "";
    } else {
      detailImg.style.display = "none";
    }

    document.getElementById("post-detail-content").innerHTML = post.content;

    const tagsBox = document.getElementById("post-detail-tags");
    tagsBox.innerHTML = "";
    if (post.tags && post.tags.length > 0) {
      post.tags.forEach(tag => {
        const span = document.createElement("span");
        span.className = "article-tag-item";
        span.innerHTML = `<i class="fa-solid fa-tag"></i> ${tag}`;
        tagsBox.appendChild(span);
      });
    }

    const viewableList = getFilteredPostsByRole();
    const currIndex = viewableList.findIndex(p => p.id === post.id);

    const prevBtn = document.getElementById("prev-post-btn");
    const nextBtn = document.getElementById("next-post-btn");

    if (currIndex !== -1 && currIndex < viewableList.length - 1) {
      const prevPost = viewableList[currIndex + 1];
      prevBtn.innerHTML = `上一篇：${prevPost.title}`;
      prevBtn.onclick = (e) => {
        e.preventDefault();
        showPostDetail(prevPost.id);
      };
      prevBtn.style.display = "";
    } else {
      prevBtn.innerHTML = "上一篇：沒有了";
      prevBtn.onclick = (e) => e.preventDefault();
    }

    if (currIndex > 0) {
      const nextPost = viewableList[currIndex - 1];
      nextBtn.innerHTML = `下一篇：${nextPost.title}`;
      nextBtn.onclick = (e) => {
        e.preventDefault();
        showPostDetail(nextPost.id);
      };
      nextBtn.style.display = "";
    } else {
      nextBtn.innerHTML = "下一篇：沒有了";
      nextBtn.onclick = (e) => e.preventDefault();
    }

    // 5 篇推薦文章網格
    const recommendBox = document.getElementById("recommend-grid-box");
    recommendBox.innerHTML = "";
    const filterRecs = viewableList.filter(p => p.id !== post.id);
    const shuffled = filterRecs.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    if (shuffled.length > 0) {
      shuffled.forEach(rec => {
        const card = document.createElement("div");
        card.className = "recommend-card";
        card.innerHTML = `
          <img src="${rec.image || 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=150'}" alt="${rec.title}" class="recommend-card-img">
          <h4 class="recommend-card-title">${rec.title}</h4>
        `;
        card.onclick = () => showPostDetail(rec.id);
        recommendBox.appendChild(card);
      });
    } else {
      recommendBox.innerHTML = `<div style="grid-column: span 5; color: var(--text-light); text-align: center; padding: 20px;">目前沒有其他推薦貼文</div>`;
    }

    // 渲染留言列表 (Page 7)
    renderCommentsList(post);
  }

  // ==========================================================================
  // 6. 書櫃 - 筆記本邏輯 (Bookcase Notes)
  // ==========================================================================
  function renderNotesView() {
    const area = document.getElementById("notebook-textarea");
    area.value = state.activeProfile ? "正在拜訪中，無法檢視他人備忘錄。" : state.notes;
  }

  function saveNotes() {
    if (state.activeProfile) return; // 拜訪中不允許編輯他人備忘
    const val = document.getElementById("notebook-textarea").value;
    state.notes = val;
    localStorage.setItem("renata_blog_notes", val);
  }

  // ==========================================================================
  // 7. 書櫃 - 書架邏輯 (Bookshelf View)
  // ==========================================================================
  function renderBookshelfView() {
    const shelfRoom = document.getElementById("bookshelf-room");
    shelfRoom.innerHTML = "";
    
    const books = state.activeProfile ? (state.activeProfile.books || []) : state.books;
    const booksPerRow = 4;
    const rowsCount = Math.max(2, Math.ceil(books.length / booksPerRow));
    
    for (let r = 0; r < rowsCount; r++) {
      const shelfRow = document.createElement("div");
      shelfRow.className = "shelf-row";
      
      const rowBooks = books.slice(r * booksPerRow, (r + 1) * booksPerRow);
      rowBooks.forEach(book => {
        const bookDiv = document.createElement("div");
        bookDiv.className = "shelf-book";
        bookDiv.innerHTML = `<img src="${book.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150'}" class="shelf-book-cover" alt="${book.title}" title="${book.title}">`;
        
        bookDiv.onclick = () => showBookDetail(book.id);
        shelfRow.appendChild(bookDiv);
      });
      
      shelfRoom.appendChild(shelfRow);
    }
  }

  function showBookDetail(bookId) {
    const booksSource = state.activeProfile ? (state.activeProfile.books || []) : state.books;
    const book = booksSource.find(b => b.id === bookId);
    if (!book) return;

    document.getElementById("book-info-cover").src = book.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150';
    document.getElementById("book-info-title").textContent = book.title;
    document.getElementById("book-info-author").textContent = book.author;
    document.getElementById("book-info-desc").textContent = book.description || "暫無簡介。";
    document.getElementById("book-info-thoughts").textContent = book.thoughts || "暫無讀後心得。";

    // 編輯按鈕點擊綁定
    const editBtn = document.getElementById("edit-book-btn");
    editBtn.onclick = () => {
      closeModal("book-detail-modal");
      document.getElementById("edit-book-id").value = book.id;
      document.getElementById("book-title").value = book.title;
      document.getElementById("book-author").value = book.author;
      document.getElementById("book-cover").value = book.cover || "";
      document.getElementById("book-desc").value = book.description || "";
      document.getElementById("book-thoughts").value = book.thoughts || "";
      document.getElementById("book-editor-form-title").textContent = "編輯書籍資訊";
      document.getElementById("book-editor-submit-btn").textContent = "儲存修改";
      showModal("book-editor-modal");
    };

    const delBtn = document.getElementById("delete-book-btn");
    delBtn.onclick = () => deleteBook(book.id);

    showModal("book-detail-modal");
  }

  function deleteBook(bookId) {
    if (state.activeProfile) return;
    if (confirm("確定要把這本書從書架移除嗎？")) {
      state.books = state.books.filter(b => b.id !== bookId);
      saveToLocal("books", state.books);
      closeModal("book-detail-modal");
      renderBookshelfView();
    }
  }

  // ==========================================================================
  // 8. 書櫃 - 待辦清單邏輯 (Todo View)
  // ==========================================================================
  function renderTodoView() {
    const box = document.getElementById("todo-list-box");
    box.innerHTML = "";

    const todos = state.activeProfile ? [] : state.todos;
    if (todos.length === 0) {
      box.innerHTML = `<div style="text-align: center; color: var(--text-light); padding: 20px;">${state.activeProfile ? '正在拜訪中，無法檢視他人待辦事項。' : '清空囉！無待辦事項。'}</div>`;
      updateTodoProgress(0);
      return;
    }

    let completedCount = 0;
    todos.forEach(todo => {
      if (todo.completed) completedCount++;

      const li = document.createElement("li");
      li.className = `todo-item-row ${todo.completed ? 'completed' : ''}`;
      
      const disabledAttr = state.activeProfile ? "disabled" : "";
      const deleteIcon = (!state.activeProfile) ? `<button class="todo-delete-btn" data-id="${todo.id}"><i class="fa-solid fa-trash"></i></button>` : "";
      const editIcon = (!state.activeProfile) ? `<button class="todo-edit-btn" data-id="${todo.id}" style="background:transparent; border:none; color:var(--primary-dark); cursor:pointer; margin-left:6px;" title="編輯此待辦"><i class="fa-solid fa-pen" style="font-size:10px;"></i></button>` : "";

      li.innerHTML = `
        <div class="todo-item-left" style="display:flex; align-items:center; gap:8px; width:80%;">
          <input type="checkbox" class="todo-checkbox" data-id="${todo.id}" ${todo.completed ? 'checked' : ''} ${disabledAttr}>
          <span class="todo-text" data-id="${todo.id}">${todo.text}</span>
          ${editIcon}
        </div>
        ${deleteIcon}
      `;
      
      box.appendChild(li);
    });

    const progress = Math.round((completedCount / todos.length) * 100);
    updateTodoProgress(progress);

    if (!state.activeProfile) {
      box.querySelectorAll(".todo-checkbox").forEach(chk => {
        chk.onchange = (e) => {
          const id = e.target.getAttribute("data-id");
          const item = state.todos.find(t => t.id === id);
          if (item) {
            item.completed = e.target.checked;
            saveToLocal("todos", state.todos);
            renderTodoView();
          }
        };
      });

      box.querySelectorAll(".todo-delete-btn").forEach(btn => {
        btn.onclick = (e) => {
          const id = btn.getAttribute("data-id");
          state.todos = state.todos.filter(t => t.id !== id);
          saveToLocal("todos", state.todos);
          renderTodoView();
        };
      });

      // 行內雙擊編輯或點小鉛筆編輯待辦事項
      const startInlineEdit = (id) => {
        const textSpan = box.querySelector(`.todo-text[data-id="${id}"]`);
        if (!textSpan || textSpan.getAttribute("contenteditable") === "true") return;

        textSpan.setAttribute("contenteditable", "true");
        textSpan.focus();
        
        // 選中文字
        const range = document.createRange();
        range.selectNodeContents(textSpan);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        const saveEdit = () => {
          textSpan.removeAttribute("contenteditable");
          const newText = textSpan.textContent.trim();
          if (newText) {
            const item = state.todos.find(t => t.id === id);
            if (item) {
              item.text = newText;
              saveToLocal("todos", state.todos);
            }
          }
          renderTodoView();
        };

        textSpan.onblur = saveEdit;
        textSpan.onkeydown = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            saveEdit();
          }
        };
      };

      box.querySelectorAll(".todo-text").forEach(span => {
        span.ondblclick = () => {
          const id = span.getAttribute("data-id");
          startInlineEdit(id);
        };
      });

      box.querySelectorAll(".todo-edit-btn").forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const id = btn.getAttribute("data-id");
          startInlineEdit(id);
        };
      });
    }
  }

  function updateTodoProgress(percent) {
    document.getElementById("todo-progress").textContent = `${percent}% 已完成`;
  }

  // ==========================================================================
  // 9. DVD/CD 架子邏輯 (CD/DVD cases horizontal overlapping shelf)
  // ==========================================================================
  function renderDvdRackView() {
    const grid = document.getElementById("dvd-rack-grid");
    grid.innerHTML = "";

    let displayMedia = state.activeProfile ? (state.activeProfile.media || []) : state.media;
    if (state.mediaTypeFilter !== "all") {
      displayMedia = displayMedia.filter(m => m.type === state.mediaTypeFilter);
    }

    if (displayMedia.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 40px 0;">暫無收藏影音項目</div>`;
      return;
    }

    displayMedia.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "media-case-wrapper";
      
      const isMusic = item.type === "music";
      const cover = item.cover || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150';

      card.innerHTML = `
        <div class="media-case ${isMusic ? 'media-case-cd' : 'media-case-dvd'}">
          <div class="media-box-item">
            <img src="${cover}" alt="${item.title}" title="點選查看詳情">
          </div>
        </div>
        <div class="media-info-text">
          <div class="media-item-title">${item.title}</div>
          <div class="media-item-meta">${item.type === 'movie' ? '電影' : item.type === 'game' ? '遊戲' : '音樂'} · ${item.year}</div>
        </div>
      `;
      
      card.onclick = () => showMediaDetail(item.id);
      grid.appendChild(card);
    });
  }

  function showMediaDetail(mediaId) {
    const mediaSource = state.activeProfile ? (state.activeProfile.media || []) : state.media;
    const item = mediaSource.find(m => m.id === mediaId);
    if (!item) return;

    const coverImg = document.getElementById("media-info-cover");
    coverImg.src = item.cover || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150';
    
    if (item.type === "music") {
      coverImg.style.aspectRatio = "1/1";
      coverImg.style.height = "140px";
    } else {
      coverImg.style.aspectRatio = "13/19";
      coverImg.style.height = "180px";
    }

    document.getElementById("media-info-title").textContent = item.title;
    document.getElementById("media-info-year").textContent = `${item.year} 年發行`;
    document.getElementById("media-info-desc").textContent = item.description || "暫無簡介。";

    // 渲染星星與評語 (Page 5)
    const rating = item.rating || 0;
    const starsBox = document.getElementById("media-info-stars");
    starsBox.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("i");
      star.className = i <= rating ? "fa-solid fa-star" : "fa-regular fa-star";
      starsBox.appendChild(star);
    }
    document.getElementById("media-info-comment").textContent = item.comment || "暫無評語。";

    // 編輯按鈕綁定
    const editBtn = document.getElementById("edit-media-btn");
    editBtn.onclick = () => {
      closeModal("media-detail-modal");
      document.getElementById("edit-media-id").value = item.id;
      document.getElementById("media-title").value = item.title;
      document.getElementById("media-type").value = item.type;
      document.getElementById("media-year").value = item.year || "";
      document.getElementById("media-cover").value = item.cover || "";
      document.getElementById("media-desc").value = item.description || "";
      document.getElementById("media-rating-value").value = item.rating || 0;
      updateMediaEditorStars(item.rating || 0);
      document.getElementById("media-comment").value = item.comment || "";
      document.getElementById("media-editor-form-title").textContent = "編輯影音收藏";
      document.getElementById("media-editor-submit-btn").textContent = "儲存修改";
      showModal("media-editor-modal");
    };

    const delBtn = document.getElementById("delete-media-btn");
    delBtn.onclick = () => deleteMedia(item.id);

    showModal("media-detail-modal");
  }

  function deleteMedia(mediaId) {
    if (state.activeProfile) return;
    if (confirm("確定要刪除這個收藏項目嗎？")) {
      state.media = state.media.filter(m => m.id !== mediaId);
      saveToLocal("media", state.media);
      closeModal("media-detail-modal");
      renderDvdRackView();
    }
  }

  // ==========================================================================
  // 10. 衣櫃邏輯 (Wardrobe View)
  // ==========================================================================
  function renderWardrobeView() {
    const wardrobeSource = state.activeProfile ? (state.activeProfile.wardrobeItems || []) : state.wardrobeItems;
    
    // 渲染衣服 (Clothes)
    const clothesBox = document.getElementById("closet-clothes-rack");
    clothesBox.innerHTML = "";
    const clothes = wardrobeSource.filter(i => i.type === "clothes");
    
    if (clothes.length === 0) {
      clothesBox.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 40px 0;">暫無衣服收藏</div>`;
    } else {
      clothes.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "media-case-wrapper";
        
        const cover = item.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150';
        const deleteIcon = (state.role === "admin" && !state.activeProfile) ? `<button class="todo-delete-btn" style="position: absolute; top: 4px; right: 4px; z-index: 10; background: rgba(255,255,255,0.8); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;" onclick="event.stopPropagation(); window.deleteWardrobeItem('${item.id}');"><i class="fa-solid fa-trash" style="color: var(--danger-color); font-size: 10px;"></i></button>` : "";

        card.innerHTML = `
          <div class="media-case media-case-dvd" style="position: relative;">
            ${deleteIcon}
            <div class="media-box-item">
              <img src="${cover}" alt="${item.title}" title="點選查看詳情">
            </div>
          </div>
          <div class="media-info-text">
            <div class="media-item-title">${item.title}</div>
            <div class="media-item-meta">${item.desc || '衣物'}</div>
          </div>
        `;
        
        card.onclick = () => showWardrobeDetail(item);
        clothesBox.appendChild(card);
      });
    }

    // 渲染鞋子 (Shoes)
    const shoesBox = document.getElementById("closet-shoes-rack");
    shoesBox.innerHTML = "";
    const shoes = wardrobeSource.filter(i => i.type === "shoes");

    if (shoes.length === 0) {
      shoesBox.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 40px 0;">暫無鞋子收藏</div>`;
    } else {
      shoes.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "media-case-wrapper";

        const cover = item.image || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150';
        const deleteIcon = (state.role === "admin" && !state.activeProfile) ? `<button class="todo-delete-btn" style="position: absolute; top: 4px; right: 4px; z-index: 10; background: rgba(255,255,255,0.8); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;" onclick="event.stopPropagation(); window.deleteWardrobeItem('${item.id}');"><i class="fa-solid fa-trash" style="color: var(--danger-color); font-size: 10px;"></i></button>` : "";

        card.innerHTML = `
          <div class="media-case media-case-cd" style="position: relative;">
            ${deleteIcon}
            <div class="media-box-item">
              <img src="${cover}" alt="${item.title}" title="點選查看詳情">
            </div>
          </div>
          <div class="media-info-text">
            <div class="media-item-title">${item.title}</div>
            <div class="media-item-meta">${item.desc || '鞋履'}</div>
          </div>
        `;

        card.onclick = () => showWardrobeDetail(item);
        shoesBox.appendChild(card);
      });
    }

    // 渲染飾品 (Accessories)
    const jewelryBox = document.getElementById("closet-jewelry-box");
    jewelryBox.innerHTML = "";
    const accessories = wardrobeSource.filter(i => i.type === "accessories");

    if (accessories.length === 0) {
      jewelryBox.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 40px 0;">暫無飾品收藏</div>`;
    } else {
      accessories.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "media-case-wrapper";

        const cover = item.image || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150';
        const deleteIcon = (state.role === "admin" && !state.activeProfile) ? `<button class="todo-delete-btn" style="position: absolute; top: 4px; right: 4px; z-index: 10; background: rgba(255,255,255,0.8); border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;" onclick="event.stopPropagation(); window.deleteWardrobeItem('${item.id}');"><i class="fa-solid fa-trash" style="color: var(--danger-color); font-size: 10px;"></i></button>` : "";

        card.innerHTML = `
          <div class="media-case media-case-cd" style="position: relative;">
            ${deleteIcon}
            <div class="media-box-item">
              <img src="${cover}" alt="${item.title}" title="點選查看詳情">
            </div>
          </div>
          <div class="media-info-text">
            <div class="media-item-title">${item.title}</div>
            <div class="media-item-meta">${item.desc || '配飾'}</div>
          </div>
        `;

        card.onclick = () => showWardrobeDetail(item);
        jewelryBox.appendChild(card);
      });
    }
  }

  // 顯示衣櫃收藏詳情的輔助函式
  function showWardrobeDetail(item) {
    const coverImg = document.getElementById("media-info-cover");
    coverImg.src = item.image;
    
    if (item.type === "clothes") {
      coverImg.style.aspectRatio = "13/19";
      coverImg.style.height = "180px";
    } else {
      coverImg.style.aspectRatio = "1/1";
      coverImg.style.height = "140px";
    }

    document.getElementById("media-info-title").textContent = item.title;
    // 品牌展示 (Page 6)
    document.getElementById("media-info-year").textContent = `${item.brand || '無品牌'} · ${item.type === "clothes" ? '衣服' : item.type === "shoes" ? '鞋子' : '飾品'}`;
    document.getElementById("media-info-desc").textContent = item.desc || "暫無備註。";

    // 星星與評語在衣物展示時隱藏
    document.getElementById("media-info-stars").innerHTML = "";
    document.getElementById("media-info-comment-box").style.display = "none";

    // 編輯與刪除綁定
    const editBtn = document.getElementById("edit-media-btn");
    editBtn.onclick = () => {
      closeModal("media-detail-modal");
      document.getElementById("edit-w-id").value = item.id;
      document.getElementById("w-title").value = item.title;
      document.getElementById("w-brand").value = item.brand || "";
      document.getElementById("w-type").value = item.type;
      document.getElementById("w-image").value = item.image || "";
      document.getElementById("w-desc").value = item.desc || "";
      document.getElementById("wardrobe-editor-form-title").textContent = "編輯收藏品資訊";
      document.getElementById("wardrobe-editor-submit-btn").textContent = "儲存修改";
      showModal("wardrobe-editor-modal");
    };

    const delBtn = document.getElementById("delete-media-btn");
    delBtn.onclick = () => {
      if (state.activeProfile) return;
      if (confirm("確定要將此物品從衣櫃移除嗎？")) {
        state.wardrobeItems = state.wardrobeItems.filter(i => i.id !== item.id);
        saveToLocal("wardrobe_items", state.wardrobeItems);
        closeModal("media-detail-modal");
        renderWardrobeView();
      }
    };

    showModal("media-detail-modal");
  }

  window.deleteWardrobeItem = function(itemId) {
    if (state.activeProfile) return;
    if (confirm("確定要將此物品從衣櫃移除嗎？")) {
      state.wardrobeItems = state.wardrobeItems.filter(i => i.id !== itemId);
      saveToLocal("wardrobe_items", state.wardrobeItems);
      renderWardrobeView();
    }
  };

  // ==========================================================================
  // 11. 外出 - 地圖邏輯 (Outing Map View using Leaflet & OpenStreetMap)
  // ==========================================================================
  function initLeafletMap() {
    if (leafletMap) {
      leafletMap.invalidateSize();
      return;
    }

    leafletMap = L.map('leaflet-map-container').setView([23.9739, 120.9820], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);

    renderMapMarkers();
  }

  function renderMapMarkers() {
    if (!leafletMap) return;

    mapMarkers.forEach(marker => leafletMap.removeLayer(marker));
    mapMarkers = [];

    const spots = state.activeProfile ? [] : state.spots;
    spots.forEach(spot => {
      const marker = L.marker([spot.lat, spot.lng]).addTo(leafletMap);
      const deleteBtn = (state.role === "admin" && !state.activeProfile) ? `<br><button class="btn btn-danger" style="padding: 2px 6px; font-size: 11px; margin-top: 6px; width: 100%;" onclick="window.deleteMapSpot('${spot.id}')"><i class="fa-solid fa-trash"></i> 刪除景點</button>` : "";
      
      marker.bindPopup(`
        <div style="font-family: var(--font-main); font-size:12px;">
          <strong style="font-size: 13px; color: var(--text-dark);">${spot.name}</strong>
          <p style="color: var(--text-light); margin-top: 4px;">${spot.desc}</p>
          ${deleteBtn}
        </div>
      `);
      
      marker.spotId = spot.id;
      mapMarkers.push(marker);
    });
  }

  function renderMapView() {
    const list = document.getElementById("map-spot-list");
    list.innerHTML = "";

    const spots = state.activeProfile ? [] : state.spots;
    if (spots.length === 0) {
      list.innerHTML = `<div style="text-align: center; color: var(--text-light); padding: 20px;">${state.activeProfile ? '正在拜訪中，無法檢視他人足跡。' : '尚無記錄的景點。'}</div>`;
      return;
    }

    spots.forEach(spot => {
      const item = document.createElement("div");
      item.className = "map-spot-item";
      item.innerHTML = `
        <div class="map-spot-name">${spot.name}</div>
        <div class="map-spot-desc">${spot.desc.substring(0, 24)}${spot.desc.length > 24 ? '...' : ''}</div>
      `;
      
      item.onclick = () => {
        list.querySelectorAll(".map-spot-item").forEach(el => el.classList.remove("active"));
        item.classList.add("active");

        if (leafletMap) {
          leafletMap.setView([spot.lat, spot.lng], 13);
          const marker = mapMarkers.find(m => m.spotId === spot.id);
          if (marker) {
            marker.openPopup();
          }
        }
      };
      
      list.appendChild(item);
    });
  }

  window.deleteMapSpot = function(spotId) {
    if (state.activeProfile) return;
    if (confirm("確定要刪除這個地圖景點嗎？")) {
      state.spots = state.spots.filter(s => s.id !== spotId);
      saveToLocal("spots", state.spots);
      renderMapMarkers();
      renderMapView();
    }
  };

  // ==========================================================================
  // 12. 外出 - 活動行事曆與行程邏輯 (Calendar View)
  // ==========================================================================
  function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    grid.innerHTML = "";

    const year = state.calendarYear;
    const month = state.calendarMonth;

    document.getElementById("calendar-month-year").textContent = `${year} 年 ${month + 1} 月`;

    const dayLabels = ["日", "一", "二", "三", "四", "五", "六"];
    dayLabels.forEach(label => {
      const lbl = document.createElement("div");
      lbl.className = "calendar-day-label";
      lbl.textContent = label;
      grid.appendChild(lbl);
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const cell = createCalendarCell(year, month - 1, dayNum, true);
      grid.appendChild(cell);
    }

    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      const cell = createCalendarCell(year, month, day, false, isToday);
      grid.appendChild(cell);
    }

    const filledCells = firstDayIndex + totalDays;
    const remainingCells = 42 - filledCells;
    for (let day = 1; day <= remainingCells; day++) {
      const cell = createCalendarCell(year, month + 1, day, true);
      grid.appendChild(cell);
    }

    renderUpcomingEventsList();
  }

  function createCalendarCell(year, month, day, isOtherMonth, isToday = false) {
    let cellDateObj = new Date(year, month, day);
    const dateStr = formatDateString(cellDateObj);

    const cell = document.createElement("div");
    cell.className = `calendar-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;
    
    cell.innerHTML = `
      <span class="calendar-cell-num">${day}</span>
      <div class="calendar-cell-events"></div>
    `;

    const dayEvents = state.activeProfile ? [] : state.events.filter(e => e.date === dateStr);
    const eventsBox = cell.querySelector(".calendar-cell-events");
    dayEvents.forEach(evt => {
      const dot = document.createElement("div");
      dot.className = "calendar-event-dot";
      dot.textContent = evt.title;
      dot.title = `${evt.title}: ${evt.desc || ''}`;
      eventsBox.appendChild(dot);
    });

    cell.onclick = () => {
      if (!state.activeProfile) {
        document.getElementById("event-date").value = dateStr;
        showModal("event-editor-modal");
      } else {
        if (dayEvents.length > 0) {
          let listStr = dayEvents.map(e => `【${e.title}】\n${e.desc || '無備忘'}`).join('\n\n');
          alert(`${dateStr} 的行程活動：\n\n${listStr}`);
        }
      }
    };

    return cell;
  }

  function formatDateString(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function renderUpcomingEventsList() {
    const list = document.getElementById("upcoming-events-list");
    list.innerHTML = "";

    const todayStr = formatDateString(new Date());
    const upcoming = state.activeProfile ? [] : state.events
      .filter(e => e.date >= todayStr)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcoming.length === 0) {
      list.innerHTML = `<div style="text-align: center; color: var(--text-light); padding: 12px; font-size: 12px;">${state.activeProfile ? '正在拜訪中，無法檢視他人行程。' : '近期沒有安排行程。'}</div>`;
      return;
    }

    upcoming.forEach(evt => {
      const div = document.createElement("div");
      div.className = "event-item";
      
      const deleteIcon = (!state.activeProfile) ? `<button class="todo-delete-btn" style="float: right; margin-top:-2px;" onclick="window.deleteCalendarEvent('${evt.id}')"><i class="fa-solid fa-trash"></i></button>` : "";
      
      div.innerHTML = `
        ${deleteIcon}
        <span class="event-date"><i class="fa-regular fa-clock"></i> ${evt.date}</span>
        <h4 class="event-title">${evt.title}</h4>
        <p style="font-size: 11px; color: var(--text-light); margin-top: 2px;">${evt.desc || ''}</p>
      `;
      list.appendChild(div);
    });
  }

  window.deleteCalendarEvent = function(eventId) {
    if (state.activeProfile) return;
    if (confirm("確定要刪除這個行程安排嗎？")) {
      state.events = state.events.filter(e => e.id !== eventId);
      saveToLocal("events", state.events);
      renderCalendar();
    }
  };

  // ==========================================================================
  // 13. 資料匯入/匯出處理 (Import / Export module database as data.js)
  // ==========================================================================
  function exportDataJs() {
    const dataJsString = `// 雷娜塔的家 (Renata's Home) - 匯出的最新資料庫
// 儲存於此的資料會作為初始資料載入，並透過 localStorage 進行後續更新

const DEFAULT_BLOG_SETTINGS = ${JSON.stringify(state.settings, null, 2)};

const DEFAULT_POSTS = ${JSON.stringify(state.posts, null, 2)};

const DEFAULT_BOOKS = ${JSON.stringify(state.books, null, 2)};

const DEFAULT_TODOS = ${JSON.stringify(state.todos, null, 2)};

const DEFAULT_NOTES = \`${state.notes.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;

const DEFAULT_MEDIA = ${JSON.stringify(state.media, null, 2)};

const DEFAULT_SPOTS = ${JSON.stringify(state.spots, null, 2)};

const DEFAULT_EVENTS = ${JSON.stringify(state.events, null, 2)};

const DEFAULT_WARDROBE_ITEMS = ${JSON.stringify(state.wardrobeItems, null, 2)};

if (typeof window !== 'undefined') {
  window.DEFAULT_BLOG_SETTINGS = DEFAULT_BLOG_SETTINGS;
  window.DEFAULT_POSTS = DEFAULT_POSTS;
  window.DEFAULT_BOOKS = DEFAULT_BOOKS;
  window.DEFAULT_TODOS = DEFAULT_TODOS;
  window.DEFAULT_NOTES = DEFAULT_NOTES;
  window.DEFAULT_MEDIA = DEFAULT_MEDIA;
  window.DEFAULT_SPOTS = DEFAULT_SPOTS;
  window.DEFAULT_EVENTS = DEFAULT_EVENTS;
  window.DEFAULT_WARDROBE_ITEMS = DEFAULT_WARDROBE_ITEMS;
}
`;

    const blob = new Blob([dataJsString], { type: "application/javascript;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "data.js";
    link.click();
    
    alert("匯出成功！請將下載的 data.js 檔案直接複製覆蓋您網頁資料夾下的原 data.js 檔案。");
  }

  function handleImportFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      try {
        const extractJSON = (varName) => {
          const regex = new RegExp(`const\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\]|\\{[\\s\\S]*?\\});`, 'm');
          const match = content.match(regex);
          if (match && match[1]) {
            return JSON.parse(match[1]);
          }
          return null;
        };

        const parsedSettings = extractJSON("DEFAULT_BLOG_SETTINGS");
        const parsedPosts = extractJSON("DEFAULT_POSTS");
        const parsedBooks = extractJSON("DEFAULT_BOOKS");
        const parsedTodos = extractJSON("DEFAULT_TODOS");
        const parsedMedia = extractJSON("DEFAULT_MEDIA");
        const parsedSpots = extractJSON("DEFAULT_SPOTS");
        const parsedEvents = extractJSON("DEFAULT_EVENTS");
        const parsedWardrobe = extractJSON("DEFAULT_WARDROBE_ITEMS");
        
        const notesRegex = /const\s+DEFAULT_NOTES\s*=\s*`([\s\S]*?)`;/m;
        const notesMatch = content.match(notesRegex);
        const parsedNotes = notesMatch ? notesMatch[1] : null;

        if (!parsedSettings || !parsedPosts) {
          throw new Error("無法辨識為合法的 data.js 格式檔案。");
        }

        const saveLocal = (key, data) => localStorage.setItem(`renata_blog_${key}`, JSON.stringify(data));
        saveLocal("settings", parsedSettings);
        saveLocal("posts", parsedPosts);
        saveLocal("books", parsedBooks || []);
        saveLocal("todos", parsedTodos || []);
        if (parsedNotes !== null) {
          localStorage.setItem("renata_blog_notes", parsedNotes);
        }
        saveLocal("media", parsedMedia || []);
        saveLocal("spots", parsedSpots || []);
        saveLocal("events", parsedEvents || []);
        saveLocal("wardrobe_items", parsedWardrobe || []);

        alert("匯入成功！網頁即將自動重新整理以載入最新資料。");
        window.location.reload();
      } catch (err) {
        alert(`匯入失敗，原因：${err.message}\n請確認您選取的是本網頁產生的 data.js 檔。`);
      }
    };
    reader.readAsText(file);
  }

  // ==========================================================================
  // 14. 事件監聽設定與彈窗互動 (Event Listeners & Modals Control)
  // ==========================================================================
  function setupEventListeners() {
    // 14.1 門戶網頁導覽選單子項目點選 ( category-nav-grid )
    document.querySelectorAll(".nav-grid-child").forEach(link => {
      link.onclick = (e) => {
        e.preventDefault();
        const parent = link.closest(".nav-grid-item").getAttribute("data-category");
        const sub = link.getAttribute("data-sub");
        
        handleNavSelection(parent, sub);
      };
    });

    // 點選父類別本體 (category-nav-grid)
    document.querySelectorAll(".nav-grid-parent").forEach(parentSpan => {
      parentSpan.onclick = (e) => {
        e.preventDefault();
        const parent = parentSpan.closest(".nav-grid-item").getAttribute("data-category");
        
        if (parent === "書櫃") {
          handleNavSelection(parent, "筆記");
        } else if (parent === "DVD架") {
          state.mediaTypeFilter = "all";
          navigateTo("dvd-rack-view");
        } else if (parent === "衣櫃") {
          handleNavSelection(parent, "衣服");
        } else if (parent === "外出") {
          handleNavSelection(parent, "景點");
        } else {
          state.currentCategoryFilter = parent;
          state.currentSubCategoryFilter = null;
          navigateTo("home-view");
        }
      };
    });

    // 14.2 藍色橫向導覽列點選行為 (blue-nav-bar)
    document.querySelectorAll("#blue-nav-menu .blue-nav-item").forEach(item => {
      item.onclick = (e) => {
        e.preventDefault();
        document.querySelectorAll("#blue-nav-menu .blue-nav-item").forEach(b => b.classList.remove("active"));
        item.classList.add("active");
        
        const tab = item.getAttribute("data-tab");
        if (tab === "all") {
          state.currentCategoryFilter = "all";
          state.currentSubCategoryFilter = null;
          navigateTo("home-view");
        } else if (tab === "書櫃") {
          handleNavSelection(tab, "筆記");
        } else if (tab === "DVD架") {
          state.mediaTypeFilter = "all";
          navigateTo("dvd-rack-view");
        } else if (tab === "衣櫃") {
          handleNavSelection(tab, "衣服");
        } else if (tab === "外出") {
          handleNavSelection(tab, "景點");
        } else {
          state.currentCategoryFilter = tab;
          state.currentSubCategoryFilter = null;
          navigateTo("home-view");
        }
      };
    });

    // Logo 點選回到首頁
    document.getElementById("logo-btn").onclick = (e) => {
      e.preventDefault();
      state.currentCategoryFilter = "all";
      state.currentSubCategoryFilter = null;
      navigateTo("home-view");
    };

    // 14.3 搜尋欄互動
    const executeSearch = () => {
      const query = document.getElementById("search-input").value.trim().toLowerCase();
      const categoryFilter = document.getElementById("search-type").value;
      
      if (!query) {
        state.currentCategoryFilter = "all";
        state.currentSubCategoryFilter = null;
        navigateTo("home-view");
        return;
      }

      state.currentCategoryFilter = "all";
      state.currentSubCategoryFilter = null;
      navigateTo("home-view");

      // 建立跨用戶全站資料庫
      let searchableItems = [];

      // 1. 自己與好友的貼文
      state.posts.forEach(p => {
        searchableItems.push({
          type: 'post',
          id: p.id,
          title: p.title,
          summary: p.summary,
          category: p.category,
          subcategory: p.subcategory,
          date: p.date,
          author: state.settings.ownerName,
          isPrivate: p.isPrivate,
          tags: p.tags || []
        });
      });
      (state.friends || []).forEach(f => {
        (f.posts || []).forEach(p => {
          searchableItems.push({
            type: 'post',
            id: p.id,
            title: p.title,
            summary: p.summary,
            category: p.category,
            subcategory: p.subcategory,
            date: p.date,
            author: f.name,
            isPrivate: p.isPrivate,
            tags: p.tags || []
          });
        });
      });

      // 2. 自己與好友的書架
      state.books.forEach(b => {
        searchableItems.push({
          type: 'book',
          id: b.id,
          title: b.title,
          summary: b.description || '書籍收藏',
          category: '書櫃',
          subcategory: '書架',
          date: '2026-06-05',
          author: state.settings.ownerName,
          tags: [b.author || '']
        });
      });
      (state.friends || []).forEach(f => {
        (f.books || []).forEach(b => {
          searchableItems.push({
            type: 'book',
            id: b.id,
            title: b.title,
            summary: b.description || '書籍收藏',
            category: '書櫃',
            subcategory: '書架',
            date: '2026-06-05',
            author: f.name,
            tags: [b.author || '']
          });
        });
      });

      // 3. 自己與好友的DVD/CD
      state.media.forEach(m => {
        searchableItems.push({
          type: 'media',
          id: m.id,
          title: m.title,
          summary: m.description || '影音收藏',
          category: 'DVD架',
          subcategory: m.type === 'movie' ? '電影' : m.type === 'game' ? '遊戲' : '音樂',
          date: m.year ? `${m.year}-01-01` : '2026-06-05',
          author: state.settings.ownerName,
          tags: [m.year || '']
        });
      });
      (state.friends || []).forEach(f => {
        (f.media || []).forEach(m => {
          searchableItems.push({
            type: 'media',
            id: m.id,
            title: m.title,
            summary: m.description || '影音收藏',
            category: 'DVD架',
            subcategory: m.type === 'movie' ? '電影' : m.type === 'game' ? '遊戲' : '音樂',
            date: m.year ? `${m.year}-01-01` : '2026-06-05',
            author: f.name,
            tags: [m.year || '']
          });
        });
      });

      // 4. 自己與好友的衣櫃
      state.wardrobeItems.forEach(w => {
        searchableItems.push({
          type: 'wardrobe',
          id: w.id,
          title: w.title,
          summary: w.desc || '衣物收藏',
          category: '衣櫃',
          subcategory: w.type === 'clothes' ? '衣服' : w.type === 'shoes' ? '鞋子' : '飾品',
          date: '2026-06-05',
          author: state.settings.ownerName,
          tags: []
        });
      });
      (state.friends || []).forEach(f => {
        (f.wardrobeItems || []).forEach(w => {
          searchableItems.push({
            type: 'wardrobe',
            id: w.id,
            title: w.title,
            summary: w.desc || '衣物收藏',
            category: '衣櫃',
            subcategory: w.type === 'clothes' ? '衣服' : w.type === 'shoes' ? '鞋子' : '飾品',
            date: '2026-06-05',
            author: f.name,
            tags: []
          });
        });
      });

      // 過濾分類與隱私
      let filtered = searchableItems.filter(item => {
        // 分類過濾
        if (categoryFilter !== 'all' && item.category !== categoryFilter) {
          return false;
        }
        // 隱私過濾
        if (item.isPrivate && state.role === "visitor") {
          return false;
        }
        // 關鍵字搜尋
        return item.title.toLowerCase().includes(query) || 
               item.summary.toLowerCase().includes(query) ||
               item.author.toLowerCase().includes(query) ||
               (item.tags && item.tags.some(t => t.toLowerCase().includes(query)));
      });

      const mainList = document.getElementById("main-posts-list");
      mainList.innerHTML = "";
      document.getElementById("list-title").textContent = `全站搜尋：「${query}」在 [${categoryFilter === 'all' ? '全部' : categoryFilter}] 的結果`;
      document.getElementById("post-count").textContent = `共 ${filtered.length} 項結果`;

      if (filtered.length > 0) {
        filtered.forEach(item => {
          const row = document.createElement("div");
          row.className = "post-item";
          const privateBadge = item.isPrivate ? `<span class="post-private-badge">[限好友]</span>` : "";
          const sourceBadge = `<span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(0, 168, 232, 0.1); color: var(--primary-dark); font-weight: bold; margin-left: 6px;">${item.author}</span>`;
          const categoryTag = `<span class="post-category-tag">[${item.subcategory || item.category}]</span>`;

          row.innerHTML = `
            <div class="post-body">
              ${categoryTag}
              <span class="post-title">${item.title}</span>
              ${privateBadge}
              ${sourceBadge}
            </div>
            <div class="post-meta">
              <span>${item.date.substring(5, 10)}</span>
            </div>
          `;
          
          row.onclick = () => {
            // 切換拜訪狀態
            if (item.author === state.settings.ownerName) {
              state.activeProfile = null;
            } else {
              const friend = state.friends.find(f => f.name === item.author);
              state.activeProfile = friend || null;
            }
            applyRolePermissions();
            updateBlogInfoUI();

            // 導向詳情
            if (item.type === 'post') {
              showPostDetail(item.id);
            } else if (item.type === 'book') {
              navigateTo("bookshelf-view");
              showBookDetail(item.id);
            } else if (item.type === 'media') {
              navigateTo("dvd-rack-view");
              showMediaDetail(item.id);
            } else if (item.type === 'wardrobe') {
              navigateTo("wardrobe-view");
              // 找到衣櫃物品對象
              const wardrobeSource = state.activeProfile ? (state.activeProfile.wardrobeItems || []) : state.wardrobeItems;
              const wObj = wardrobeSource.find(w => w.id === item.id);
              if (wObj) showWardrobeDetail(wObj);
            }
          };
          mainList.appendChild(row);
        });
      } else {
        mainList.innerHTML = `<div style="padding: 40px 0; text-align: center; color: var(--text-light);">找不到符合「${query}」的項目。</div>`;
      }
    };

    document.getElementById("search-btn").onclick = executeSearch;
    document.getElementById("search-input").onkeypress = (e) => {
      if (e.key === "Enter") executeSearch();
    };

    // 14.4 中欄 - 首頁籤頁 Tabs 點擊切換
    document.querySelectorAll("#home-tabs .tab-btn").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll("#home-tabs .tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        state.currentCategoryFilter = btn.getAttribute("data-tab");
        state.currentSubCategoryFilter = null;
        renderHomeView();
      };
    });

    // 14.5 衣櫃子標籤切換
    document.querySelectorAll("#wardrobe-tabs .tab-btn").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll("#wardrobe-tabs .tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        const subTab = btn.getAttribute("data-sub-tab");
        document.getElementById("wardrobe-clothes-view").style.display = subTab === "clothes" ? "block" : "none";
        document.getElementById("wardrobe-shoes-view").style.display = subTab === "shoes" ? "block" : "none";
        document.getElementById("wardrobe-accessories-view").style.display = subTab === "accessories" ? "block" : "none";
        
        renderWardrobeView();
      };
    });

    // 14.6 筆記自動儲存
    let saveTimeout;
    document.getElementById("notebook-textarea").oninput = () => {
      clearTimeout(saveTimeout);
      document.getElementById("notes-save-status").textContent = "正在自動儲存...";
      saveTimeout = setTimeout(() => {
        saveNotes();
        document.getElementById("notes-save-status").textContent = "管理員模式：已完成自動儲存";
      }, 800);
    };

    // 14.7 密碼解鎖彈窗與登出
    document.getElementById("lock-btn").onclick = () => {
      document.getElementById("login-key").value = "";
      showModal("login-modal");
    };

    document.getElementById("login-form").onsubmit = (e) => {
      e.preventDefault();
      const val = document.getElementById("login-key").value.trim();
      const success = verifyKey(val, true);
      if (success) {
        closeModal("login-modal");
        applyRolePermissions();
      }
    };

    document.getElementById("logout-btn").onclick = () => {
      if (confirm("確定要登出並清除目前的權限驗證嗎？")) {
        verifyKey("", false);
        closeModal("login-modal");
        applyRolePermissions();
        navigateTo("home-view");
      }
    };

    // 14.8 彈窗關閉行為
    document.querySelectorAll(".modal-close, .modal-cancel-btn").forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const modal = btn.closest(".modal-overlay");
        if (modal) closeModal(modal.id);
      };
    });

    // 14.8.1 側邊欄快速按鈕 (Page 3) - 已移至 updateBlogInfoUI 動態處理

    // 14.8.2 新增好友點擊按鈕與搜尋加好友 (Page 2)
    const addFriendBtn = document.getElementById("book-add-friend-btn");
    if (addFriendBtn) {
      addFriendBtn.onclick = () => {
        document.getElementById("search-friend-id-input").value = "";
        document.getElementById("search-friend-result").style.display = "none";
        showModal("add-friend-modal");
      };
    }

    const listAddFriendBtn = document.getElementById("list-add-friend-btn");
    if (listAddFriendBtn) {
      listAddFriendBtn.onclick = () => {
        document.getElementById("search-friend-id-input").value = "";
        document.getElementById("search-friend-result").style.display = "none";
        showModal("add-friend-modal");
      };
    }

    let foundFriendObject = null;

    const searchFriendBtn = document.getElementById("search-friend-btn");
    if (searchFriendBtn) {
      searchFriendBtn.onclick = () => {
        const idInput = document.getElementById("search-friend-id-input").value.trim().toLowerCase();
        if (!idInput) {
          alert("請輸入要搜尋的好友帳號 ID！");
          return;
        }

        // 1. 檢查是否是自己
        const myAccountId = (state.ownerProfile && state.ownerProfile.accountId) ? state.ownerProfile.accountId.toLowerCase() : "renata123";
        if (idInput === myAccountId) {
          alert("不能將自己加為好友喔！");
          return;
        }

        // 2. 檢查是否已經是好友
        const isAlreadyFriend = state.friends.some(f => f.accountId && f.accountId.toLowerCase() === idInput);
        if (isAlreadyFriend) {
          alert("該用戶已經是您的好友了！");
          return;
        }

        // 3. 在模擬用戶池中搜尋
        const userPool = state.globalUserPool || [];
        const found = userPool.find(u => u.accountId && u.accountId.toLowerCase() === idInput);
        if (!found) {
          alert("未找到該帳號 ID 的用戶，請重新輸入！\n(提示：您可以試著搜尋小華: xiaohua123 或大同: datong456)");
          document.getElementById("search-friend-result").style.display = "none";
          foundFriendObject = null;
          return;
        }

        // 4. 找到後預覽渲染
        foundFriendObject = found;
        document.getElementById("sf-avatar").src = found.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150";
        document.getElementById("sf-name").textContent = found.name || "";
        const sfIdEl = document.getElementById("sf-account-id");
        if (sfIdEl) sfIdEl.textContent = `@${found.accountId}`;
        document.getElementById("sf-nickname").textContent = found.nickname || "";
        document.getElementById("sf-status").textContent = found.social?.status || "這個人很懶，什麼都沒留下。";
        document.getElementById("search-friend-result").style.display = "block";
      };
    }

    const confirmAddFriendBtn = document.getElementById("confirm-add-friend-btn");
    if (confirmAddFriendBtn) {
      confirmAddFriendBtn.onclick = () => {
        if (!foundFriendObject) return;

        // 複製一份，避免物件參照問題
        const newFriend = JSON.parse(JSON.stringify(foundFriendObject));
        
        state.friends.push(newFriend);
        saveToLocal("friends", state.friends);
        
        closeModal("add-friend-modal");
        renderVisitView();
        
        // 切換到剛剛新增的好友
        const profiles = getBinderProfiles();
        const newFriendIndex = profiles.findIndex(p => p.accountId === newFriend.accountId);
        if (newFriendIndex !== -1) {
          showFriendBook(newFriendIndex);
        } else {
          showFriendBook(profiles.length - 1);
        }
        alert(`已成功將 ${newFriend.name} 新增為好友！`);
        
        foundFriendObject = null;
      };
    }

    // 14.8.3 好友留言板提交處理 (Page 7)
    document.getElementById("post-comment-form").onsubmit = (e) => {
      e.preventDefault();
      const authorInput = document.getElementById("post-comment-author").value.trim();
      const content = document.getElementById("post-comment-input").value;
      if (!content) return;

      const postsSource = state.activeProfile ? (state.activeProfile.posts || []) : state.posts;
      const post = postsSource.find(p => p.id === state.currentPostId);
      if (!post) return;

      if (!post.comments) post.comments = [];

      let authorName = authorInput;
      let avatar = "";
      let userRole = "visitor";

      // 如果已登入，使用個人註冊資料
      if (state.ownerProfile && state.ownerProfile.name && state.role === "friend") {
        authorName = authorInput || state.ownerProfile.name;
        avatar = state.ownerProfile.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150";
        userRole = "friend";
      } else if (state.role === "admin") {
        authorName = authorInput || "系統管理員";
        avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";
        userRole = "admin";
      } else {
        authorName = authorInput || "一般訪客";
        avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
        userRole = "visitor";
      }

      const newComment = {
        id: `comment-${Date.now()}`,
        author: authorName,
        avatar: avatar,
        role: userRole,
        content: content,
        date: formatDateString(new Date()) + " " + String(new Date().getHours()).padStart(2, '0') + ":" + String(new Date().getMinutes()).padStart(2, '0')
      };

      post.comments.push(newComment);
      
      if (state.activeProfile) {
        saveToLocal("friends", state.friends);
      } else {
        saveToLocal("posts", state.posts);
      }

      document.getElementById("post-comment-input").value = "";
      document.getElementById("post-comment-author").value = "";
      renderCommentsList(post);
    };

    // 系統通知中心按鈕點擊處理
    const notifBtn = document.getElementById("notification-btn");
    if (notifBtn) {
      notifBtn.onclick = () => {
        // 將所有留言通知標記為已讀
        state.notifications.forEach(n => {
          if (n.type === "comment" && n.status === "unread") {
            n.status = "read";
          }
        });
        saveToLocal("notifications", state.notifications);
        updateNotificationsCount();
        renderNotificationsList();
        showModal("notification-modal");
      };
    }

    // 14.9 管理員設定選單
    document.getElementById("edit-settings-btn").onclick = () => {
      document.getElementById("settings-title").value = state.settings.blogTitle;
      document.getElementById("settings-subtitle").value = state.settings.blogSubtitle;
      document.getElementById("settings-owner").value = state.settings.ownerName;
      document.getElementById("settings-bio").value = state.settings.ownerBio;
      document.getElementById("settings-admin-key").value = state.settings.adminKey;
      document.getElementById("settings-friend-key").value = state.settings.friendKey;

      // 填入個人檔案欄位
      const op = state.ownerProfile || {};
      document.getElementById("profile-avatar").value = op.avatar || "";
      document.getElementById("profile-account-id").value = op.accountId || "renata123";
      document.getElementById("profile-nickname").value = op.nickname || "";
      document.getElementById("profile-blood").value = op.bloodType || "";
      document.getElementById("profile-birthday").value = op.birthday || "";
      document.getElementById("profile-horoscope").value = op.horoscope || "";
      document.getElementById("profile-gender").value = op.gender || "";
      document.getElementById("profile-city").value = op.city || "";
      document.getElementById("profile-email").value = op.email || "";
      document.getElementById("profile-mobile").value = op.mobile || "";
      document.getElementById("profile-facebook").value = op.facebook || "";
      document.getElementById("profile-line").value = op.line || "";

      document.getElementById("profile-passion").value = op.aboutMe?.passion ?? 80;
      document.getElementById("profile-humor").value = op.aboutMe?.humor ?? 80;
      document.getElementById("profile-procrastination").value = op.aboutMe?.procrastination ?? 50;
      document.getElementById("profile-fitness").value = op.aboutMe?.fitness ?? 50;
      document.getElementById("profile-foodie").value = op.aboutMe?.foodie ?? 80;

      document.getElementById("profile-fav-country").value = op.favorites?.country || "";
      document.getElementById("profile-fav-color").value = op.favorites?.color || "";
      document.getElementById("profile-fav-music").value = op.favorites?.music || "";
      document.getElementById("profile-fav-movie").value = op.favorites?.movie || "";
      document.getElementById("profile-fav-food").value = op.favorites?.food || "";
      document.getElementById("profile-fav-trait").value = op.favorites?.trait || "";

      document.getElementById("profile-top3-title").value = op.top3?.title || "";
      document.getElementById("profile-top3-1").value = op.top3?.top1 || "";
      document.getElementById("profile-top3-2").value = op.top3?.top2 || "";
      document.getElementById("profile-top3-3").value = op.top3?.top3 || "";

      document.getElementById("profile-social-role").value = op.social?.role || "";
      document.getElementById("profile-social-talent").value = op.social?.talent || "";
      document.getElementById("profile-social-welcome").value = op.social?.welcome || "";
      document.getElementById("profile-social-status").value = op.social?.status || "";

      showModal("settings-modal");
    };

    document.getElementById("settings-form").onsubmit = (e) => {
      e.preventDefault();
      state.settings.blogTitle = document.getElementById("settings-title").value.trim();
      state.settings.blogSubtitle = document.getElementById("settings-subtitle").value.trim();
      state.settings.ownerName = document.getElementById("settings-owner").value.trim();
      state.settings.ownerBio = document.getElementById("settings-bio").value.trim();
      state.settings.adminKey = document.getElementById("settings-admin-key").value.trim();
      state.settings.friendKey = document.getElementById("settings-friend-key").value.trim();
      
      // 儲存個人檔案欄位
      if (!state.ownerProfile) state.ownerProfile = {};
      state.ownerProfile.avatar = document.getElementById("profile-avatar").value.trim();
      state.ownerProfile.accountId = document.getElementById("profile-account-id").value.trim() || "renata123";
      state.ownerProfile.name = state.settings.ownerName;
      state.ownerProfile.nickname = document.getElementById("profile-nickname").value.trim();
      state.ownerProfile.bloodType = document.getElementById("profile-blood").value.trim();
      state.ownerProfile.birthday = document.getElementById("profile-birthday").value;
      state.ownerProfile.horoscope = document.getElementById("profile-horoscope").value.trim();
      state.ownerProfile.gender = document.getElementById("profile-gender").value.trim();
      state.ownerProfile.city = document.getElementById("profile-city").value.trim();
      state.ownerProfile.email = document.getElementById("profile-email").value.trim();
      state.ownerProfile.mobile = document.getElementById("profile-mobile").value.trim();
      state.ownerProfile.facebook = document.getElementById("profile-facebook").value.trim();
      state.ownerProfile.line = document.getElementById("profile-line").value.trim();

      state.ownerProfile.aboutMe = {
        passion: parseInt(document.getElementById("profile-passion").value) || 0,
        humor: parseInt(document.getElementById("profile-humor").value) || 0,
        procrastination: parseInt(document.getElementById("profile-procrastination").value) || 0,
        fitness: parseInt(document.getElementById("profile-fitness").value) || 0,
        foodie: parseInt(document.getElementById("profile-foodie").value) || 0
      };

      state.ownerProfile.favorites = {
        country: document.getElementById("profile-fav-country").value.trim(),
        color: document.getElementById("profile-fav-color").value.trim(),
        music: document.getElementById("profile-fav-music").value.trim(),
        movie: document.getElementById("profile-fav-movie").value.trim(),
        food: document.getElementById("profile-fav-food").value.trim(),
        trait: document.getElementById("profile-fav-trait").value.trim()
      };

      state.ownerProfile.top3 = {
        title: document.getElementById("profile-top3-title").value.trim(),
        top1: document.getElementById("profile-top3-1").value.trim(),
        top2: document.getElementById("profile-top3-2").value.trim(),
        top3: document.getElementById("profile-top3-3").value.trim()
      };

      state.ownerProfile.social = {
        role: document.getElementById("profile-social-role").value.trim(),
        talent: document.getElementById("profile-social-talent").value.trim(),
        welcome: document.getElementById("profile-social-welcome").value.trim(),
        status: document.getElementById("profile-social-status").value.trim()
      };

      saveToLocal("owner_profile", state.ownerProfile);
      saveToLocal("settings", state.settings);
      
      // 同步更新 globalUserPool 中對應的個人資料紀錄
      if (state.globalUserPool && state.ownerProfile.email) {
        const index = state.globalUserPool.findIndex(
          p => p.email && p.email.toLowerCase() === state.ownerProfile.email.toLowerCase()
        );
        if (index !== -1) {
          state.globalUserPool[index] = { ...state.globalUserPool[index], ...state.ownerProfile };
          saveToLocal("global_user_pool", state.globalUserPool);
        }
      }
      
      updateBlogInfoUI();
      closeModal("settings-modal");
      applyRolePermissions();
      if (state.currentView === "visit-view") {
        showFriendBook(currentFriendBookIndex);
      }
      alert("設定儲存成功！");
    };

    // 14.10 貼文發表與修改 (Post Editor Modal)
    document.getElementById("write-post-btn").onclick = () => {
      document.getElementById("post-editor-title").textContent = "撰寫新貼文";
      document.getElementById("edit-post-id").value = "";
      document.getElementById("post-editor-form").reset();
      triggerCategoryLinkage();
      showModal("post-editor-modal");
    };

    document.getElementById("post-parent-category").onchange = triggerCategoryLinkage;

    document.getElementById("post-editor-form").onsubmit = (e) => {
      e.preventDefault();
      const editId = document.getElementById("edit-post-id").value;
      const title = document.getElementById("post-title").value.trim();
      const parentCat = document.getElementById("post-parent-category").value;
      const subCat = document.getElementById("post-sub-category").value;
      const imgUrl = document.getElementById("post-image-url").value.trim();
      const privacy = document.getElementById("post-privacy").value;
      const tags = document.getElementById("post-tags-input").value.split(',').map(t => t.trim()).filter(t => t);
      const summary = document.getElementById("post-summary-input").value.trim();
      const content = document.getElementById("post-content-input").value;

      if (editId) {
        const post = state.posts.find(p => p.id === editId);
        if (post) {
          post.title = title;
          post.category = parentCat;
          post.subcategory = subCat;
          post.image = imgUrl;
          post.isPrivate = privacy === "friend";
          post.tags = tags;
          post.summary = summary;
          post.content = content;
        }
      } else {
        const newPost = {
          id: `post-${Date.now()}`,
          title: title,
          summary: summary,
          content: content,
          category: parentCat,
          subcategory: subCat,
          image: imgUrl,
          date: formatDateString(new Date()) + " " + String(new Date().getHours()).padStart(2, '0') + ":" + String(new Date().getMinutes()).padStart(2, '0'),
          author: state.settings.ownerName,
          tags: tags,
          isPrivate: privacy === "friend",
          views: 1
        };
        state.posts.unshift(newPost);
      }

      saveToLocal("posts", state.posts);
      closeModal("post-editor-modal");
      
      if (editId) {
        renderPostDetailView();
      } else {
        state.currentCategoryFilter = "all";
        state.currentSubCategoryFilter = null;
        navigateTo("home-view");
      }
    };

    document.getElementById("edit-post-btn").onclick = () => {
      const postsSource = state.activeProfile ? (state.activeProfile.posts || []) : state.posts;
      const post = postsSource.find(p => p.id === state.currentPostId);
      if (!post || state.activeProfile) return;

      document.getElementById("post-editor-title").textContent = "修改貼文";
      document.getElementById("edit-post-id").value = post.id;
      document.getElementById("post-title").value = post.title;
      document.getElementById("post-parent-category").value = post.category;
      
      triggerCategoryLinkage();
      document.getElementById("post-sub-category").value = post.subcategory;
      document.getElementById("post-image-url").value = post.image || "";
      document.getElementById("post-privacy").value = post.isPrivate ? "friend" : "public";
      document.getElementById("post-tags-input").value = post.tags ? post.tags.join(', ') : "";
      document.getElementById("post-summary-input").value = post.summary;
      document.getElementById("post-content-input").value = post.content;

      showModal("post-editor-modal");
    };

    document.getElementById("delete-post-btn").onclick = () => {
      if (state.activeProfile) return;
      if (confirm("確定要刪除這篇文章嗎？")) {
        state.posts = state.posts.filter(p => p.id !== state.currentPostId);
        saveToLocal("posts", state.posts);
        state.currentPostId = null;
        navigateTo("home-view");
        alert("文章已刪除。");
      }
    };

    // 14.11 書櫃 - 新增/編輯書本 (Page 4)
    document.getElementById("add-book-btn").onclick = () => {
      document.getElementById("book-editor-form").reset();
      document.getElementById("edit-book-id").value = "";
      document.getElementById("book-editor-form-title").textContent = "新增書架書籍";
      document.getElementById("book-editor-submit-btn").textContent = "放到書架上";
      showModal("book-editor-modal");
    };

    document.getElementById("book-editor-form").onsubmit = (e) => {
      e.preventDefault();
      const editId = document.getElementById("edit-book-id").value;
      const title = document.getElementById("book-title").value.trim();
      const author = document.getElementById("book-author").value.trim();
      const cover = document.getElementById("book-cover").value.trim();
      const desc = document.getElementById("book-desc").value.trim();
      const thoughts = document.getElementById("book-thoughts").value.trim();

      if (editId) {
        const book = state.books.find(b => b.id === editId);
        if (book) {
          book.title = title;
          book.author = author;
          book.cover = cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150";
          book.description = desc;
          book.thoughts = thoughts;
        }
      } else {
        const newBook = {
          id: `book-${Date.now()}`,
          title: title,
          author: author,
          cover: cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150",
          description: desc,
          thoughts: thoughts
        };
        state.books.push(newBook);
      }
      
      saveToLocal("books", state.books);
      closeModal("book-editor-modal");
      renderBookshelfView();
    };

    // 14.12 書櫃 - 待辦事項新增
    document.getElementById("todo-form").onsubmit = (e) => {
      e.preventDefault();
      const txt = document.getElementById("todo-input").value.trim();
      if (!txt) return;

      const newTodo = {
        id: `todo-${Date.now()}`,
        text: txt,
        completed: false
      };

      state.todos.push(newTodo);
      saveToLocal("todos", state.todos);
      document.getElementById("todo-input").value = "";
      renderTodoView();
    };

    // 14.13 DVD/CD - 新增/編輯 (Page 5)
    document.getElementById("add-media-btn").onclick = () => {
      document.getElementById("media-editor-form").reset();
      document.getElementById("edit-media-id").value = "";
      document.getElementById("media-rating-value").value = "0";
      updateMediaEditorStars(0);
      document.getElementById("media-editor-form-title").textContent = "新增影音收藏 (CD/DVD)";
      document.getElementById("media-editor-submit-btn").textContent = "放入收藏櫃";
      showModal("media-editor-modal");
    };

    document.getElementById("media-editor-form").onsubmit = (e) => {
      e.preventDefault();
      const editId = document.getElementById("edit-media-id").value;
      const title = document.getElementById("media-title").value.trim();
      const type = document.getElementById("media-type").value;
      const year = document.getElementById("media-year").value.trim();
      const cover = document.getElementById("media-cover").value.trim();
      const desc = document.getElementById("media-desc").value.trim();
      const rating = parseInt(document.getElementById("media-rating-value").value) || 0;
      const comment = document.getElementById("media-comment").value.trim();

      let defaultImg = "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150";
      if (type === "movie") defaultImg = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150";
      if (type === "game") defaultImg = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=150";

      if (editId) {
        const item = state.media.find(m => m.id === editId);
        if (item) {
          item.title = title;
          item.type = type;
          item.year = year || new Date().getFullYear();
          item.cover = cover || defaultImg;
          item.description = desc;
          item.rating = rating;
          item.comment = comment;
        }
      } else {
        const newMedia = {
          id: `media-${Date.now()}`,
          title: title,
          type: type,
          year: year || new Date().getFullYear(),
          cover: cover || defaultImg,
          description: desc,
          rating: rating,
          comment: comment
        };
        state.media.push(newMedia);
      }

      saveToLocal("media", state.media);
      closeModal("media-editor-modal");
      renderDvdRackView();
    };

    // 14.14 衣櫃 - 新增/編輯收藏 (Page 6)
    document.getElementById("add-wardrobe-item-btn").onclick = () => {
      document.getElementById("wardrobe-editor-form").reset();
      document.getElementById("edit-w-id").value = "";
      const activeTab = document.querySelector("#wardrobe-tabs .tab-btn.active").getAttribute("data-sub-tab");
      document.getElementById("w-type").value = activeTab;
      document.getElementById("wardrobe-editor-form-title").textContent = "新增衣物或飾品";
      document.getElementById("wardrobe-editor-submit-btn").textContent = "放入衣櫃";
      showModal("wardrobe-editor-modal");
    };

    document.getElementById("wardrobe-editor-form").onsubmit = (e) => {
      e.preventDefault();
      const editId = document.getElementById("edit-w-id").value;
      const title = document.getElementById("w-title").value.trim();
      const brand = document.getElementById("w-brand").value.trim();
      const type = document.getElementById("w-type").value;
      const image = document.getElementById("w-image").value.trim();
      const desc = document.getElementById("w-desc").value.trim();

      let defaultImg = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150";
      if (type === "shoes") defaultImg = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150";
      if (type === "accessories") defaultImg = "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150";

      if (editId) {
        const item = state.wardrobeItems.find(w => w.id === editId);
        if (item) {
          item.title = title;
          item.brand = brand;
          item.type = type;
          item.image = image || defaultImg;
          item.desc = desc;
        }
      } else {
        const newItem = {
          id: `w-${Date.now()}`,
          title: title,
          brand: brand,
          type: type,
          image: image || defaultImg,
          desc: desc
        };
        state.wardrobeItems.push(newItem);
      }

      saveToLocal("wardrobe_items", state.wardrobeItems);
      closeModal("wardrobe-editor-modal");
      renderWardrobeView();
    };

    // 14.15 外出 - 地圖新增
    document.getElementById("add-spot-btn").onclick = () => {
      document.getElementById("spot-editor-form").reset();
      if (leafletMap) {
        const center = leafletMap.getCenter();
        document.getElementById("spot-lat").value = center.lat.toFixed(4);
        document.getElementById("spot-lng").value = center.lng.toFixed(4);
      }
      showModal("spot-editor-modal");
    };

    document.getElementById("spot-editor-form").onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById("spot-name").value.trim();
      const lat = parseFloat(document.getElementById("spot-lat").value);
      const lng = parseFloat(document.getElementById("spot-lng").value);
      const desc = document.getElementById("spot-desc").value.trim();

      const newSpot = {
        id: `spot-${Date.now()}`,
        name: name,
        desc: desc,
        lat: lat,
        lng: lng
      };

      state.spots.push(newSpot);
      saveToLocal("spots", state.spots);
      closeModal("spot-editor-modal");
      
      renderMapMarkers();
      renderMapView();

      if (leafletMap) {
        leafletMap.setView([lat, lng], 12);
      }
    };

    // 14.16 外出 - 行程新增
    document.getElementById("add-event-btn").onclick = () => {
      document.getElementById("event-editor-form").reset();
      document.getElementById("event-date").value = formatDateString(new Date());
      showModal("event-editor-modal");
    };

    document.getElementById("event-editor-form").onsubmit = (e) => {
      e.preventDefault();
      const title = document.getElementById("event-title").value.trim();
      const date = document.getElementById("event-date").value;
      const desc = document.getElementById("event-desc").value.trim();

      const newEvent = {
        id: `event-${Date.now()}`,
        title: title,
        date: date,
        desc: desc
      };

      state.events.push(newEvent);
      saveToLocal("events", state.events);
      closeModal("event-editor-modal");
      renderCalendar();
    };

    document.getElementById("cal-prev-btn").onclick = () => {
      state.calendarMonth--;
      if (state.calendarMonth < 0) {
        state.calendarMonth = 11;
        state.calendarYear--;
      }
      renderCalendar();
    };

    document.getElementById("cal-next-btn").onclick = () => {
      state.calendarMonth++;
      if (state.calendarMonth > 11) {
        state.calendarMonth = 0;
        state.calendarYear++;
      }
      renderCalendar();
    };

    document.getElementById("cal-today-btn").onclick = () => {
      state.calendarYear = new Date().getFullYear();
      state.calendarMonth = new Date().getMonth();
      renderCalendar();
    };

    // 14.17 備份面板
    document.getElementById("export-data-btn").onclick = () => {
      document.getElementById("io-modal-title").innerHTML = `<i class="fa-solid fa-file-export"></i> 備份資料匯出`;
      document.getElementById("export-panel").style.display = "block";
      document.getElementById("import-panel").style.display = "none";
      showModal("io-modal");
    };

    document.getElementById("download-data-js-btn").onclick = () => {
      exportDataJs();
      closeModal("io-modal");
    };

    document.getElementById("import-data-btn").onclick = () => {
      document.getElementById("io-modal-title").innerHTML = `<i class="fa-solid fa-file-import"></i> 資料匯入回復`;
      document.getElementById("export-panel").style.display = "none";
      document.getElementById("import-panel").style.display = "block";
      document.getElementById("import-file-input").value = "";
      document.getElementById("execute-import-btn").disabled = true;
      showModal("io-modal");
    };

    document.getElementById("import-file-input").onchange = (e) => {
      const file = e.target.files[0];
      document.getElementById("execute-import-btn").disabled = !file;
    };

    document.getElementById("execute-import-btn").onclick = () => {
      const file = document.getElementById("import-file-input").files[0];
      if (file) {
        handleImportFile(file);
        closeModal("io-modal");
      }
    };

    document.getElementById("profile-avatar-file").onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 1024 * 1024) {
          alert("圖片大小不能超過 1MB，以避免瀏覽器儲存空間不足！");
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById("profile-avatar").value = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
  }

  function handleNavSelection(parent, sub) {
    if (parent === "書櫃") {
      if (sub === "筆記") navigateTo("notes-view");
      if (sub === "書架") navigateTo("bookshelf-view");
      if (sub === "待辦") navigateTo("todo-view");
    } else if (parent === "DVD架") {
      if (sub === "電影") state.mediaTypeFilter = "movie";
      if (sub === "遊戲") state.mediaTypeFilter = "game";
      if (sub === "音樂") state.mediaTypeFilter = "music";
      navigateTo("dvd-rack-view");
    } else if (parent === "衣櫃") {
      navigateTo("wardrobe-view");
      let subVal = "clothes";
      if (sub === "鞋子") subVal = "shoes";
      if (sub === "飾品") subVal = "accessories";
      
      const tabBtn = document.querySelector(`#wardrobe-tabs .tab-btn[data-sub-tab="${subVal}"]`);
      if (tabBtn) tabBtn.click();
    } else if (parent === "外出") {
      if (sub === "景點") navigateTo("map-view");
      if (sub === "拜訪") navigateTo("visit-view");
      if (sub === "行程") navigateTo("calendar-view");
    } else {
      state.currentCategoryFilter = parent;
      state.currentSubCategoryFilter = sub;
      navigateTo("home-view");
    }
  }

  function triggerCategoryLinkage() {
    const parent = document.getElementById("post-parent-category").value;
    const subSelect = document.getElementById("post-sub-category");
    subSelect.innerHTML = "";

    const structure = {
      "書櫃": ["筆記", "書架", "待辦"],
      "DVD架": ["電影", "遊戲", "音樂"],
      "衣櫃": ["衣服", "鞋子", "飾品"],
      "書桌": ["寵物", "手做", "飲食"],
      "外出": ["景點", "活動", "行程"],
      "消息": ["話題", "情感", "夢境"]
    };

    const subs = structure[parent] || [];
    subs.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      subSelect.appendChild(opt);
    });
  }

  function showModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add("active");
  }

  function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove("active");
  }

  // ==========================================================================
  // 15. 拜訪與好友冊（Binder Profile）邏輯
  // ==========================================================================
  let currentFriendBookIndex = 0;

  function getBinderProfiles() {
    if (state.activeProfile) {
      // 正在拜訪好友空間
      // 活頁夾第一頁為該空間主人，第二頁為登入的本站主人 (雷娜塔)
      const hostProfile = state.activeProfile;
      const visitorProfile = state.ownerProfile || window.DEFAULT_OWNER_PROFILE;
      return [hostProfile, visitorProfile];
    } else {
      // 在自己空間
      // 活頁夾第一頁為自己，後續頁面為好友清單中的所有人
      const myProfile = state.ownerProfile || window.DEFAULT_OWNER_PROFILE;
      const friendsList = state.friends || [];
      return [myProfile, ...friendsList];
    }
  }

  function renderFriendsGrid() {
    const grid = document.getElementById("friends-grid");
    if (!grid) return;
    grid.innerHTML = "";
    
    const friends = state.friends || [];
    if (friends.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 40px 0;">尚無好友。您可以點擊右上角的「新增好友」按鈕來添加好友！</div>`;
      return;
    }
    
    friends.forEach((friend, idx) => {
      const card = document.createElement("div");
      card.className = "friend-card";
      
      let defaultAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150";
      if (friend.accountId === (state.ownerProfile?.accountId || "renata123")) {
        defaultAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300";
      }
      
      card.innerHTML = `
        <img src="${friend.avatar || defaultAvatar}" alt="${friend.name}" class="friend-card-avatar" onerror="this.src='${defaultAvatar}'">
        <div class="friend-card-name">${friend.name}</div>
        <div class="friend-card-nickname">${friend.nickname || '@' + friend.accountId}</div>
        <div class="friend-card-status">${friend.social?.status || '這個人很懶，什麼都沒留下。'}</div>
        <div style="display: flex; gap: 8px; margin-top: 12px; width: 100%;">
          <button class="btn btn-primary btn-sm btn-view-profile" style="flex: 1; padding: 4px 10px; font-size: 11px;"><i class="fa-solid fa-address-card"></i> 詳細資料</button>
          <button class="btn btn-danger btn-sm btn-delete-friend" style="padding: 4px 8px; font-size: 11px;" title="刪除好友"><i class="fa-solid fa-user-minus"></i> 刪除</button>
        </div>
      `;
      
      // 點選詳細資料打開 binder book 頁面
      card.querySelector(".btn-view-profile").onclick = (e) => {
        e.stopPropagation();
        showFriendBook(idx + 1);
      };
      
      // 點選刪除好友
      card.querySelector(".btn-delete-friend").onclick = (e) => {
        e.stopPropagation();
        if (confirm(`確定要將 ${friend.name} 從好友名單中刪除嗎？`)) {
          state.friends.splice(idx, 1);
          saveToLocal("friends", state.friends);
          
          if (state.activeProfile && state.activeProfile.accountId === friend.accountId) {
            state.activeProfile = null;
            updateBlogInfoUI();
            applyRolePermissions();
          }
          
          alert("已成功刪除該好友！");
          renderVisitView();
        }
      };
      
      // 點選卡片整體拜訪房間
      card.onclick = () => {
        visitFriendRoom(friend);
      };
      
      grid.appendChild(card);
    });
  }

  function renderVisitView() {
    showFriendBook(0);
  }

  function showFriendBook(index) {
    const profiles = getBinderProfiles();
    if (index < 0 || index >= profiles.length) return;
    currentFriendBookIndex = index;
    
    // 觸發 3D 翻書效果動畫
    const book = document.querySelector(".binder-book");
    if (book) {
      book.classList.add("page-flipping");
      setTimeout(() => book.classList.remove("page-flipping"), 600);
    }
    
    const friend = profiles[index];
    document.getElementById("friends-list-container").style.display = "none";
    document.getElementById("friend-profile-book").style.display = "block";
    
    // 更新頁碼指示器
    const indicator = document.getElementById("book-page-indicator");
    if (indicator) {
      indicator.textContent = `${index + 1} / ${profiles.length}`;
    }
    
    // 基本資料
    let defaultAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150";
    if (friend.accountId === (state.ownerProfile?.accountId || "renata123")) {
      defaultAvatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300";
    }
    document.getElementById("bf-avatar").src = friend.avatar || defaultAvatar;
    document.getElementById("bf-name").textContent = friend.name || "";
    document.getElementById("bf-nickname").textContent = friend.nickname || "";
    document.getElementById("bf-blood").textContent = friend.bloodType || "";
    document.getElementById("bf-account-id").textContent = friend.accountId || "無";
    document.getElementById("bf-birthday").textContent = friend.birthday || "";
    document.getElementById("bf-horoscope").textContent = friend.horoscope || "";
    document.getElementById("bf-gender").textContent = friend.gender || "";
    document.getElementById("bf-city").textContent = friend.city || "";
    
    // 聯絡方式
    document.getElementById("bf-email").textContent = friend.email || "";
    document.getElementById("bf-mobile").textContent = friend.mobile || "";
    document.getElementById("bf-line").textContent = friend.line || "";

    // 我的最愛
    document.getElementById("fav-country").textContent = friend.favorites?.country || "";
    document.getElementById("fav-color").textContent = friend.favorites?.color || "";
    document.getElementById("fav-music").textContent = friend.favorites?.music || "";
    document.getElementById("fav-movie").textContent = friend.favorites?.movie || "";
    document.getElementById("fav-food").textContent = friend.favorites?.food || "";
    document.getElementById("fav-trait").textContent = friend.favorites?.trait || "";

    // 我的前三名 (Top 3)
    const top3TitleEl = document.getElementById("bf-top3-title");
    if (top3TitleEl) {
      top3TitleEl.innerHTML = `<i class="fa-solid fa-trophy"></i> ${friend.top3?.title || '我的前三名 (My Top 3)'}`;
    }
    document.getElementById("top3-1").textContent = friend.top3?.top1 || "";
    document.getElementById("top3-2").textContent = friend.top3?.top2 || "";
    document.getElementById("top3-3").textContent = friend.top3?.top3 || "";

    // 社交標籤與狀態
    document.getElementById("social-role").textContent = friend.social?.role || "";
    document.getElementById("social-talent").textContent = friend.social?.talent || "";
    document.getElementById("social-welcome").textContent = friend.social?.welcome || "";
    document.getElementById("social-status").textContent = friend.social?.status || "";

    // 雷達圖繪製
    drawRadarChart(friend.aboutMe || {});

    // 拜訪按鈕綁定與文字調整
    const visitBtn = document.getElementById("visit-room-btn");
    const hostId = state.activeProfile ? state.activeProfile.accountId : (state.ownerProfile?.accountId || "renata123");
    
    // 檢查卡片上的帳號 ID 是否是當前拜訪空間的 host
    const isCurrentHost = (friend.accountId === hostId);
    
    // 檢查卡片上的帳號 ID 是否是登入的本站主人 (雷娜塔)
    const isOwner = (friend.accountId === (state.ownerProfile?.accountId || "renata123"));
    
    if (isCurrentHost) {
      visitBtn.innerHTML = '<i class="fa-solid fa-house-user"></i> 目前在此房間';
      visitBtn.disabled = true;
      visitBtn.onclick = null;
      visitBtn.style.opacity = "0.7";
      visitBtn.style.cursor = "default";
    } else {
      visitBtn.disabled = false;
      visitBtn.style.opacity = "1";
      visitBtn.style.cursor = "pointer";
      
      if (isOwner) {
        visitBtn.innerHTML = '<i class="fa-solid fa-house"></i> 返回我的房間';
        visitBtn.onclick = () => {
          leaveVisitingRoom();
        };
      } else {
        visitBtn.innerHTML = '<i class="fa-solid fa-door-open"></i> 拜訪好友房間';
        visitBtn.onclick = () => {
          visitFriendRoom(friend);
        };
      }
    }

    // 刪除好友功能綁定與處理
    const deleteFriendBtn = document.getElementById("book-delete-friend-btn");
    if (deleteFriendBtn) {
      if (isOwner) {
        deleteFriendBtn.style.display = "none";
      } else {
        deleteFriendBtn.style.display = "inline-block";
        deleteFriendBtn.onclick = () => {
          if (confirm(`確定要將 ${friend.name} 從好友名單中刪除嗎？`)) {
            const fIndex = state.friends.findIndex(f => f.accountId === friend.accountId);
            if (fIndex !== -1) {
              state.friends.splice(fIndex, 1);
              saveToLocal("friends", state.friends);
              
              if (state.activeProfile && state.activeProfile.accountId === friend.accountId) {
                state.activeProfile = null;
                updateBlogInfoUI();
                applyRolePermissions();
              }
              
              alert("已成功刪除該好友！");
              
              // 刷新好友活頁夾並重新整理顯示於首頁
              renderVisitView();
            }
          }
        };
      }
    }
  }

  function drawRadarChart(stats) {
    const container = document.getElementById("bf-radar");
    if (!container) return;
    
    // 移除舊的 SVG，保留 Label 等元素
    const oldSvgs = container.querySelectorAll("svg");
    oldSvgs.forEach(s => s.remove());

    const width = 140;
    const height = 140;
    const center = 70;
    const R = 50; // 最大半徑

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // 五角形背景網格 (分為 5 層，每層 20%)
    for (let level = 1; level <= 5; level++) {
      const radius = R * (level / 5);
      const points = [];
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      const poly = document.createElementNS(svgNS, "polygon");
      poly.setAttribute("points", points.join(" "));
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", "rgba(0, 168, 232, 0.15)");
      poly.setAttribute("stroke-width", "1");
      svg.appendChild(poly);
    }

    // 繪製雷達骨架輻射線
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const x = center + R * Math.cos(angle);
      const y = center + R * Math.sin(angle);
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", center);
      line.setAttribute("y1", center);
      line.setAttribute("x2", x);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "rgba(0, 168, 232, 0.15)");
      line.setAttribute("stroke-dasharray", "2,2");
      svg.appendChild(line);
    }

    // 獲取雷達數值：熱情, 幽默, 拖延, 健身, 美食 (順序對應雷達圖頂點)
    const values = [
      stats.passion ?? 50,
      stats.humor ?? 50,
      stats.procrastination ?? 50,
      stats.fitness ?? 50,
      stats.foodie ?? 50
    ];

    const valuePoints = [];
    for (let i = 0; i < 5; i++) {
      const val = values[i];
      const radius = R * (val / 100);
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      valuePoints.push(`${x},${y}`);
    }

    // 繪製半透明多邊形數值區域
    const valuePoly = document.createElementNS(svgNS, "polygon");
    valuePoly.setAttribute("points", valuePoints.join(" "));
    valuePoly.setAttribute("fill", "rgba(0, 168, 232, 0.35)");
    valuePoly.setAttribute("stroke", "rgba(0, 119, 182, 0.75)");
    valuePoly.setAttribute("stroke-width", "2");
    valuePoly.style.filter = "drop-shadow(0px 2px 4px rgba(0, 168, 232, 0.3))";
    svg.appendChild(valuePoly);

    // 繪製數值點圓圈
    for (let i = 0; i < 5; i++) {
      const val = values[i];
      const radius = R * (val / 100);
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", "3");
      circle.setAttribute("fill", "#ffffff");
      circle.setAttribute("stroke", "var(--primary-dark)");
      circle.setAttribute("stroke-width", "1.5");
      svg.appendChild(circle);
    }

    container.insertBefore(svg, container.firstChild);
  }

  function visitFriendRoom(friend) {
    state.activeProfile = friend;
    applyRolePermissions();
    updateBlogInfoUI();
    navigateTo("home-view");
    alert(`您已進入 ${friend.name} 的空間！您可以瀏覽他的貼文與收藏。`);
  }

  function leaveVisitingRoom() {
    state.activeProfile = null;
    applyRolePermissions();
    updateBlogInfoUI();
    navigateTo("home-view");
    alert("已返回您自己的空間！");
  }

  function setupVisitEventListeners() {
    // 返回首頁
    const backBtn = document.getElementById("book-back-to-list-btn");
    if (backBtn) {
      backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> 返回首頁';
      backBtn.onclick = () => {
        if (state.activeProfile) {
          state.activeProfile = null;
          updateBlogInfoUI();
          applyRolePermissions();
        }
        navigateTo("home-view");
      };
    }

    // 上一個 / 下一個好友
    const prevBtn = document.getElementById("book-prev-btn");
    if (prevBtn) {
      prevBtn.onclick = () => {
        const len = getBinderProfiles().length;
        let idx = currentFriendBookIndex - 1;
        if (idx < 0) idx = len - 1;
        showFriendBook(idx);
      };
    }

    const nextBtn = document.getElementById("book-next-btn");
    if (nextBtn) {
      nextBtn.onclick = () => {
        const len = getBinderProfiles().length;
        let idx = currentFriendBookIndex + 1;
        if (idx >= len) idx = 0;
        showFriendBook(idx);
      };
    }

    // 頂部返回自己房間按鈕
    const leaveBtn = document.getElementById("leave-visiting-btn");
    if (leaveBtn) {
      leaveBtn.onclick = () => {
        leaveVisitingRoom();
      };
    }
  }

  // ==========================================================================
  // 16. 富文本工具列與表情 (Rich Text Toolbar & Emoji)
  // ==========================================================================
  function initRichEditorToolbars() {
    document.querySelectorAll(".rich-editor-toolbar").forEach(toolbar => {
      const targetId = toolbar.getAttribute("data-target");
      const textarea = document.getElementById(targetId);
      if (!textarea) return;

      // 粗體
      const boldBtn = toolbar.querySelector(".bold-btn");
      if (boldBtn) {
        boldBtn.onclick = (e) => {
          e.preventDefault();
          wrapText(textarea, "<b>", "</b>");
        };
      }

      // 字體大小
      const sizeSelect = toolbar.querySelector(".size-select");
      if (sizeSelect) {
        sizeSelect.onchange = (e) => {
          const val = e.target.value;
          if (val) {
            wrapText(textarea, `<span style="font-size:${val};">`, "</span>");
            e.target.value = "";
          }
        };
      }

      // 字體顏色
      const colorSelect = toolbar.querySelector(".color-select");
      if (colorSelect) {
        colorSelect.onchange = (e) => {
          const val = e.target.value;
          if (val) {
            wrapText(textarea, `<span style="color:${val};">`, "</span>");
            e.target.value = "";
          }
        };
      }

      // 表情符號點選
      toolbar.querySelectorAll(".emoji-picker-popup span").forEach(span => {
        span.onclick = (e) => {
          e.preventDefault();
          const emoji = span.textContent;
          insertTextAtCursor(textarea, emoji);
        };
      });
    });
  }

  function wrapText(textarea, before, after) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;
    textarea.value = text.substring(0, start) + replacement + text.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    textarea.dispatchEvent(new Event('input'));
  }

  function insertTextAtCursor(textarea, textToInsert) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + textToInsert + text.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    textarea.dispatchEvent(new Event('input'));
  }

  // ==========================================================================
  // 17. 影音星級互動與評分 (DVD/CD Star Ratings)
  // ==========================================================================
  function initMediaStarsInteraction() {
    const ratingInput = document.getElementById("media-rating-value");
    const starsContainer = document.getElementById("media-star-rating");
    if (!starsContainer || !ratingInput) return;

    const stars = starsContainer.querySelectorAll("i");

    stars.forEach(star => {
      star.onmouseenter = () => {
        const val = parseInt(star.getAttribute("data-val"));
        highlightStars(stars, val);
      };

      star.onmouseleave = () => {
        const currentVal = parseInt(ratingInput.value) || 0;
        highlightStars(stars, currentVal);
      };

      star.onclick = () => {
        const val = parseInt(star.getAttribute("data-val"));
        ratingInput.value = val;
        highlightStars(stars, val);
      };
    });
  }

  function highlightStars(stars, rating) {
    stars.forEach(s => {
      const val = parseInt(s.getAttribute("data-val"));
      if (val <= rating) {
        s.className = "fa-solid fa-star";
      } else {
        s.className = "fa-regular fa-star";
      }
    });
  }

  function updateMediaEditorStars(rating) {
    const starsContainer = document.getElementById("media-star-rating");
    if (!starsContainer) return;
    const stars = starsContainer.querySelectorAll("i");
    highlightStars(stars, rating);
  }

  // ==========================================================================
  // 18. 好友留言渲染與刪除 (Post Comments Rendering & Deletion)
  // ==========================================================================
  function renderCommentsList(post) {
    const box = document.getElementById("post-comments-list");
    const countEl = document.getElementById("post-comments-count");
    if (!box) return;

    const comments = post.comments || [];
    countEl.textContent = `共 ${comments.length} 條留言`;

    box.innerHTML = "";
    if (comments.length === 0) {
      box.innerHTML = `<div style="text-align: center; color: var(--text-light); padding: 12px; font-size: 12px;">尚無好友留言，快來留下一筆吧！</div>`;
      return;
    }

    comments.forEach(comment => {
      const card = document.createElement("div");
      card.className = "comment-card";
      card.style.background = "rgba(255,255,255,0.6)";
      card.style.border = "1px solid rgba(255,255,255,0.8)";
      card.style.borderRadius = "8px";
      card.style.padding = "10px";
      card.style.position = "relative";
      card.style.marginBottom = "8px";

      // 如果是非拜訪模式下，允許刪除留言
      const deleteIcon = (!state.activeProfile) ? 
        `<button class="comment-delete-btn" style="position: absolute; top: 8px; right: 8px; background: transparent; border: none; color: var(--danger-color); cursor: pointer;" title="刪除留言" onclick="window.deleteComment('${post.id}', '${comment.id}')"><i class="fa-solid fa-trash"></i></button>` : "";

      // 取得頭像與角色 (決定頭像框)
      let avatar = comment.avatar;
      let role = comment.role || "visitor";

      if (!avatar) {
        const authorLower = comment.author.toLowerCase();
        if (authorLower.includes("雷娜塔") || authorLower.includes("renata")) {
          avatar = (state.ownerProfile && state.ownerProfile.accountId && state.ownerProfile.accountId.toLowerCase() === "renata123" && state.ownerProfile.avatar) ? state.ownerProfile.avatar : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300";
          role = "friend";
        } else if (authorLower.includes("阿明") || authorLower.includes("aming")) {
          avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150";
          role = "friend";
        } else if (authorLower.includes("小華") || authorLower.includes("xiaohua")) {
          avatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150";
          role = "friend";
        } else if (authorLower.includes("大同") || authorLower.includes("datong")) {
          avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";
          role = "friend";
        } else if (state.ownerProfile && state.ownerProfile.name && authorLower === state.ownerProfile.name.toLowerCase()) {
          avatar = state.ownerProfile.avatar;
          role = "friend";
        } else {
          avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
          role = "visitor";
        }
      }

      card.innerHTML = `
        <div style="display: flex; gap: 12px; align-items: flex-start; width: 100%;">
          <div class="comment-avatar-wrapper">
            <img class="comment-avatar" src="${avatar}" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'">
            <div class="avatar-frame ${role}"></div>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div class="comment-header" style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-light); margin-bottom: 4px;">
              <span class="comment-author" style="font-weight: 700; color: var(--primary-dark);">${comment.author}</span>
              <span class="comment-date" style="margin-right: 20px;">${comment.date}</span>
            </div>
            <div class="comment-content" style="font-size: 12.5px; line-height: 1.5; color: var(--text-dark); white-space: pre-wrap;">${comment.content}</div>
          </div>
        </div>
        ${deleteIcon}
      `;
      box.appendChild(card);
    });
  }

  window.deleteComment = function(postId, commentId) {
    if (state.activeProfile) return; // 拜訪中不可刪除
    if (confirm("確定要刪除這條留言嗎？")) {
      const postsSource = state.activeProfile ? (state.activeProfile.posts || []) : state.posts;
      const post = postsSource.find(p => p.id === postId);
      if (post && post.comments) {
        post.comments = post.comments.filter(c => c.id !== commentId);
        if (state.activeProfile) {
          saveToLocal("friends", state.friends);
        } else {
          saveToLocal("posts", state.posts);
        }
        renderCommentsList(post);
      }
    }
  };

  // ==========================================================================
  // 19. 通知中心與留言框輔助邏輯 (Notification Center & Helper API)
  // ==========================================================================
  function updateNotificationsCount() {
    const badge = document.getElementById("notification-count");
    if (!badge) return;
    const unreadCount = state.notifications.filter(
      n => n.status === "unread" || (n.type === "friend_request" && n.status === "pending")
    ).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  }

  function renderNotificationsList() {
    const box = document.getElementById("notification-list-box");
    if (!box) return;
    box.innerHTML = "";
    
    if (!state.notifications || state.notifications.length === 0) {
      box.innerHTML = `<div style="text-align: center; color: var(--text-light); padding: 20px; font-size: 12px;">目前沒有任何通知</div>`;
      return;
    }
    
    state.notifications.forEach(notif => {
      const item = document.createElement("div");
      item.className = "notification-item";
      item.style.background = "rgba(255,255,255,0.7)";
      item.style.border = "1px solid rgba(0, 168, 232, 0.15)";
      item.style.borderRadius = "8px";
      item.style.padding = "10px";
      item.style.display = "flex";
      item.style.gap = "10px";
      item.style.alignItems = "center";
      item.style.boxShadow = "var(--shadow-sm)";
      item.style.marginBottom = "8px";
      
      let actionButtons = "";
      if (notif.type === "friend_request") {
        if (notif.status === "pending") {
          actionButtons = `
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <button class="btn btn-primary btn-sm" onclick="window.handleFriendRequest('${notif.id}', true)">同意</button>
              <button class="btn btn-secondary btn-sm" onclick="window.handleFriendRequest('${notif.id}', false)">拒絕</button>
            </div>
          `;
        } else if (notif.status === "accepted") {
          actionButtons = `<div style="font-size: 11px; color: green; font-weight: 600; margin-top: 6px;"><i class="fa-solid fa-check"></i> 已同意好友請求</div>`;
        } else {
          actionButtons = `<div style="font-size: 11px; color: var(--text-light); margin-top: 6px;">已拒絕好友請求</div>`;
        }
      } else if (notif.type === "comment") {
        actionButtons = `
          <div style="margin-top: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="window.viewCommentPost('${notif.id}', '${notif.postId}')"><i class="fa-solid fa-eye"></i> 前往查看</button>
          </div>
        `;
      }
      
      item.innerHTML = `
        <img src="${notif.senderAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--primary-color);">
        <div style="flex: 1; text-align: left;">
          <div style="font-size: 12px; color: var(--text-dark); line-height: 1.4;">
            <strong style="color: var(--primary-dark);">${notif.senderName}</strong> ${notif.text}
            ${notif.commentText ? `<div style="font-style: italic; background: rgba(0,0,0,0.03); padding: 4px 8px; border-left: 2.5px solid var(--primary-color); border-radius: 2px; margin-top: 4px; font-size: 11.5px; color: #555;">"${notif.commentText}"</div>` : ''}
          </div>
          <div style="font-size: 10px; color: var(--text-light); margin-top: 4px;">${notif.time}</div>
          ${actionButtons}
        </div>
      `;
      box.appendChild(item);
    });
  }

  // 註冊全局事件處理函數，子供 HTML onclick 使用
  window.handleFriendRequest = (notifId, accept) => {
    const notif = state.notifications.find(n => n.id === notifId);
    if (!notif) return;
    
    if (accept) {
      const friendObj = state.globalUserPool.find(p => p.accountId === notif.senderId);
      if (friendObj) {
        const alreadyFriend = state.friends.some(f => f.accountId === friendObj.accountId);
        if (!alreadyFriend) {
          state.friends.push(JSON.parse(JSON.stringify(friendObj)));
          saveToLocal("friends", state.friends);
          renderVisitView();
        }
      }
      notif.status = "accepted";
      alert(`已將 ${notif.senderName} 加入好友名單！`);
    } else {
      notif.status = "rejected";
    }
    
    saveToLocal("notifications", state.notifications);
    renderNotificationsList();
    updateNotificationsCount();
  };

  window.viewCommentPost = (notifId, postId) => {
    const notif = state.notifications.find(n => n.id === notifId);
    if (notif) {
      notif.status = "read";
      saveToLocal("notifications", state.notifications);
    }
    updateNotificationsCount();
    closeModal("notification-modal");
    showPostDetail(postId);
  };

  // 導出全局變數與函式，供 Firebase Auth 模組使用
  window.state = state;
  window.updateBlogInfoUI = updateBlogInfoUI;
  window.applyRolePermissions = applyRolePermissions;
  window.navigateTo = navigateTo;

  window.addEventListener("DOMContentLoaded", init);
})();
