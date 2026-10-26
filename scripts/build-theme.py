#!/usr/bin/env python3
"""Build the Shopify theme in shopify-theme/ from the static site.

The static HTML stays the source of truth: edit the pages, run this, then
`shopify theme push`. Shared chrome (loader, header, menu, footer, drawers,
symbols, scripts) becomes layout/theme.liquid; each page's <main> becomes one
section, wired to a JSON template.
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'shopify-theme'
SRC = ROOT / 'theme-src'

# static page -> (template name, section name)
PAGES = {
    'index': ('index', 'kulars-home'),
    'teamwear': ('page.teamwear', 'kulars-teamwear'),
    'club-shop': ('page.club-shop', 'kulars-club-shop'),
    'clubs': ('page.clubs', 'kulars-clubs'),
    'our-story': ('page.our-story', 'kulars-our-story'),
    'custom-kits': ('page.custom-kits', 'kulars-custom-kits'),
}
ROUTES = {p: '/' if p == 'index' else f'/pages/{p}' for p in PAGES}


def route_links(html):
    """teamwear.html?cat=bags#x -> /pages/teamwear?cat=bags#x"""
    return re.sub(r'(?<![\w/.-])(' + '|'.join(map(re.escape, PAGES)) + r')\.html',
                  lambda m: ROUTES[m.group(1)], html)


def liquid_assets(html):
    html = re.sub(r'(src|href)="assets/(?:img|logo|css|js)/([^"?]+)(?:\?[^"]*)?"',
                  lambda m: f'{m.group(1)}="{{{{ \'{m.group(2)}\' | asset_url }}}}"', html)
    return html


def read(name):
    return (ROOT / f'{name}.html').read_text()


def split(html):
    head_end = html.index('<body')
    main_start = html.index('<main')
    main_end = html.index('</main>') + len('</main>')
    body_open_end = html.index('>', head_end) + 1
    return html[:head_end], html[body_open_end:main_start], html[main_start:main_end], html[main_end:html.index('</body>')]


def unmark_current(chrome):
    return chrome.replace(' aria-current="page"', '')


def mark_current(chrome):
    """Re-add aria-current to nav links with Liquid, keyed by request path."""
    def sub(m):
        href = m.group(1)
        return f'<a href="{href}"{m.group(2)}{{% if request.path == \'{href}\' %}} aria-current="page"{{% endif %}}'
    return re.sub(r'<a href="(/pages/[\w-]+)"((?: class="link-roll")?)', sub, chrome)


def main_section(main_html):
    inner = re.sub(r'^<main[^>]*>', '', main_html)
    inner = inner[:inner.rindex('</main>')]
    return liquid_assets(route_links(inner)).strip('\n') + '\n'


def section_file(name, body):
    title = name.replace('kulars-', '').replace('-', ' ').title()
    schema = {'name': title, 'tag': 'div', 'class': 'kulars-section'}
    return body + '\n{% schema %}\n' + json.dumps(schema, indent=2) + '\n{% endschema %}\n'


