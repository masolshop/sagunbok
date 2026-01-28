// 강제 캐시 클리어 스크립트
(function() {
  const CACHE_VERSION = 'v1.0.24'; // 버전을 올리면 캐시가 무효화됩니다
  
  // Service Worker 등록 해제
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
  }

  // 모든 캐시 삭제
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        caches.delete(name);
      });
    });
  }

  // 로컬 스토리지에 버전 체크
  const cachedVersion = localStorage.getItem('app_version');
  if (cachedVersion !== CACHE_VERSION) {
    console.log('🔄 New version detected, clearing cache...');
    localStorage.setItem('app_version', CACHE_VERSION);
    // 강제 새로고침
    if (!performance.navigation.type || performance.navigation.type !== 1) {
      window.location.reload(true);
    }
  }
})();
