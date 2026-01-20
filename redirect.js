/**
 * Smart App Store Redirect
 * Detects iOS vs Android (including Instagram/Facebook in-app browsers)
 * and redirects users to the correct store immediately
 */

// ============================================
// CONFIGURATION - BURAYA KENDİ LİNKLERİNİZİ GİRİN
// ============================================
const CONFIG = {
    // App Store linkiniz (iOS)
    appStoreUrl: 'https://apps.apple.com/tr/app/verde/id6751551270?l=tr',

    // Google Play linkiniz (Android)
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.cadde.verdeapp',

    // Yönlendirme gecikmesi (milisaniye) - 0 = anında yönlendir
    redirectDelay: 500
};

// ============================================
// DEVICE DETECTION
// ============================================
const DeviceDetector = {
    ua: navigator.userAgent || navigator.vendor || window.opera,

    /**
     * iOS kontrolü (iPhone, iPad, iPod)
     * Instagram ve Facebook in-app browser dahil
     */
    isIOS() {
        // Standart iOS kontrolü
        if (/iPad|iPhone|iPod/.test(this.ua) && !window.MSStream) {
            return true;
        }

        // iPad OS 13+ için (Safari masaüstü modu)
        if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
            return true;
        }

        // Instagram/FB in-app browser iOS kontrolü
        if (/FBIOS|Instagram.*iPhone|iPhone.*Instagram/i.test(this.ua)) {
            return true;
        }

        return false;
    },

    /**
     * Android kontrolü
     * Instagram ve Facebook in-app browser dahil
     */
    isAndroid() {
        // Standart Android kontrolü
        if (/android/i.test(this.ua)) {
            return true;
        }

        // Instagram/FB in-app browser Android kontrolü
        if (/FBAN.*Android|Instagram.*Android|Android.*Instagram|Android.*FBAN/i.test(this.ua)) {
            return true;
        }

        return false;
    },

    /**
     * In-app browser kontrolü (Instagram, Facebook, TikTok vb.)
     */
    isInAppBrowser() {
        return /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Twitter|TikTok|Snapchat|LinkedIn/i.test(this.ua);
    },

    /**
     * Mobil cihaz mı?
     */
    isMobile() {
        return this.isIOS() || this.isAndroid();
    },

    /**
     * Platform bilgisini döndür
     */
    getPlatform() {
        if (this.isIOS()) return 'ios';
        if (this.isAndroid()) return 'android';
        return 'unknown';
    }
};

// ============================================
// REDIRECT CONTROLLER
// ============================================
const RedirectController = {

    /**
     * Doğru mağazaya yönlendir
     */
    redirectToStore(platform) {
        let url;

        if (platform === 'ios') {
            url = CONFIG.appStoreUrl;
            // iOS için intent URL'i dene (in-app browser'dan açmak için)
            // Bazı in-app browser'lar için alternatif yöntem
            if (DeviceDetector.isInAppBrowser()) {
                // itms-apps şeması ile App Store'u doğrudan aç
                const appId = CONFIG.appStoreUrl.match(/id(\d+)/)?.[1];
                if (appId) {
                    url = `itms-apps://apps.apple.com/app/id${appId}`;
                }
            }
        } else if (platform === 'android') {
            url = CONFIG.playStoreUrl;
            // Android için intent URL'i dene (in-app browser'dan açmak için)
            if (DeviceDetector.isInAppBrowser()) {
                const packageName = CONFIG.playStoreUrl.match(/id=([^&]+)/)?.[1];
                if (packageName) {
                    // market:// şeması ile Play Store'u doğrudan aç
                    url = `market://details?id=${packageName}`;
                }
            }
        } else {
            // Bilinmeyen platform - iOS varsayalım veya Play Store
            url = CONFIG.playStoreUrl;
        }

        console.log('Redirecting to:', url);
        window.location.href = url;

        // Fallback: 1 saniye sonra normal URL'e yönlendir (intent çalışmazsa)
        setTimeout(() => {
            if (platform === 'ios') {
                window.location.href = CONFIG.appStoreUrl;
            } else {
                window.location.href = CONFIG.playStoreUrl;
            }
        }, 1000);
    },

    /**
     * UI'ı güncelle ve yönlendir
     */
    handleRedirect() {
        const platform = DeviceDetector.getPlatform();
        const storeText = document.getElementById('store-text');
        const storeButton = document.getElementById('store-button');
        const buttonText = document.getElementById('button-text');
        const buttonIcon = document.getElementById('button-icon');
        const manualButtons = document.getElementById('manual-buttons');

        console.log('Platform detected:', platform);
        console.log('User Agent:', DeviceDetector.ua);
        console.log('Is In-App Browser:', DeviceDetector.isInAppBrowser());

        // Platform'a göre UI güncelle
        if (platform === 'ios') {
            storeText.textContent = "App Store'a yönlendiriliyorsunuz...";
            buttonText.textContent = "App Store'a Git";
            buttonIcon.textContent = "🍎";
            storeButton.href = CONFIG.appStoreUrl;
        } else if (platform === 'android') {
            storeText.textContent = "Google Play'e yönlendiriliyorsunuz...";
            buttonText.textContent = "Google Play'e Git";
            buttonIcon.textContent = "▶️";
            storeButton.href = CONFIG.playStoreUrl;
        } else {
            // Masaüstü veya bilinmeyen - butonları göster
            storeText.textContent = "Mobil cihazınızdan ziyaret edin";
            manualButtons.classList.remove('hidden');
            storeButton.href = CONFIG.playStoreUrl;
            return;
        }

        // Otomatik yönlendirme
        setTimeout(() => {
            this.redirectToStore(platform);

            // 2 saniye sonra butonları göster (yönlendirme başarısız olursa)
            setTimeout(() => {
                manualButtons.classList.remove('hidden');
            }, 2000);
        }, CONFIG.redirectDelay);
    }
};

// ============================================
// BAŞLAT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    RedirectController.handleRedirect();
});
