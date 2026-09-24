// Reklam ve satın almalar için tek giriş noktası.
//
// Oyunun geri kalanı sadece bu arayüzü çağırır; hangi reklam ağı ya da mağaza kullanılacağını bilmez.
// Web sürümünde sağlayıcı yok: ödüllü reklam butonları görünmez, geçiş reklamı hiç çıkmaz.
// Mobil paketlemede (Capacitor + AdMob / RevenueCat) ya da web oyun portallarında (Poki, CrazyGames SDK)
// Monet.setProvider({...}) ile bir sağlayıcı bağlanır. Sağlayıcı şu fonksiyonları verir:
//   rewardedReady(): boolean
//   showRewarded(placement): Promise<boolean>   // izleyip bitirdiyse true
//   showInterstitial(placement): Promise<void>
//   purchase(productId): Promise<boolean>
(function (KS) {
  'use strict';
  const Save = KS.Save;

  // Geçiş reklamı kuralları: oyuncuyu kaçırmamak için seyrek ve öngörülebilir
  const POLICY = {
    minLevel: 8,          // ilk 7 seviyede hiç geçiş reklamı yok
    everyNWins: 3,        // en fazla her 3 galibiyette bir
    minGapMs: 3 * 60e3,   // iki reklam arası en az 3 dakika
  };

  let provider = null;
  let winsSince = 0, lastAt = 0;

  const Monet = KS.Monet = {
    PRODUCTS: {
      removeAds: 'kule.remove_ads',
    },
    setProvider(p) { provider = p; },
    canShowRewarded() {
      try { return !!(provider && provider.rewardedReady && provider.rewardedReady()); } catch (e) { return false; }
    },
    // placement: 'revive' | 'double_gold' | 'free_ability' ... (analitikte hangi yerin işe yaradığını görmek için)
    showRewarded(placement) {
      if (!Monet.canShowRewarded()) return Promise.resolve(false);
      Monet.track('rewarded_start', { placement });
      return provider.showRewarded(placement)
        .then(ok => { Monet.track(ok ? 'rewarded_done' : 'rewarded_skip', { placement }); return !!ok; })
        .catch(() => false);
    },
    // Seviye kazanıldıktan sonra, bir sonraki seviyeye geçerken çağrılır. Asla seviye ortasında değil.
    afterWin(level) {
      winsSince++;
      if (!provider || Save.data.adsRemoved || level < POLICY.minLevel) return Promise.resolve();
      if (winsSince < POLICY.everyNWins || Date.now() - lastAt < POLICY.minGapMs) return Promise.resolve();
      winsSince = 0; lastAt = Date.now();
      Monet.track('interstitial', { level });
      return Promise.resolve(provider.showInterstitial('level_end')).catch(() => {});
    },
    purchase(productId) {
      if (!provider || !provider.purchase) return Promise.resolve(false);
      return provider.purchase(productId).then(ok => {
        if (ok && productId === Monet.PRODUCTS.removeAds) { Save.data.adsRemoved = true; Save.write(); }
        return !!ok;
      }).catch(() => false);
    },
    // Analitik bağlanana kadar hiçbir yere gönderilmez
    track(event, data) { if (Monet.onTrack) Monet.onTrack(event, data); },
    onTrack: null,
  };
})(window.KS);
