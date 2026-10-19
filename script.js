// 基本互動與產生評語邏輯 (繁體中文)，1–10 分制，正向、鼓勵性回饋
(function(){
  const stargetInput = document.getElementById('starget');
  const scoreForm = document.getElementById('scoreForm');
  const rawTotalEl = document.getElementById('rawTotal');
  const rawMaxEl = document.getElementById('rawMax');
  const percentEl = document.getElementById('percent');
  const finalScoreEl = document.getElementById('finalScore');
  const stargetShow = document.getElementById('stargetShow');
  const generateBtn = document.getElementById('generateBtn');
  const commentPreview = document.getElementById('commentPreview');
  const addTagBtn = document.getElementById('addTagBtn');
  const newTagText = document.getElementById('newTagText');
  const newTagType = document.getElementById('newTagType');
  const copyBtn = document.getElementById('copyBtn');

  function getScoresAndWeights(){
    const scoreInputs = Array.from(scoreForm.querySelectorAll('input[name="score"]'));
    const weightInputs = Array.from(scoreForm.querySelectorAll('.weight'));
    const scores = scoreInputs.map(i => Number(i.value));
    const weights = weightInputs.map(i => Number(i.value));
    return {scores, weights};
  }

  function compute(){
    const {scores, weights} = getScoresAndWeights();
    if(scores.some(s => !isFinite(s) || s<1 || s>10)){
      return null;
    }
    const weightedSum = scores.reduce((acc,s,i)=>acc + s * (isFinite(weights[i])?weights[i]:1),0);
    const weightTotal = weights.reduce((acc,w)=>acc + (isFinite(w)?w:1),0);
    if(weightTotal <= 0){ return {error:'權重總和需大於 0'}; }
    const rawMax = 10 * scores.length;
    const rawTotal = scores.reduce((a,b)=>a+b,0);
    const percent = (weightedSum / (weightTotal * 10)) * 100;
    const starget = Number(stargetInput.value) || 0;
    if(!(starget > 0)) return {error:'請輸入有效的目標總分 (Starget > 0)'} ;
    const finalScore = (percent/100) * starget;
    return {rawTotal, rawMax, percent, finalScore, starget};
  }

  function renderCompute(){
    const res = compute();
    if(!res) {
      rawTotalEl.textContent='-';
      rawMaxEl.textContent='-';
      percentEl.textContent='-';
      finalScoreEl.textContent='-';
      stargetShow.textContent='-';
      return;
    }
    if(res.error){
      commentPreview.textContent = '錯誤：' + res.error;
      return;
    }
    rawTotalEl.textContent = String(Math.round(res.rawTotal));
    rawMaxEl.textContent = res.rawMax;
    percentEl.textContent = res.percent.toFixed(2);
    finalScoreEl.textContent = res.finalScore.toFixed(2);
    stargetShow.textContent = res.starget;
  }

  scoreForm.addEventListener('input', renderCompute);
  stargetInput.addEventListener('input', renderCompute);

  function addCustomTag(text,type){
    if(!text || !text.trim()) return;
    const container = document.querySelector(type==='advantage' ? '.tags-col div:first-child' : '.tags-col div:last-child');
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type='checkbox';
    input.className='tag ' + (type==='advantage' ? 'advantage' : 'weakness');
    input.value = text.trim();
    label.appendChild(input);
    label.append(' ' + text.trim());
    container.appendChild(label);
    newTagText.value='';
  }

  addTagBtn.addEventListener('click',(e)=>{
    e.preventDefault();
    addCustomTag(newTagText.value, newTagType.value);
  });
  newTagText.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); addCustomTag(newTagText.value,newTagType.value); } });

  document.querySelectorAll('.toggle-criteria').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const targetId = btn.dataset.target;
      const el = document.getElementById(targetId);
      if(!el) return;
      const isHidden = el.hasAttribute('hidden');
      if(isHidden){
        el.removeAttribute('hidden');
        btn.setAttribute('aria-expanded','true');
        btn.textContent = '收合說明';
      } else {
        el.setAttribute('hidden','');
        btn.setAttribute('aria-expanded','false');
        btn.textContent = '參考說明';
      }
    });
    const targetId = btn.dataset.target;
    const el = document.getElementById(targetId);
    if(el){
      el.removeAttribute('hidden');
      btn.setAttribute('aria-expanded','true');
      btn.textContent = '收合說明';
    }
  });

  // 生成評語（正向、鼓勵）
  function generateComment(){
    const res = compute();
    if(!res) return '請先完整填寫分數與 Starget。';
    if(res.error) return '錯誤：' + res.error;

    const mode = document.querySelector('input[name="commentMode"]:checked')?.value || 'concise';
    const advantages = Array.from(document.querySelectorAll('.tag.advantage:checked')).map(n=>n.value);
    const weaknesses = Array.from(document.querySelectorAll('.tag.weakness:checked')).map(n=>n.value);

    // 溫和提醒同時選取相同標籤
    const conflicts = advantages.filter(a => weaknesses.includes(a));
    let conflictNote = '';
    if(conflicts.length){
      conflictNote = '（提醒：您同時勾選了 ' + conflicts.join('、') + '，若為刻意強調可保留；若非預期，可考慮調整。）\n';
    }

    // 開頭（正向）
    const p = res.percent;
    let opening = '';
    if(p > 85){
      opening = '整體表現非常出色，展現了高度的專業與用心，成果與論述都具有說服力，值得肯定。';
    } else if(p >= 70){
      opening = '整體表現穩健且有亮點，目前已具備良好基礎，經過些微調整便能更上一層樓。';
    } else if(p >= 55){
      opening = '您做了紮實的準備，報告已具備基礎架構與內容；若再補強幾處重點，說服力會顯著提升。';
    } else {
      opening = '這份報告有明顯的成長潛力，透過聚焦重點與補足佐證，可以快速看到提升效果，我很期待後續的改進成果。';
    }

    const {scores} = getScoresAndWeights();
    const labels = ['條理與架構','邏輯與說服力','內容深度與價值','視覺與表達呈現'];
    const autoAdvantages = scores.map((s,i)=> s>=8 ? labels[i] : null).filter(Boolean);
    const autoWeaknesses = scores.map((s,i)=> s<=4 ? labels[i] : null).filter(Boolean);
    const advantagesList = advantages.length ? advantages : autoAdvantages;
    const weaknessesList = weaknesses.length ? weaknesses : autoWeaknesses;

    if(mode === 'concise'){
      let strengths = '';
      if(advantagesList.length) strengths = '優勢：' + advantagesList.join('、') + '。';
      let suggestions = '';
      if(weaknessesList.length){
        suggestions = '建議重點（自動/選取）：建議可針對 ' + weaknessesList.join('、') + ' 加強，並考慮加入量化指標或具體案例來支援論點。';
      } else {
        suggestions = '若希望更進一步提升，可以在論述中增加具體數據與可衡量指標，讓成果更具說服力。';
      }
      const footer = `總結：目前折算後得分為 ${res.finalScore.toFixed(2)} / ${res.starget}（${res.percent.toFixed(2)}%）。期待未來持續成長與精進。`;
      return [conflictNote, opening, strengths, suggestions, footer].filter(Boolean).join('\n\n');
    }

    // 用心版：針對每個構面提供肯定 + 建設性建議
    function bandText(score, criterionKey){
      const band = score >= 9 ? '9-10' : (score >=7 ? '7-8' : (score >=5 ? '5-6' : (score >=3 ? '3-4' : '1-2')));
      const templates = {
        '條理與架構': {
          '9-10': `條理與架構（${score} 分）：表現穩健，脈絡明確，讀者能迅速抓到重點；建議可維持目前結構並在關鍵處加強小結，讓訊息更銜接流暢。`,
          '7-8': `條理與架構（${score} 分）：整體清晰且具邏輯，建議微調段落順序或刪減次要內容，以讓主訊息更為突出。`,
          '5-6': `條理與架構（${score} 分）：基本可理解，建議為每段加上明確主題句並強化過渡句，能更快速引導聽眾掌握重點。`,
          '3-4': `條理與架構（${score} 分）：目前有些內容較為分散，建議先釐清 2–3 個核心訊息，採用金字塔結構重整，以提升整體聚焦度。`,
          '1-2': `條理與架構（${score} 分）：尚未形成清晰脈絡，建議先定義核心訴求並重排內容順序，這樣能更有效傳遞主旨。`
        },
        '邏輯與說服力': {
          '9-10': `邏輯與說服力（${score} 分）：推論清楚並有充分佐證，呈現方式有助於說服決策者；可考慮補充來源或比較數據以更完整呈現影響力。`,
          '7-8': `邏輯與說服力（${score} 分）：論點合理且多數有支持，建議在關鍵假設處補入更精確的數據或說明，以增加信服度。`,
          '5-6': `邏輯與說服力（${score} 分）：已具基本論述，若在關鍵結論處補充佐證或以範例示範，整體說服力會更強。`,
          '3-4': `邏輯與說服力（${score} 分）：部分推論尚需更明確的證據，建議檢視主要假設並補入可驗證的數據或案例。`,
          '1-2': `邏輯與說服力（${score} 分）：目前論證基礎較弱，建議先建立清楚的問題定義與衡量指標，逐步以數據驗證主張。`
        },
        '內容深度與價值': {
          '9-10': `內容深度（${score} 分）：洞察深刻且具體，提出的建議具有可執行性，對團隊或決策有實際幫助，值得肯定。`,
          '7-8': `內容深度（${score} 分）：內容完整且有實務價值，建議補入延伸指標或後續規劃以便落地執行。`,
          '5-6': `內容深度（${score} 分）：成果與描述已具基礎，若補充更多數據或案例分析，將能呈現更豐富的洞見。`,
          '3-4': `內容深度（${score} 分）：目前以敘事為主，建議加入具體成果指標或短期成效量測，讓內容更具說服力。`,
          '1-2': `內容深度（${score} 分）：內容需要補足實證或案例支撐，建議蒐集關鍵指標並以圖表呈現核心成果。`
        },
        '視覺與表達呈現': {
          '9-10': `視覺與表達（${score} 分）：視覺呈現專業且資訊層次清晰，能有效傳達重點，建議維持一致風格以強化辨識度。`,
          '7-8': `視覺與表達（${score} 分）：整體呈現良好，建議微調字級、對比或圖表標示，能進一步提升可讀性。`,
          '5-6': `視覺與表達（${score} 分）：資訊密度較高或圖表需簡化，建議將每張投影片聚焦一個重點並減少文字量。`,
          '3-4': `視覺與表達（${score} 分）：目前設計有改善空間，建議統一版式與色彩並重新標註圖表重點，使資訊更易理解。`,
          '1-2': `視覺與表達（${score} 分）：建議從版面與字級重新規劃，先確保資訊可讀再逐步優化視覺風格。`
        }
      };
      return templates[criterionKey][band];
    }

    const perCriterion = labels.map((label,i)=> bandText(scores[i], label));
    const strengths = advantagesList.length ? '優勢（自動/選取）：' + advantagesList.join('、') + '。' : '';
    const suggestions = weaknessesList.length ? '建議重點（自動/選取）：建議可針對 ' + weaknessesList.join('、') + ' 加強，並考慮加入量化指標或具體案例以驗證論點。' : '若希望進一步提升，可以在論述中加入更多具體數據與可衡量指標，讓成果更具說服力。';
    const footer = `總結：折算後得分 ${res.finalScore.toFixed(2)} / ${res.starget}（${res.percent.toFixed(2)}%）。期待看到後續精進成果。`;

    return [conflictNote, opening, ...perCriterion, strengths, suggestions, footer].filter(Boolean).join('\n\n');
  }

  generateBtn.addEventListener('click', ()=>{
    const comment = generateComment();
    commentPreview.textContent = comment;
  });

  copyBtn.addEventListener('click', async ()=>{
    const text = commentPreview.textContent;
    if(!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = '已複製';
      setTimeout(()=> copyBtn.textContent = '複製評語到剪貼簿',1800);
    } catch(e){
      alert('複製失敗，請手動選取複製。');
    }
  });

  renderCompute();

})();