def build_layout():
    home = read('index')
    other = read('clubs')
    head, top_home, _, bottom = split(home)
    _, top_other, _, _ = split(other)

    loader = re.search(r'\n<!-- =+ LOADER.*?</div>\n</div>\n', top_home, re.S).group(0)
    squash = lambda t: re.sub(r'\s+', ' ', unmark_current(t))
    assert squash(top_home.replace(loader, '\n')) == squash(top_other), 'page chrome drifted'

    top = mark_current(liquid_assets(route_links(unmark_current(top_other))))
    top = top.replace('<div class="cursor"', '{% if template.name == \'index\' %}' + loader.strip('\n') + '\n{% endif %}\n\n<div class="cursor"', 1)
    bottom = liquid_assets(route_links(bottom))
    bottom = bottom.replace('<script src="{{ \'data.js\' | asset_url }}"></script>',
                            '<script>window.KULARS_IMG = {{ \'walk.webp\' | asset_url | split: \'walk.webp\' | first | json }}; window.KULARS_ROUTES = { cart: {{ routes.cart_url | json }} };</script>\n'
                            '<script src="{{ \'data.js\' | asset_url }}"></script>')

    head = liquid_assets(head)
    head = re.sub(r'<title>.*?</title>', '<title>{{ kulars_title }}</title>', head)
    head = re.sub(r'<meta name="description" content="[^"]*">',
                  '{% if kulars_desc != blank %}<meta name="description" content="{{ kulars_desc | escape }}">{% endif %}', head)
    head = head.replace('</head>', '{{ content_for_header }}\n</head>')

    # a page uses its Kulars design when its template is page.<name> or its handle is <name>
    whens = []
    for page in PAGES:
        if page == 'index':
            continue
        html = read(page)
        whens.append(f"""    when '{page}'
      assign body_class = '{re.search(r'<body class="([^"]*)"', html).group(1)}'
      assign kulars_title = {json.dumps(re.search(r'<title>(.*?)</title>', html).group(1))}
      assign kulars_desc = {json.dumps(re.search(r'<meta name="description" content="([^"]*)"', html).group(1))}""")
    home = read('index')
    body_class = """{%- liquid
  assign kulars_page = template.suffix
  if template.name == 'page' and kulars_page == blank
    assign kulars_page = page.handle
  endif
  assign body_class = 'page-' | append: template.name
  assign kulars_title = page_title | append: ' | ' | append: shop.name
  assign kulars_desc = page_description
  case kulars_page
""" + '\n'.join(whens) + f"""
  endcase
  if template.name == 'index'
    assign body_class = '{re.search(r'<body class="([^"]*)"', home).group(1)}'
    assign kulars_title = {json.dumps(re.search(r'<title>(.*?)</title>', home).group(1))}
    assign kulars_desc = {json.dumps(re.search(r'<meta name="description" content="([^"]*)"', home).group(1))}
  endif
-%}}"""
    main_class = '{% unless template.name == \'index\' %} class="page"{% endunless %}'
    return (body_class + '\n' + head + f'<body class="{{{{ body_class }}}}">' + top
            + f'<main id="top"{main_class}>\n{{{{ content_for_layout }}}}\n</main>' + bottom + '</body>\n</html>\n')


def fix_js(js):
    js = js.replace("const IMG = 'assets/img/';", "const IMG = window.KULARS_IMG || 'assets/img/';")
    js = route_links(js)
    js = js.replace("location.pathname.endsWith('/index.html')", "location.pathname === '/'")
    return js


GENERIC = {
    # fallback templates so every Shopify URL renders inside the Kulars chrome
    'kulars-main-page': '''<section class="section">
  <div class="wrap">
    <h1 class="h-display">{{ page.title }}</h1>
    <div class="rte">{{ page.content }}</div>
  </div>
</section>''',
    'kulars-main-product': '''<section class="section">
  <div class="wrap">
    <h1 class="h-display">{{ product.title }}</h1>
    <p>{{ product.price | money }}</p>
    <div class="rte">{{ product.description }}</div>
  </div>
</section>''',
    'kulars-main-collection': '''<section class="section">
  <div class="wrap">
    <h1 class="h-display">{{ collection.title }}</h1>
    {%- paginate collection.products by 24 -%}
      <ul>{% for p in collection.products %}<li><a href="{{ p.url }}">{{ p.title }}</a> {{ p.price | money }}</li>{% endfor %}</ul>
    {%- endpaginate -%}
  </div>
</section>''',
    'kulars-main-cart': '''<section class="section">
  <div class="wrap">
    <h1 class="h-display">Your bag</h1>
    {% if cart.item_count > 0 %}
      <form action="{{ routes.cart_url }}" method="post">
        <ul>{% for item in cart.items %}<li>{{ item.quantity }} × {{ item.title }} — {{ item.final_line_price | money }}</li>{% endfor %}</ul>
        <button class="btn" type="submit" name="checkout"><span>Checkout</span></button>
      </form>
    {% else %}<p>Your bag is empty.</p>{% endif %}
  </div>
</section>''',
    'kulars-main-search': '''<section class="section">
  <div class="wrap">
    <h1 class="h-display">Search</h1>
    <form action="{{ routes.search_url }}"><input type="search" name="q" value="{{ search.terms | escape }}"></form>
    {% if search.performed %}<ul>{% for r in search.results %}<li><a href="{{ r.url }}">{{ r.title }}</a></li>{% endfor %}</ul>{% endif %}
  </div>
</section>''',
    'kulars-404': '''<section class="section">
  <div class="wrap">
    <h1 class="h-display">Page not found</h1>
    <p><a class="btn" href="/"><span>Back home</span></a></p>
  </div>
</section>''',
    'kulars-main-list': '''<section class="section">
  <div class="wrap">
    <h1 class="h-display">{{ page_title }}</h1>
    {% for c in collections %}<p><a href="{{ c.url }}">{{ c.title }}</a></p>{% endfor %}
  </div>
</section>''',
    'kulars-main-blog': '''<section class="section">
  <div class="wrap">
    <h1 class="h-display">{{ page_title }}</h1>
    {% if article %}<div class="rte">{{ article.content }}</div>{% else %}{% for a in blog.articles %}<p><a href="{{ a.url }}">{{ a.title }}</a></p>{% endfor %}{% endif %}
  </div>
</section>''',
}
GENERIC_TEMPLATES = {
    'page': 'kulars-main-page', 'product': 'kulars-main-product', 'collection': 'kulars-main-collection',
    'cart': 'kulars-main-cart', 'search': 'kulars-main-search', '404': 'kulars-404',
    'list-collections': 'kulars-main-list', 'blog': 'kulars-main-blog', 'article': 'kulars-main-blog',
}


