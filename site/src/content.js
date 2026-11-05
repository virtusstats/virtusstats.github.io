// Page copy for the landing site. Edit freely; App.jsx only lays it out.
export default {
  "wordmark": "tabula",
  "lang": "tr",
  "badge": "Web uygulaması",
  "tagline": "Veri dosyanı bırak, tablon hazır.",
  "description": "Tabula bir CSV ya da Excel dosyasını tarayıcıda okur. Her sütun için ölçek türünü seçersin; ortalama, medyan, çeyrekler, standart sapma, normallik ve gruplar arası varyans homojenliği tablosu ile grafikler anında gelir. Dosya hiçbir yere yüklenmez.",
  "ctas": [
    {
      "label": "Uygulamayı aç",
      "href": "https://virtusstats.github.io/"
    },
    {
      "label": "GitHub'da gör",
      "href": "https://github.com/virtusstats/virtusstats.github.io"
    }
  ],
  "highlights": [
    "CSV ve Excel, sürükle bırak",
    "Doğru testi seçer, çalıştırır, APA raporunu yazar",
    "Türkçe ve İngilizce arayüz"
  ],
  "features": [
    {
      "title": "Ölçek türüne göre",
      "text": "Sınıflama, sıralama, aralık ve oran: her sütun kendi türüne uygun istatistiklerle özetlenir."
    },
    {
      "title": "Betimsel tablo",
      "text": "Ortalama, medyan, mod, Q1, Q3, IQR, standart sapma, en küçük ve en büyük değer tek tabloda."
    },
    {
      "title": "Varsayım kontrolleri",
      "text": "Shapiro-Wilk normallik ve Levene varyans homojenliği; eksik veri ve aykırı değerleri gösterir, istersen dışarıda bırakır."
    },
    {
      "title": "Testi çalıştırır",
      "text": "t testi, Welch, Mann-Whitney, ANOVA, Kruskal-Wallis, eşleştirilmiş testler, ki-kare, Fisher, korelasyon ve regresyon; etki büyüklüğü ve post-hoc testlerle."
    },
    {
      "title": "Yayına hazır rapor",
      "text": "APA biçiminde tablolar ve sonuç cümleleri; Word, PDF ya da Excel olarak indir veya teze kopyala."
    },
    {
      "title": "Veri sende kalır",
      "text": "Dosya tarayıcıda işlenir; sunucu yok, kayıt yok."
    }
  ],
  "steps": [
    {
      "title": "Dosyanı yükle",
      "text": "CSV ya da Excel dosyasını sürükleyip bırak."
    },
    {
      "title": "Sütunları tanımla",
      "text": "Her sütunun ölçek türünü seç, istersen bir grup değişkeni belirle."
    },
    {
      "title": "Sonuçları oku",
      "text": "Varsayımlar, test sonuçları, grafikler ve APA raporu hazır."
    }
  ],
  "run": "git clone https://github.com/virtusstats/virtusstats.github.io\ncd virtusstats.github.io && npm install\nnpm run dev\nnpm run deploy    # gh-pages'e yayınla",
  "stack": [
    "React",
    "Vite",
    "Tailwind",
    "simple-statistics",
    "jStat",
    "SheetJS"
  ],
  "note": "Tabula Latincede \"tablo\" demek. Canlı sürüm: virtusstats.github.io",
  "repo": "https://github.com/virtusstats/virtusstats.github.io"
};
