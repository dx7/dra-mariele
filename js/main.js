/* Dra. Mariele Wouters — interações do site (sem dependências) */
(function () {
  'use strict';

  var WA = 'https://wa.me/5544988559797';
  function waLink(text) { return WA + '?text=' + encodeURIComponent(text); }

  /* ---------- Menu no celular ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Abrir menu');
      }
    });
  }

  /* ---------- Mapa de consultas ----------
     Calendário mínimo do Ministério da Saúde (meses). Ajuste aqui se a Dra.
     preferir outro calendário (ex.: o da SBP). */
  var CHECKPOINTS = [
    { m: 0.25, label: '1ª semana',    name: 'consulta da 1ª semana' },
    { m: 1,    label: '1 mês',        name: 'consulta de 1 mês' },
    { m: 2,    label: '2 meses',      name: 'consulta de 2 meses' },
    { m: 4,    label: '4 meses',      name: 'consulta de 4 meses' },
    { m: 6,    label: '6 meses',      name: 'consulta de 6 meses' },
    { m: 9,    label: '9 meses',      name: 'consulta de 9 meses' },
    { m: 12,   label: '1 ano',        name: 'consulta de 1 ano' },
    { m: 18,   label: '1 ano e meio', name: 'consulta de 1 ano e meio' },
    { m: 24,   label: '2 anos',       name: 'consulta de 2 anos' },
    { m: null, label: 'Depois: 1 por ano', name: '' }
  ];

  var FOCUS = [
    { max: 1,   title: 'Os primeiros dias em casa',       items: ['Amamentação e ganho de peso', 'Sono, cólicas e choro', 'Adaptação da família'] },
    { max: 6,   title: 'Leite materno e desenvolvimento', items: ['Somente leite materno até os 6 meses', 'Sustentar a cabeça, sorrir, balbuciar', 'Vacinas da fase em dia'] },
    { max: 12,  title: 'A fase da introdução alimentar',  items: ['Primeiros alimentos, sem açúcar', 'Sentar, engatinhar, primeiras palavras', 'Curva de peso e altura'] },
    { max: 24,  title: 'Autonomia à mesa e fora dela',    items: ['Comer a comida da família', 'Fala, passos e brincadeiras', 'Reforços de vacinas'] },
    { max: 72,  title: 'Crescer e descobrir',             items: ['Sono e rotina', 'Seletividade alimentar', 'Comportamento e escola'] },
    { max: 144, title: 'Hábitos que ficam',               items: ['Curva de crescimento e peso', 'Lancheira e atividade física', 'Telas e rotina'] },
    { max: Infinity, title: 'Adolescência',               items: ['Puberdade e crescimento', 'Alimentação e imagem corporal', 'Um momento da consulta só do adolescente'] }
  ];

  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var CHECK_SVG = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E3A93B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';

  var inputNasc = document.getElementById('nasc');
  var trilha = document.getElementById('trilha');
  var nextT = document.getElementById('next-t');
  var nextW = document.getElementById('next-w');
  var nextWa = document.getElementById('next-wa');
  var focusK = document.getElementById('focus-k');
  var focusT = document.getElementById('focus-t');
  var focusList = document.getElementById('focus-list');

  function toISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseISO(s) {
    var p = (s || '').split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }
  function addMonths(base, m) {
    var d = new Date(base.getTime());
    if (m < 1) { d.setDate(d.getDate() + 7); return d; }
    d.setMonth(d.getMonth() + m);
    return d;
  }
  function fmtMesAno(d) { return MESES[d.getMonth()] + ' de ' + d.getFullYear(); }
  function ageInMonths(birth, today) {
    var m = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth()) + (today.getDate() - birth.getDate()) / 30.4;
    return Math.max(0, m);
  }
  function ageText(m) {
    if (m < 1) return 'recém-nascido';
    if (m < 24) { var mm = Math.floor(m); return mm + (mm === 1 ? ' mês' : ' meses'); }
    var a = Math.floor(m / 12); return a + (a === 1 ? ' ano' : ' anos');
  }

  function renderTrilha(activeIdx) {
    trilha.innerHTML = '';
    CHECKPOINTS.forEach(function (c, i) {
      var li = document.createElement('li');
      li.className = 'cp' + (activeIdx === null ? '' : (i < activeIdx ? ' is-done' : (i === activeIdx ? ' is-next' : '')));
      var tag = activeIdx === null ? '' : (i < activeIdx ? 'feita' : (i === activeIdx ? 'próxima' : ''));
      li.innerHTML =
        '<span class="cp__track" aria-hidden="true"><span class="cp__line cp__line--l"></span><span class="cp__dot"></span><span class="cp__line cp__line--r"></span></span>' +
        '<span class="cp__label"></span><span class="cp__tag"></span>';
      li.querySelector('.cp__label').textContent = c.label;
      li.querySelector('.cp__tag').textContent = tag;
      if (i === activeIdx) li.setAttribute('aria-current', 'step');
      trilha.appendChild(li);
    });
  }

  function update(birth) {
    if (!birth) { renderTrilha(null); return; }
    var today = new Date();
    if (birth > today) {
      renderTrilha(null);
      nextT.textContent = 'Ainda na barriga?';
      nextW.textContent = 'Comece pela consulta pré-natal pediátrica.';
      nextWa.href = waLink('Olá, Mel! Estou grávida e gostaria de agendar a consulta pré-natal pediátrica.');
      return;
    }
    var m = ageInMonths(birth, today);

    var nextIdx = -1;
    for (var i = 0; i < CHECKPOINTS.length - 1; i++) {
      if (CHECKPOINTS[i].m >= m - 0.2) { nextIdx = i; break; }
    }

    if (nextIdx >= 0) {
      var c = CHECKPOINTS[nextIdx];
      nextT.textContent = c.label;
      nextW.textContent = 'Por volta de ' + fmtMesAno(addMonths(birth, c.m)) + '.';
      nextWa.href = waLink('Olá, Mel! Gostaria de agendar a ' + c.name + ' do meu filho.');
    } else {
      var anos = Math.floor(m / 12) + 1;
      if (anos > 18) {
        nextT.textContent = 'Até os 18 anos';
        nextW.textContent = 'A Dra. acompanha do nascimento aos 18 anos.';
        nextWa.href = waLink('Olá, Mel! Gostaria de agendar uma consulta.');
      } else {
        var aniv = new Date(birth.getTime()); aniv.setFullYear(birth.getFullYear() + anos);
        nextT.textContent = 'Consulta dos ' + anos + ' anos';
        nextW.textContent = 'Perto do aniversário, em ' + fmtMesAno(aniv) + '.';
        nextWa.href = waLink('Olá, Mel! Gostaria de agendar a consulta anual dos ' + anos + ' anos do meu filho.');
      }
    }
    renderTrilha(nextIdx >= 0 ? nextIdx : CHECKPOINTS.length - 1);

    var f = FOCUS.filter(function (x) { return m < x.max; })[0];
    focusK.textContent = 'Agora: ' + ageText(m);
    focusT.textContent = f.title;
    focusList.innerHTML = '';
    f.items.forEach(function (t) {
      var li = document.createElement('li');
      li.innerHTML = CHECK_SVG + '<span></span>';
      li.querySelector('span').textContent = t;
      focusList.appendChild(li);
    });
  }

  if (inputNasc && trilha) {
    inputNasc.max = toISO(new Date());
    inputNasc.addEventListener('change', function () { update(parseISO(inputNasc.value)); });
    document.querySelectorAll('.chip[data-meses]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = new Date();
        d.setDate(d.getDate() - Math.round(parseFloat(btn.dataset.meses) * 30.4));
        inputNasc.value = toISO(d);
        update(d);
      });
    });
    renderTrilha(null);
  }

  /* ---------- Abas de nutrologia (padrão WAI-ARIA tabs) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var to = null;
      if (e.key === 'ArrowRight') to = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') to = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') to = tabs[0];
      else if (e.key === 'End') to = tabs[tabs.length - 1];
      if (to) { e.preventDefault(); selectTab(to, true); }
    });
  });

  /* ---------- Bloco de dúvidas ---------- */
  var form = document.getElementById('form-duvidas');
  if (form) {
    form.querySelectorAll('.topico').forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var assuntos = Array.prototype.map.call(
        form.querySelectorAll('.topico[aria-pressed="true"]'),
        function (b) { return b.textContent.trim().toLowerCase(); }
      );
      var nota = document.getElementById('nota').value.trim();
      var msg = 'Olá, Mel! Tenho algumas dúvidas para a próxima consulta com a Dra. Mariele.';
      if (assuntos.length) msg += '\nAssuntos: ' + assuntos.join(', ') + '.';
      if (nota) msg += '\nMinha pergunta: ' + nota;
      window.open(waLink(msg), '_blank', 'noopener');
    });
  }
})();
