// Сборка: node build.mjs  ->  папка dist/
import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const SITE = 'https://uraonline.ru';
const NAME = 'Интеллект клуб Юрия Васильева';
const NAV = [['/klub/', 'Клуб'], ['/kurs-super-jump/', 'Курс'], ['/go-smile/', 'Go Smile'],
  ['/salavatskiy-rayon/', 'Салаватский район'], ['/svoy-klub/', 'Свой клуб'], ['/mozg-i-intellekt/', 'Мозг и интеллект'], ['/kontakty/', 'Контакты']];
const FOOT = [['/faq/', 'Вопросы'], ['/ulybka-i-smeh/', 'Улыбка и смех'], ['/partnery/', 'Партнёры'], ['/raskrytie-partnerstva/', 'Раскрытие партнёрства'],
  ['/politika-konfidencialnosti/', 'Политика'], ['/cookie/', 'Cookie']];
const cssV = createHash('md5').update(await readFile('public/style.css')).digest('hex').slice(0, 8);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const files = (await readdir('content')).filter(f => f.endsWith('.html'));
const pages = [];
for (const f of files) {
  const raw = await readFile(`content/${f}`, 'utf8');
  const m = raw.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  pages.push({ ...JSON.parse(m[1]), body: raw.slice(m[0].length), file: f });
}
const have = new Set(pages.map(p => p.path));
const links = list => list.filter(([u]) => have.has(u)).map(([u, t]) => `<a href="${u}">${t}</a>`).join('\n');

const metrika = `<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=105400274','ym');ym(105400274,'init',{ssr:true,webvisor:true,clickmap:true,referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});</script>`;
const tail = `<script>document.addEventListener('click',function(e){var a=e.target.closest('[data-goal]');if(a&&window.ym)ym(105400274,'reachGoal',a.dataset.goal)});</script>
<script>(function(){var b=document.getElementById('ck');if(!b)return;var ok=false;try{ok=localStorage.getItem('ck')==='1'}catch(e){}if(ok){b.style.display='none';return}b.style.display='flex';b.querySelector('button').addEventListener('click',function(){try{localStorage.setItem('ck','1')}catch(e){}b.style.display='none'})})();</script>`;

const org = { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Интеллект-клуб Юрия Васильева', url: `${SITE}/`,
  telephone: '+79613689909', founder: { '@type': 'Person', name: 'Юрий Васильев' },
  sameAs: ['https://vk.ru/maloazclub', 'https://t.me/uravasilev1'] };

const today = new Date().toISOString().slice(0, 10);
const lastmod = p => { try { return execSync(`git log -1 --format=%cs -- content/${p.file}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || today; } catch { return today; } };

await rm('dist', { recursive: true, force: true });
await cp('public', 'dist', { recursive: true });

for (const p of pages) {
  const url = SITE + p.path;
  const crumbs = p.crumbs || [];
  const graph = [org];
  if (p.path === '/') graph.push({ '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: NAME, inLanguage: 'ru', publisher: { '@id': `${SITE}/#org` } });
  if (crumbs.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: [...crumbs.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITE + u })), { '@type': 'ListItem', position: crumbs.length + 1, name: p.h1, item: url }] });
  if (p.extra) graph.push(...p.extra);
  const crumbHtml = crumbs.length ? `<nav class="crumbs" aria-label="Путь">${crumbs.map(([n, u]) => `<a href="${u}">${n}</a>`).join(' / ')} / ${esc(p.h1)}</nav>` : '';
  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css?v=${cssV}">
<meta property="og:type" content="${p.path === '/' ? 'website' : 'article'}">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="${NAME}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/img/vasilev-yuriy.png">
<meta name="yandex-verification" content="7d944636c066e0b9">
${metrika}
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
</head>
<body>
<noscript><div><img src="https://mc.yandex.ru/watch/105400274" style="position:absolute;left:-9999px" alt=""></div></noscript>
<header><div class="wrap"><a class="brand" href="/">${NAME}</a><nav aria-label="Основное меню">${links(NAV)}</nav></div></header>
<main class="wrap">
${crumbHtml}
<h1>${esc(p.h1)}</h1>
${p.body}
</main>
<footer><div class="wrap"><nav aria-label="Служебные страницы">${links(FOOT)}</nav>
<p>© ${NAME}. Васильев Юрий Михайлович, самозанятый. Тел. <a href="tel:+79613689909" data-goal="phone_click">+7 961 368 99 09</a>, Telegram <a href="https://t.me/uravasilev1" data-goal="tg_click">@uravasilev1</a>. Информация не заменяет консультацию врача или психолога.</p></div></footer>
<div id="ck"><span>Сайт использует cookie и Яндекс Метрику для статистики. Продолжая, вы соглашаетесь с <a href="/cookie/">политикой cookie</a>.</span><button type="button">Принять</button></div>
${tail}
</body>
</html>`;
  const dir = p.path === '/' ? 'dist' : `dist${p.path}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/index.html`, html);
}

const urls = pages.map(p => `  <url><loc>${SITE}${p.path}</loc><lastmod>${lastmod(p)}</lastmod></url>`).join('\n');
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`Собрано страниц: ${pages.length}`);