def template_json(section):
    return json.dumps({'sections': {'main': {'type': section, 'settings': {}}}, 'order': ['main']}, indent=2) + '\n'


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    for d in ['layout', 'templates', 'sections', 'snippets', 'assets', 'config', 'locales']:
        (OUT / d).mkdir(parents=True)

    (OUT / 'layout/theme.liquid').write_text(build_layout())

    for page, (tpl, sec) in PAGES.items():
        _, _, main_html, _ = split(read(page))
        if page == 'index':
            (OUT / f'sections/{sec}.liquid').write_text(section_file(sec, main_section(main_html)))
        else:
            (OUT / f'snippets/kulars-page-{page}.liquid').write_text(main_section(main_html))
            (OUT / f'sections/{sec}.liquid').write_text(section_file(sec, f"{{% render 'kulars-page-{page}' %}}\n"))
        (OUT / f'templates/{tpl}.json').write_text(template_json(sec))

    by_handle = ''.join(f"\n  {{%- when '{p}' -%}}{{% render 'kulars-page-{p}' %}}" for p in PAGES if p != 'index')
    GENERIC['kulars-main-page'] = '{%- case page.handle -%}' + by_handle + '\n  {%- else -%}\n' + GENERIC['kulars-main-page'] + '\n{%- endcase -%}'
    for sec, body in GENERIC.items():
        (OUT / f'sections/{sec}.liquid').write_text(section_file(sec, body + '\n'))
    for tpl, sec in GENERIC_TEMPLATES.items():
        (OUT / f'templates/{tpl}.json').write_text(template_json(sec))
    (OUT / 'templates/gift_card.liquid').write_text(
        '{% layout none %}<!doctype html><html><head><title>{{ shop.name }} gift card</title>{{ content_for_header }}</head>'
        '<body><h1>{{ gift_card.balance | money }}</h1><p>{{ gift_card.code | format_code }}</p></body></html>\n')

    for sub in ['img', 'logo']:
        for f in (ROOT / 'assets' / sub).iterdir():
            shutil.copy(f, OUT / 'assets' / f.name)
    shutil.copy(ROOT / 'assets/css/main.css', OUT / 'assets/main.css')
    shutil.copy(ROOT / 'assets/js/data.js', OUT / 'assets/data.js')
    (OUT / 'assets/data.js').write_text(route_links((ROOT / 'assets/js/data.js').read_text()))
    (OUT / 'assets/main.js').write_text(fix_js((ROOT / 'assets/js/main.js').read_text()))

    (OUT / 'config/settings_schema.json').write_text(json.dumps([{
        'name': 'theme_info', 'theme_name': 'Kulars', 'theme_version': '1.0.0',
        'theme_author': 'Kulars', 'theme_documentation_url': 'https://kulars-store.myshopify.com',
        'theme_support_url': 'https://kulars-store.myshopify.com'}], indent=2) + '\n')
    (OUT / 'config/settings_data.json').write_text(json.dumps({'current': {}}, indent=2) + '\n')
    (OUT / 'locales/en.default.json').write_text('{}\n')

    # Shopify-only files (password page etc.) live in theme-src/ and are copied over as-is
    for f in SRC.rglob('*'):
        if f.is_file():
            dest = OUT / f.relative_to(SRC)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(f, dest)
    lockup = re.search(r'<svg class="loader__logo".*?</svg>', read('index'), re.S).group(0)
    (OUT / 'snippets/kulars-lockup.liquid').write_text(lockup.replace(' class="loader__logo"', ' aria-hidden="true"') + '\n')
    pattern = re.search(r'--k-pattern: url\(".*?"\);', (ROOT / 'assets/css/main.css').read_text()).group(0)
    css = OUT / 'assets/kulars-password.css'
    css.write_text(css.read_text().replace('/*K_PATTERN*/', pattern))
    print(f'Built {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    build()
