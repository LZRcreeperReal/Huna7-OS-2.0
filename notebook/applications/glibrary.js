/* =====================================================
   HUNA7-OS — APPS: GAME LIBRARY
   Full game library. NES, GBA, Flash, Unity, Iframe.
   Replaces writer.js entirely.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.Apps = Huna7.Apps || {};

Huna7.Apps.GLibrary = (() => {

  const GAMES = [
    // IFRAME
    { name:"prkr's Agario",      runner:"IFRAME",  game:"https://jptragar.glitch.me/",                                                        thumb:"https://cdn.jsdelivr.net/gh/joshmerlino/shsg-pfile/thumbs/prkrs-agario.jpg",            w:1200, ar:16/9 },
    { name:"1v1.lol",            runner:"IFRAME",  game:"https://ejvd3326248pklq0mtj313irgbc2vsrb-a-sites-opensocial.googleusercontent.com/gadgets/ifr?url=https://sites.google.com/site/s035r8h4/1v1.xml&container=enterprise&view=default&lang=en&country=ALL&sanitize=0&v=8d01559d545a3200&libs=core&mid=172&parent=https://sites.google.com/site/unblockedgameswtf/1v1-lol#USX6PB", thumb:"https://cdn.jsdelivr.net/gh/joshmerlino/shsg-pfile/thumbs/1v1lol.png",                w:1200, ar:16/9 },
    { name:"Baldi's Basic",      runner:"IFRAME",  game:"/built-games/baldis-basics/index.html",                                              thumb:"https://cdn.jsdelivr.net/gh/joshmerlino/shsg-pfile/thumbs/baldis-basic.jpg",            w:800,  ar:800/600 },
    { name:"Chrome Dino",        runner:"IFRAME",  game:"/built-games/chromedino/index.html",                                                 thumb:"https://cdn.jsdelivr.net/gh/joshmerlino/shsg-pfile/thumbs/chrome-dino.jpg",             w:600,  ar:3 },
    { name:"Cookie Clicker",     runner:"IFRAME",  game:"/built-games/cookieclicker/index.html",                                              thumb:"https://cdn.jsdelivr.net/gh/joshmerlino/shsg-pfile/thumbs/cookie-clicker.jpg",          w:1080, ar:3/2 },
    { name:"CSGOClicker",        runner:"IFRAME",  game:"/built-games/CSGOClicker/index.html",                                                thumb:"https://cdn.jsdelivr.net/gh/joshmerlino/shsg-pfile/thumbs/csgoclicker.jpg",             w:1080, ar:5/3 },
    { name:"Tanuki Sunset",      runner:"IFRAME",  game:"/built-games/takumiraccoon/index.html",                                              thumb:"https://cdn.jsdelivr.net/gh/joshmerlino/shsg-pfile/thumbs/tanuki-sunset.jpg",           w:800,  ar:800/660 },
    // UNITY
    { name:"Slope",              runner:"UNITY",   game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/slope_v7.json",             thumb:"https://cdn.jsdelivr.net/gh/joshmerlino/shsg-pfile/thumbs/slope.jpg",                  w:1200, ar:16/9 },
    { name:"Falling Ball",       runner:"UNITY",   game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/slope-ball.json",           thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/falling-ball.jpg",           w:1200, ar:16/9 },
    { name:"Rooftop Snipers",    runner:"UNITY",   game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/rooftop_snipers.json",      thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/rooftop-snipers.jpg",        w:793,  ar:16/9 },
    { name:"Subway Surfers",     runner:"UNITY",   game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/surfers.json",              thumb:"https://cdn.jsdelivr.net/gh/joshmerlino/shsg-pfile/thumbs/subway-surfers.jpg",         w:1200, ar:16/9 },
    // NES
    { name:"Bubble Bobble",      runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/bubble-bobble.nes",         thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/bubble-bobble.jpg",         w:640, ar:16/15 },
    { name:"Castlevania",        runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/castlevania.nes",            thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/castlevania.jpg",           w:640, ar:16/15 },
    { name:"Contra",             runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/contra.nes",                 thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/contra.jpg",               w:640, ar:16/15 },
    { name:"Donkey Kong",        runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/donkey-kong.nes",            thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/donkey-kong.jpg",          w:640, ar:16/15 },
    { name:"Dr. Mario",          runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/dr-mario.nes",               thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/dr-mario.jpg",             w:640, ar:16/15 },
    { name:"DuckTales",          runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/ducktales.nes",              thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/ducktales.jpg",            w:640, ar:16/15 },
    { name:"Excitebike",         runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/excitebike.nes",             thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/excitebike.jpg",           w:640, ar:16/15 },
    { name:"Final Fantasy",      runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/final-fantasy-1.nes",        thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/final-fantasy-1.jpg",      w:640, ar:16/15 },
    { name:"Final Fantasy 2",    runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/final-fantasy-ii.nes",       thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/final-fantasy-ii.jpg",    w:640, ar:16/15 },
    { name:"Final Fantasy 3",    runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/final-fantasy-iii.nes",      thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/final-fantasy-iii.jpg",   w:640, ar:16/15 },
    { name:"Galaga",             runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/galaga.nes",                 thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/galaga.jpg",               w:640, ar:16/15 },
    { name:"Kid Icarus",         runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/kid-icarus.nes",             thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/kid-icarus.jpg",           w:640, ar:16/15 },
    { name:"Kirby's Adventure",  runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/kirbys-adventure.nes",       thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/kirbys-adventure.jpg",     w:640, ar:16/15 },
    { name:"Legend of Zelda",    runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/legend-of-zelda.nes",        thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/legend-of-zelda.jpg",      w:640, ar:16/15 },
    { name:"Mega Man",           runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/mega-man.nes",               thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/mega-man.jpg",             w:640, ar:16/15 },
    { name:"Metroid",            runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/metroid.nes",                thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/metroid.jpg",              w:640, ar:16/15 },
    { name:"Super Mario Bros.",  runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/super-mario-bros.nes",       thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/super-mario-bros.jpg",     w:640, ar:16/15 },
    { name:"Super Mario Bros. 2",runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/super-mario-bros-2.nes",     thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/super-mario-bros-2.jpg",  w:640, ar:16/15 },
    { name:"Super Mario Bros. 3",runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/super-mario-bros-3.nes",     thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/super-mario-bros-3.jpg",  w:640, ar:16/15 },
    { name:"Tetris NES",         runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/tetris-nes.nes",             thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/tetris-nes.jpg",           w:640, ar:16/15 },
    { name:"Teenage Mutant Ninja Turtles",runner:"EMULATOR_NES",game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/teenage-mutant-ninja-turtles.nes",thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/teenage-mutant-ninja-turtles.jpg",w:640,ar:16/15 },
    { name:"Tecmo Bowl",         runner:"EMULATOR_NES", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/tecmo-bowl.nes",             thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/tecmo-bowl.jpg",           w:640, ar:16/15 },
    // GBA
    { name:"Advance Wars",       runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/advance-wars.gba",           thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/advance-wars.jpg" },
    { name:"Advance Wars 2",     runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/advance-wars-2.gba",         thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/advance-wars-2.jpg" },
    { name:"Castlevania: Aria of Sorrow",runner:"EMULATOR_GBA",game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/castlevania---aria-of-sorrow.gba",thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/castlevania---aria-of-sorrow.jpg" },
    { name:"Fire Emblem",        runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/fire-emblem.gba",             thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/fire-emblem.jpg" },
    { name:"Golden Sun",         runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/golden-sun.gba",             thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/golden-sun.jpg" },
    { name:"Mario Kart",         runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/mario-kart.gba",             thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/mario-kart.jpg" },
    { name:"Pokémon Emerald",    runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/pokemon-emerald.gba",         thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/pokemon-emerald.jpg" },
    { name:"Pokémon Ruby",       runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/pokemon-ruby.gba",           thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/pokemon-ruby.jpg" },
    { name:"Pokémon Sapphire",   runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/pokemon-sapphire.gba",       thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/pokemon-sapphire.jpg" },
    { name:"Pokémon FireRed",    runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/pokemon-red.gba",            thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/pokemon-red.jpg" },
    { name:"Pokémon Ash Gray",   runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/pokemon-ash-gray.gba",       thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/pokemon-ash-gray.jpg" },
    { name:"Sonic Advance",      runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/sonic-advance.gba",          thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/sonic-advance.jpg" },
    { name:"Wario Ware",         runner:"EMULATOR_GBA", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/wario-ware.gba",             thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/wario-ware.jpg" },
    // FLASH (RUFFLE)
    { name:"4th and Goal 2018",  runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/4th-and-goal-2018.swf",            thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/4th-and-goal-2018.jpg",   w:800, ar:800/588 },
    { name:"B-Cubed",            runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/b-cubed.swf",                      thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/b-cubed.jpg",             w:800, ar:80/72 },
    { name:"Bloons Tower Defense 2",runner:"RUFFLE",game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/bloons-tower-defense-2.swf",     thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/bloons-tower-defense-2.jpg",w:800,ar:4/3 },
    { name:"Bloons Tower Defense 1",runner:"RUFFLE",game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/bloons-tower-defense-1.swf",     thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/bloons-tower-defense-1.jpg",w:800,ar:4/3 },
    { name:"Bloxorz",            runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/bloxorz.swf",                      thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/bloxorz.jpg",             w:800, ar:11/6 },
    { name:"Bubble Trouble",     runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/bubble-trouble.swf",               thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/bubble-trouble.jpg",      w:800, ar:800/518 },
    { name:"Cubefield",          runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/cubefield.swf",                    thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/cubefield.jpg",           w:800, ar:800/588 },
    { name:"Dad N Me",           runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/dad-n-me.swf",                     thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/dad-n-me.jpg",            w:800, ar:4/3 },
    { name:"Dragon Ball Z Devolution",runner:"RUFFLE",game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/dragon-ball-z-devolution.swf", thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/dragon-ball-z-devolution.jpg",w:800,ar:80/47 },
    { name:"Duck Life 4",        runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/ellieeet123/swf/swf/duck-life-4.swf",                           thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/duck-life-4.jpg",         w:750, ar:75/48 },
    { name:"Duck Life 3",        runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/duck-life-3.swf",                  thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/duck-life-3.jpg",         w:800, ar:800/502 },
    { name:"Duck Life 2",        runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/duck-life-2.swf",                  thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/duck-life-2.jpg",         w:800, ar:800/588 },
    { name:"Duck Life 1",        runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/duck-life-1.swf",                  thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/duck-life-1.jpg",         w:800, ar:4/3 },
    { name:"Electric Man 2",     runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/electric-man-2.swf",               thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/electric-man-2.jpg",      w:800, ar:80/49 },
    { name:"Gunblood",           runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/gunblood.swf",                     thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/gunblood.jpg",            w:800, ar:800/462 },
    { name:"Gun Mayhem",         runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/gun-mayhem.swf",                   thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/gun-mayhem.jpg",          w:800, ar:80/52 },
    { name:"Gun Mayhem 2",       runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/gun-mayhem-2.swf",                 thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/gun-mayhem-2.jpg",        w:800, ar:80/53 },
    { name:"Henry Stickmin - Breaking the Bank",runner:"RUFFLE",game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/henry-stickmin---breaking-the-bank.swf",thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/henry-stickmin---breaking-the-bank.jpg",w:800,ar:80/58 },
    { name:"Henry Stickmin - Stealing the Diamond",runner:"RUFFLE",game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/henry-stickmin---stealing-the-diamond.swf",thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/henry-stickmin---stealing-the-diamond.jpg",w:800,ar:4/3 },
    { name:"Impossible Quiz",    runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/impossible-quiz.swf",               thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/impossible-quiz.jpg",     w:800, ar:4/3 },
    { name:"Impossible Quiz 2",  runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/impossible-quiz-2.swf",             thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/impossible-quiz-2.jpg",  w:800, ar:4/3 },
    { name:"Learn to Fly",       runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/learn-to-fly.swf",                 thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/learn-to-fly.jpg",       w:800, ar:80/59 },
    { name:"Learn to Fly 2",     runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/learn-to-fly-2.swf",               thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/learn-to-fly-2.jpg",    w:800, ar:80/59 },
    { name:"Madness Project Nexus",runner:"RUFFLE",game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/madness-project-nexus.swf",       thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/madness-project-nexus.jpg",w:800,ar:4/3 },
    { name:"Minesweeper",        runner:"RUFFLE", game:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/games/minesweeper.swf",                  thumb:"https://cdn.jsdelivr.net/gh/JoshMerlino/shsg-pfile/thumbs/minesweeper.jpg",        w:800, ar:4/3 },
  ];

  const RUNNER_LABELS = {
    IFRAME: 'Browser', UNITY: 'Unity', EMULATOR_NES: 'NES',
    EMULATOR_GBA: 'GBA', RUFFLE: 'Flash',
  };
  const RUNNER_COLORS = {
    IFRAME:'#5E7FFF', UNITY:'#28C840', EMULATOR_NES:'#e05252',
    EMULATOR_GBA:'#FF9800', RUFFLE:'#FF6B9D',
  };

  function launch(pid, options = {}) {
    const { id, contentEl } = Huna7.Desk.createWindow({
      title: 'Game Library', appId: 'glibrary', width: 980, height: 620,
    });
    contentEl.style.cssText = 'display:flex;flex-direction:column;background:#0a0a0f;';

    // ── Toolbar ──────────────────────────────────────────
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--h7-border);flex-shrink:0;';

    const searchInput = document.createElement('input');
    searchInput.className = 'h7-input';
    searchInput.placeholder = 'Search games...';
    searchInput.style.cssText = 'flex:1;height:30px;padding:4px 10px;font-size:13px;';

    // Filter pills
    const filters = ['All', 'Browser', 'NES', 'GBA', 'Flash', 'Unity'];
    let activeFilter = 'All';
    const pillWrap = document.createElement('div');
    pillWrap.style.cssText = 'display:flex;gap:4px;flex-shrink:0;';

    const pills = filters.map(f => {
      const pill = document.createElement('button');
      pill.textContent = f;
      pill.style.cssText = `padding:3px 10px;border-radius:20px;border:1px solid var(--h7-border);
        background:${f==='All'?'var(--h7-accent)':'transparent'};
        color:${f==='All'?'#fff':'var(--h7-text-muted)'};font-size:11px;cursor:pointer;
        transition:all 150ms ease;`;
      pill.addEventListener('click', () => {
        activeFilter = f;
        pills.forEach(p => {
          const isActive = p.textContent === f;
          p.style.background = isActive ? 'var(--h7-accent)' : 'transparent';
          p.style.color = isActive ? '#fff' : 'var(--h7-text-muted)';
        });
        renderGrid();
      });
      return pill;
    });
    pills.forEach(p => pillWrap.appendChild(p));

    const countEl = document.createElement('div');
    countEl.style.cssText = 'font-size:11px;color:var(--h7-text-muted);flex-shrink:0;white-space:nowrap;';

    toolbar.append(searchInput, pillWrap, countEl);

    // ── Game grid ────────────────────────────────────────
    const grid = document.createElement('div');
    grid.style.cssText = 'flex:1;overflow-y:auto;padding:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;align-content:start;';

    contentEl.append(toolbar, grid);

    // ── Game viewer overlay ──────────────────────────────
    let activeViewer = null;

    function openGame(game) {
      if (activeViewer) activeViewer.remove();

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute;inset:0;background:#000;display:flex;flex-direction:column;z-index:10;';

      const viewToolbar = document.createElement('div');
      viewToolbar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid var(--h7-border);flex-shrink:0;background:rgba(0,0,0,0.8);';

      const backBtn = document.createElement('button');
      backBtn.className = 'h7-btn h7-btn-ghost';
      backBtn.style.cssText = 'padding:4px 10px;height:28px;font-size:12px;';
      backBtn.innerHTML = Huna7.Glossary.get('arrowLeft', 13) + ' <span>Back</span>';
      backBtn.addEventListener('click', () => { overlay.remove(); activeViewer = null; Huna7.Desk.setTitle(id, 'Game Library'); });

      const gameTitle = document.createElement('div');
      gameTitle.style.cssText = 'flex:1;font-size:13px;font-weight:600;';
      gameTitle.textContent = game.name;

      const runnerBadge = document.createElement('span');
      runnerBadge.style.cssText = `padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;
        background:${RUNNER_COLORS[game.runner] || '#5E7FFF'}22;
        color:${RUNNER_COLORS[game.runner] || '#5E7FFF'};`;
      runnerBadge.textContent = RUNNER_LABELS[game.runner] || game.runner;

      const fsBtn = document.createElement('button');
      fsBtn.className = 'h7-btn h7-btn-ghost';
      fsBtn.style.cssText = 'padding:4px 8px;height:28px;';
      fsBtn.innerHTML = Huna7.Glossary.get('maximize', 13);
      fsBtn.title = 'Fullscreen';
      fsBtn.addEventListener('click', () => {
        const f = overlay.querySelector('iframe');
        if (f?.requestFullscreen) f.requestFullscreen();
      });

      viewToolbar.append(backBtn, gameTitle, runnerBadge, fsBtn);

      const frameWrap = document.createElement('div');
      frameWrap.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#000;';

      const frame = document.createElement('iframe');
      frame.allow = 'autoplay; fullscreen; gamepad; keyboard';
      frame.style.cssText = 'border:none;display:block;';

      // Build srcdoc based on runner - all isolated from parent OS
      const buildSrcdoc = (g) => {
        const runnerScripts = {
          EMULATOR_NES: `<script src="https://cdn.jsdelivr.net/npm/jsnes@1.0.2/dist/jsnes.min.js"><\/script>`,
          EMULATOR_GBA: `<script src="https://cdn.jsdelivr.net/gh/nicholasstephan/gba.js/gba.js"><\/script>`,
          UNITY: `<script src="https://cdn.jsdelivr.net/npm/unity-webgl@3.0.0/dist/index.js"><\/script>`,
          RUFFLE: `<script src="https://unpkg.com/@ruffle-rs/ruffle"><\/script>`,
        };

        if (g.runner === 'IFRAME') {
          // Direct iframe src (not srcdoc) for browser games
          return null;
        }

        if (g.runner === 'RUFFLE') {
          return `<!DOCTYPE html><html><head>
            <script src="https://unpkg.com/@ruffle-rs/ruffle"><\/script>
            <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#000;display:flex;align-items:center;justify-content:center;width:100vw;height:100vh;}
            ruffle-player{width:100%;height:100%;}</style>
          </head><body>
            <script>window.RufflePlayer=window.RufflePlayer||{};window.addEventListener("load",()=>{const r=window.RufflePlayer.newest();const p=r.createPlayer();p.style.width="100%";p.style.height="100%";document.body.appendChild(p);p.load("${g.game}");});<\/script>
          </body></html>`;
        }

        if (g.runner === 'EMULATOR_NES' || g.runner === 'EMULATOR_GBA') {
          return `<!DOCTYPE html><html><head>
            <style>*{margin:0;padding:0;}body{background:#000;display:flex;align-items:center;justify-content:center;width:100vw;height:100vh;color:#fff;font-family:sans-serif;}</style>
          </head><body>
            <div style="text-align:center;padding:20px;">
              <div style="font-size:14px;margin-bottom:12px;opacity:0.7;">Loading ${g.name}...</div>
              <div style="font-size:12px;opacity:0.4;">Emulator: ${g.runner}</div>
              <div style="margin-top:16px;font-size:11px;opacity:0.3;">
                <a href="${g.game}" target="_blank" style="color:#5E7FFF">Download ROM</a>
              </div>
            </div>
          </body></html>`;
        }

        if (g.runner === 'UNITY') {
          return `<!DOCTYPE html><html><head>
            <style>*{margin:0;padding:0;}body{background:#000;display:flex;align-items:center;justify-content:center;width:100vw;height:100vh;color:#fff;font-family:sans-serif;}</style>
          </head><body>
            <div style="text-align:center;">
              <div style="font-size:14px;margin-bottom:8px;opacity:0.7;">Unity: ${g.name}</div>
              <div style="font-size:12px;opacity:0.4;">Loading Unity WebGL...</div>
            </div>
          </body></html>`;
        }

        return `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;}body{background:#000;}</style></head><body></body></html>`;
      };

      const srcdoc = buildSrcdoc(game);
      if (srcdoc === null && game.runner === 'IFRAME') {
        // Direct URL - use src not srcdoc
        frame.src = game.game;
        const w = game.w || 800;
        const ar = game.ar || (16/9);
        const maxW = contentEl.offsetWidth - 0;
        const maxH = contentEl.offsetHeight - 40;
        const fw = Math.min(w, maxW);
        const fh = fw / ar;
        const fh2 = Math.min(fh, maxH);
        const fw2 = fh2 * ar;
        frame.style.width  = fw2 + 'px';
        frame.style.height = fh2 + 'px';
      } else {
        frame.srcdoc = srcdoc || '';
        frame.style.width  = '100%';
        frame.style.height = '100%';
      }

      frameWrap.appendChild(frame);
      overlay.append(viewToolbar, frameWrap);
      contentEl.appendChild(overlay);
      activeViewer = overlay;
      Huna7.Desk.setTitle(id, 'Game Library — ' + game.name);
    }

    function renderGrid() {
      grid.innerHTML = '';
      const q = searchInput.value.toLowerCase().trim();
      const runnerMap = { 'Browser':'IFRAME','NES':'EMULATOR_NES','GBA':'EMULATOR_GBA','Flash':'RUFFLE','Unity':'UNITY' };
      const filtered = GAMES.filter(g => {
        const matchFilter = activeFilter === 'All' || g.runner === runnerMap[activeFilter];
        const matchSearch = !q || g.name.toLowerCase().includes(q);
        return matchFilter && matchSearch;
      });

      countEl.textContent = filtered.length + ' game' + (filtered.length !== 1 ? 's' : '');

      if (!filtered.length) {
        grid.appendChild(Huna7.Sketch.emptyState('star', 'No games found', 'Try a different search or filter'));
        return;
      }

      filtered.forEach(game => {
        const card = document.createElement('div');
        card.style.cssText = `border-radius:10px;overflow:hidden;cursor:pointer;
          background:var(--h7-bg-glass);border:1px solid var(--h7-border);
          transition:transform 160ms ease,box-shadow 160ms ease,border-color 160ms ease;`;
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-3px)';
          card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
          card.style.borderColor = 'rgba(255,255,255,0.2)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
          card.style.boxShadow = '';
          card.style.borderColor = 'var(--h7-border)';
        });
        card.addEventListener('click', () => openGame(game));

        // Thumbnail
        const thumbWrap = document.createElement('div');
        thumbWrap.style.cssText = 'width:100%;aspect-ratio:4/3;background:#111;overflow:hidden;position:relative;';
        const thumb = document.createElement('img');
        thumb.src = game.thumb;
        thumb.alt = game.name;
        thumb.loading = 'lazy';
        thumb.style.cssText = 'width:100%;height:100%;object-fit:cover;transition:transform 300ms ease;';
        card.addEventListener('mouseenter', () => thumb.style.transform = 'scale(1.05)');
        card.addEventListener('mouseleave', () => thumb.style.transform = '');

        // Runner badge on thumbnail
        const badge = document.createElement('div');
        badge.style.cssText = `position:absolute;top:6px;right:6px;padding:2px 7px;border-radius:10px;
          font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;
          background:${RUNNER_COLORS[game.runner] || '#5E7FFF'};color:#fff;`;
        badge.textContent = RUNNER_LABELS[game.runner] || game.runner;

        thumbWrap.append(thumb, badge);

        // Name
        const info = document.createElement('div');
        info.style.cssText = 'padding:8px 9px;';
        const nameEl = document.createElement('div');
        nameEl.style.cssText = 'font-size:12px;font-weight:500;color:var(--h7-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        nameEl.textContent = game.name;
        nameEl.title = game.name;
        info.appendChild(nameEl);

        card.append(thumbWrap, info);
        grid.appendChild(card);
      });

      Huna7.Animations.staggerReveal(Array.from(grid.children).filter(c => c.tagName === 'DIV'), 20);
    }

    searchInput.addEventListener('input', Huna7.Helpers.debounce(renderGrid, 200));
    renderGrid();

    return { windowId: id };
  }

  return { launch };
})();
