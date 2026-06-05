// 等待 DOM 載入
window.addEventListener("DOMContentLoaded", () => {
  const authView = document.getElementById("auth-view");
  const mainWrapper = document.querySelector(".main-wrapper");
  const header = document.querySelector("header");

  const tabLoginBtn = document.getElementById("tab-login-btn");
  const tabRegisterBtn = document.getElementById("tab-register-btn");
  const loginForm = document.getElementById("auth-login-form");
  const registerForm = document.getElementById("auth-register-form");
  const googleBtn = document.getElementById("google-signin-btn");
  const guestBtn = document.getElementById("auth-guest-btn");
  const setupForm = document.getElementById("auth-setup-form");
  const setupAvatarFile = document.getElementById("setup-avatar-file");

  if (!authView) return; // 確保元素存在

  // 檢查 Firebase 是否載入成功
  if (typeof window.auth === 'undefined') {
    console.error("Firebase Auth 未初始化，請檢查載入順序。");
    return;
  }

  // 本地 Storage 寫入 Helper
  const saveToLocal = (key, data) => {
    localStorage.setItem(`renata_blog_${key}`, JSON.stringify(data));
  };

  // 同步個人資料至部落格設定的 Helper
  const syncProfileToSettings = (profile) => {
    if (window.state && window.state.settings) {
      window.state.settings.ownerName = profile.name;
      window.state.settings.blogTitle = `${profile.name} 的空間`;
      window.state.settings.blogSubtitle = `${profile.accountId.toUpperCase()}'S SPACE`;
      window.state.settings.ownerBio = profile.social?.status || profile.nickname || "歡迎來到我的空間！";
      saveToLocal("settings", window.state.settings);
    }
  };

  // 註冊表單：頭像檔案本地上傳事件 (轉為 Base64)
  if (setupAvatarFile) {
    setupAvatarFile.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 1024 * 1024) {
          alert("圖片大小不能超過 1MB，以避免瀏覽器儲存空間不足！");
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const setupAvatarInput = document.getElementById("setup-avatar");
          if (setupAvatarInput) {
            setupAvatarInput.value = event.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // 切換 登入 / 註冊 頁籤
  if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
    tabLoginBtn.onclick = () => {
      tabLoginBtn.classList.add("active");
      tabRegisterBtn.classList.remove("active");
      loginForm.style.display = "flex";
      registerForm.style.display = "none";
    };

    tabRegisterBtn.onclick = () => {
      tabRegisterBtn.classList.add("active");
      tabLoginBtn.classList.remove("active");
      registerForm.style.display = "flex";
      loginForm.style.display = "none";
    };
  }

  // 電子郵件登入
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      try {
        await window.auth.signInWithEmailAndPassword(email, password);
      } catch (err) {
        alert(`登入失敗：${getAuthErrorMessage(err.code)}`);
      }
    };
  }

  // 電子郵件註冊
  if (registerForm) {
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value;
      const passwordConfirm = document.getElementById("register-password-confirm").value;

      if (password.length < 6) {
        alert("密碼長度必須至少為 6 個字元！");
        return;
      }

      if (password !== passwordConfirm) {
        alert("密碼與確認密碼不一致！");
        return;
      }

      try {
        await window.auth.createUserWithEmailAndPassword(email, password);
        alert("帳號創建成功！請填寫以下個人檔案完成建立個人空間。");
      } catch (err) {
        alert(`註冊失敗：${getAuthErrorMessage(err.code)}`);
      }
    };
  }

  // Google 登入
  if (googleBtn) {
    googleBtn.onclick = async () => {
      try {
        await window.auth.signInWithPopup(window.googleProvider);
      } catch (err) {
        alert(`Google 登入失敗：${getAuthErrorMessage(err.code)}`);
      }
    };
  }

  // 訪客身分參觀
  if (guestBtn) {
    guestBtn.onclick = (e) => {
      e.preventDefault();
      hideAuthPage();
      if (window.navigateTo) {
        window.navigateTo("home-view");
      }
    };
  }

  // 註冊後個人資料填寫表單送出
  if (setupForm) {
    setupForm.onsubmit = (e) => {
      e.preventDefault();

      const user = window.auth.currentUser;
      if (!user) {
        alert("找不到當前登入的使用者，請重新整理網頁！");
        return;
      }

      const accountId = document.getElementById("setup-account-id").value.trim();
      const name = document.getElementById("setup-name").value.trim();
      const avatarInput = document.getElementById("setup-avatar").value.trim();
      const nickname = document.getElementById("setup-nickname").value.trim();
      const gender = document.getElementById("setup-gender").value.trim();
      const blood = document.getElementById("setup-blood").value.trim();
      const birthday = document.getElementById("setup-birthday").value;
      const horoscope = document.getElementById("setup-horoscope").value.trim();
      const city = document.getElementById("setup-city").value.trim();

      if (!accountId) {
        alert("請輸入個人帳號 ID！");
        return;
      }

      if (!name) {
        alert("請輸入站長名稱！");
        return;
      }

      // 檢查帳號 ID 是否已被佔用 (不分大小寫)
      const lowercaseId = accountId.toLowerCase();
      let userPool = [];
      if (window.state && window.state.globalUserPool) {
        userPool = window.state.globalUserPool;
      }

      const duplicateExists = userPool.some(
        p => p.accountId && p.accountId.toLowerCase() === lowercaseId
      );

      if (duplicateExists) {
        alert("此個人帳號 ID 已被使用，請輸入其他 ID！");
        return;
      }

      // 建立個人 Profile 物件
      const newProfile = {
        id: "friend-" + Date.now(),
        accountId: accountId,
        name: name,
        nickname: nickname,
        avatar: avatarInput || user.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        bloodType: blood || "未填寫",
        birthday: birthday || "",
        horoscope: horoscope || "",
        gender: gender || "未填寫",
        city: city || "",
        orientation: "不限",
        email: user.email,
        phone: "",
        mobile: "",
        facebook: "",
        line: "",
        fillDate: new Date().toISOString().split("T")[0],
        aboutMe: {
          passion: 80,
          humor: 75,
          procrastination: 50,
          fitness: 50,
          foodie: 70
        },
        favorites: {
          country: "",
          color: "",
          music: "",
          movie: "",
          food: "",
          trait: ""
        },
        top3: {
          title: "自訂主題排行",
          top1: "",
          top2: "",
          top3: ""
        },
        social: {
          role: "新成員",
          talent: "",
          welcome: "歡迎來到我的空間！",
          status: "剛建立個人網頁小家！"
        },
        posts: [],
        books: [],
        media: [],
        wardrobeItems: []
      };

      // 儲存至全域狀態與快取
      if (window.state) {
        window.state.ownerProfile = newProfile;
        window.state.globalUserPool.push(newProfile);
        window.state.role = "friend"; // 設定為特權好友角色

        saveToLocal("owner_profile", newProfile);
        saveToLocal("global_user_pool", window.state.globalUserPool);
        
        // 同步至部落格設定
        syncProfileToSettings(newProfile);
      }

      // 更新全域 UI 權限與側欄
      if (window.applyRolePermissions) window.applyRolePermissions();
      if (window.updateBlogInfoUI) window.updateBlogInfoUI();

      alert("個人檔案建立成功！歡迎進入您的個人空間！");
      hideAuthPage();

      if (window.navigateTo) {
        window.navigateTo("home-view");
      }
    };
  }

  // 監聽 Auth 狀態改變
  window.auth.onAuthStateChanged((user) => {
    const topLogoutBtn = document.getElementById("top-logout-btn");

    if (user) {
      // 登入成功：綁定與顯示頂部「登出」按鈕
      if (topLogoutBtn) {
        topLogoutBtn.style.display = "inline-block";
        topLogoutBtn.onclick = async (e) => {
          e.preventDefault();
          if (confirm("確定要登出您的帳號嗎？")) {
            try {
              await window.auth.signOut();
              // 還原狀態
              if (window.state) {
                window.state.role = "visitor";
                localStorage.removeItem("renata_blog_access_key");
              }
              alert("已成功登出！");
            } catch (err) {
              console.error("Logout error:", err);
            }
          }
        };
      }

      // 檢查 globalUserPool 中是否已有該信箱的個人資料
      let existingProfile = null;
      if (window.state && window.state.globalUserPool) {
        existingProfile = window.state.globalUserPool.find(
          p => p.email && p.email.toLowerCase() === user.email.toLowerCase()
        );
      }

      if (existingProfile) {
        // 已有個人資料，載入並進入首頁
        if (window.state) {
          window.state.ownerProfile = existingProfile;
          window.state.role = "friend";
          saveToLocal("owner_profile", existingProfile);
          
          // 同步至部落格設定
          syncProfileToSettings(existingProfile);
        }

        // 更新 UI 與側邊欄
        if (window.applyRolePermissions) window.applyRolePermissions();
        if (window.updateBlogInfoUI) window.updateBlogInfoUI();

        hideAuthPage();
        if (window.navigateTo) {
          window.navigateTo("home-view");
        }
      } else {
        // 沒有個人資料（首次 Google 登入或新註冊），顯示個人檔案設定表單
        showAuthPage();

        // 隱藏一般登入與註冊表單及分頁選單
        if (loginForm) loginForm.style.display = "none";
        if (registerForm) registerForm.style.display = "none";
        if (tabLoginBtn) tabLoginBtn.style.display = "none";
        if (tabRegisterBtn) tabRegisterBtn.style.display = "none";
        if (googleBtn) googleBtn.style.display = "none";
        const authDivider = document.querySelector(".auth-divider");
        if (authDivider) authDivider.style.display = "none";
        const guestLink = document.querySelector(".auth-guest-link");
        if (guestLink) guestLink.style.display = "none";

        // 顯示個人資料填寫表單
        if (setupForm) {
          setupForm.style.display = "flex";
          // 預帶入站長名稱
          document.getElementById("setup-name").value = user.displayName || user.email.split("@")[0];
          // 預帶入頭像網址
          document.getElementById("setup-avatar").value = user.photoURL || "";
          // 預帶入帳號 ID (移除特殊字元，取 Email 前綴)
          const defaultAccountId = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
          document.getElementById("setup-account-id").value = defaultAccountId;
        }
      }

      // 添加雙擊 roleBadge 登出綁定作為備用相容
      setupRoleBadgeLogout(user);
    } else {
      // 未登入：隱藏頂部登出按鈕，恢復顯示登入/註冊頁面
      if (topLogoutBtn) {
        topLogoutBtn.style.display = "none";
      }

      if (tabLoginBtn) {
        tabLoginBtn.style.display = "";
        tabLoginBtn.classList.add("active");
      }
      if (tabRegisterBtn) {
        tabRegisterBtn.style.display = "";
        tabRegisterBtn.classList.remove("active");
      }
      if (loginForm) {
        loginForm.style.display = "flex";
      }
      if (registerForm) {
        registerForm.style.display = "none";
      }
      if (googleBtn) googleBtn.style.display = "";
      const authDivider = document.querySelector(".auth-divider");
      if (authDivider) authDivider.style.display = "";
      const guestLink = document.querySelector(".auth-guest-link");
      if (guestLink) guestLink.style.display = "";

      if (setupForm) {
        setupForm.style.display = "none";
      }

      showAuthPage();
    }
  });

  function showAuthPage() {
    if (authView) authView.style.display = "flex";
    if (mainWrapper) mainWrapper.style.display = "none";
    if (header) header.style.display = "none";
  }

  function hideAuthPage() {
    if (authView) authView.style.display = "none";
    if (mainWrapper) mainWrapper.style.display = "";
    if (header) header.style.display = "";
  }

  function setupRoleBadgeLogout(user) {
    const roleBadge = document.getElementById("role-badge");
    if (roleBadge) {
      roleBadge.title = `已登入：${user.email}，雙擊可登出。`;
      roleBadge.style.cursor = "pointer";
      roleBadge.ondblclick = async () => {
        if (confirm("確定要登出您的帳號嗎？")) {
          try {
            await window.auth.signOut();
            if (window.state) {
              window.state.role = "visitor";
              localStorage.removeItem("renata_blog_access_key");
            }
            alert("已成功登出！");
          } catch (err) {
            console.error("Logout error:", err);
          }
        }
      };
    }
  }

  function getAuthErrorMessage(code) {
    switch (code) {
      case "auth/invalid-email": return "電子信箱格式錯誤。";
      case "auth/user-disabled": return "此用戶帳號已被停用。";
      case "auth/user-not-found": return "找不到此用戶，請先註冊。";
      case "auth/wrong-password": return "密碼輸入錯誤。";
      case "auth/email-already-in-use": return "此電子信箱已被註冊使用。";
      case "auth/weak-password": return "密碼強度不足，請輸入至少 6 位數。";
      case "auth/operation-not-allowed": return "此登入方式尚未在 Firebase 啟用。";
      case "auth/popup-closed-by-user": return "登入視窗已被關閉，請重試。";
      default: return `未知錯誤 (${code})`;
    }
  }
});
