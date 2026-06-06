// Firebase 配置資訊 (自您的 Firebase 專案「20260605-01」自動獲取)
const firebaseConfig = {
  apiKey: "AIzaSyAmoW8QnsjIJf2_n1P-qNe7cNmpqW3SM9o",
  authDomain: "project-5995689044921351338.firebaseapp.com",
  projectId: "project-5995689044921351338",
  storageBucket: "project-5995689044921351338.firebasestorage.app",
  messagingSenderId: "918256635786",
  appId: "1:918256635786:web:092d866d016c8ab9dac273",
  measurementId: "G-QPZYQYNWSM"
};

// 初始化 Firebase (使用 compat 全域變數)
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  window.auth = firebase.auth();
  window.googleProvider = new firebase.auth.GoogleAuthProvider();
} else {
  console.error("Firebase SDK 載入失敗，請檢查網路連線。");
}
