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
    if(!(starget > 0)) return {error:'請輸入有效的目標總分 (Starget > 0)'};
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

  function generateComment(){
    const res = compute();
    if(!res) return '請先完整填寫分數與 Starget。';
    if(res.error) return '錯誤：' + res.error;

    const mode = document.querySelector('input[name="commentMode"]:checked')?.value || 'concise';
    const advantages = Array.from(document.querySelectorAll('.tag.advantage:checked')).map(n=>n.value);
    const weaknesses = Array.from(document.querySelectorAll('.tag.weakness:checked')).map(n=>n.value);

    const conflicts = advantages.filter(a => weaknesses.includes(a));
    let conflictNote = '';
    if(conflicts.length){
      conflictNote = '（注意：同時選到相同標籤 ' + conflicts.join('、') + '，建議檢查是否為誤選。）\n';
    }

    const p = res.percent;
    let opening = '';
    if(p > 85){
      opening = '本篇報告展現了極高的專業水準與用心，架構流暢且重點突出，不僅清楚交代了年度成果，更帶入了具有深度的反思，是非常優秀的示範。';
    } else if(p >= 70){
      opening = '整體表現相當穩健，核心任務與架構皆有很好的發揮，文字與視覺呈現也符合專業期待。';
    } else if(p >= 55){
      opening = '感謝您的用心準備。報告中可以看出基本的工作投入，但在條理安排與邏輯推導上還有提升空間。';
    } else {
      opening = '這是一份有潛力進一步打磨的報告。目前在資訊呈現的脈絡與深度上較為發散，建議可再聚焦與精簡。';
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
        suggestions = '建議重點（自動/選取）：建議可針對 ' + weaknessesList.join('、') + ' 加強，並加入量化指標或案例以驗證推論。';
      } else {
        suggestions = '若希望進一步提升，可在論述中增加更多具體數據與可衡量指標。';
      }
      const footer = `總結：目前折算後得分為 ${res.finalScore.toFixed(2)} / ${res.starget}（${res.percent.toFixed(2)}%）。期許新的一年繼續保持熱忱，持續精進。`;
      return [conflictNote, opening, strengths, suggestions, footer].filter(Boolean).join('\n\n');
    }

    function bandText(score, criterionKey){
      const band = score >= 9 ? '9-10' : (score >=7 ? '7-8' : (score >=5 ? '5-6' : (score >=3 ? '3-4' : '1-2')));
      const templates = {
        '條理與架構': {
          '9-10': `條理與架構方面表現優異（${score} 分）：結構清楚且段落過渡自然，讀者可迅速抓到重點。`,
          '7-8': `條理與架構（${score} 分）：整體脈絡清楚，建議微調部分段落或刪減次要內容以更聚焦。`,
          '5-6': `條理與架構（${score} 分）：可理解但若要更有力度，建議在每個段落加一個明確主題句並強化過渡句。`,
          '3-4': `條理與架構（${score} 分）：架構較散或有重複，建議先列出 3 個核心訊息並以金字塔結構重組內容。`,
          '1-2': `條理與架構（${score} 分）：目前缺乏清晰脈絡，建議重做整體架構設計，先釐清核心訴求再重排內容。`
        },
        '邏輯與說服力': {
          '9-10': `邏輯與說服力（${score} 分）：論證紮實、因果關係明確，數據與案例有效支持結論。`,
          '7-8': `邏輯與說服力（${score} 分）：論點合理且多數證據支持，建議在個別主張中補入更精確的數據來源。`,
          '5-6': `邏輯與說服力（${score} 分）：基本論述存在，但某些推論尚需更多證據或更清楚的因果鏈。`,
          '3-4': `邏輯與說服力（${score} 分）：推論出現跳接或以主觀敘述取代證據，建議檢視主要假設並補入佐證。`,
          '1-2': `邏輯與說服力（${score} 分）：缺乏論證基礎，建議重新定義問題、提出假設並以數據或案例逐步驗證。`
        },
        '內容深度與價值': {
          '9-10': `內容深度（${score} 分）：洞察深刻且具體，提供可量化成果與可執行建議，對決策有實質參考價值。`,
          '7-8': `內容深度（${score} 分）：內容完整且具有實務價值，建議補入更多分析結果或延伸指標以加強說服力。`,
          '5-6': `內容深度（${score} 分）：有基本成果但分析深度不足，建議補充案例細節或更多衡量指標。`,
          '3-4': `內容深度（${score} 分）：偏向敘事或流水帳，缺少深度分析與可衡量成果，建議加入具體數據與結論。`,
          '1-2': `內容深度（${score} 分）：內容空泛，需補足事實與數據並重構分析流程，才能呈現價值。`
        },
        '視覺與表達呈現': {
          '9-10': `視覺與表達（${score} 分）：排版與圖表專業、資訊層次清晰，閱讀體驗佳，數據標示完整。`,
          '7-8': `視覺與表達（${score} 分）：整體呈現良好，建議微調字級或對比以提升可讀性。`,
          '5-6': `視覺與表達（${score} 分）：資訊密度較高或圖表需簡化，建議把每張投影片聚焦一個重點。`,
          '3-4': `視覺與表達（${score} 分）：設計較為混亂或圖表標示不足，建議統一版式並重作主要圖表。`,
          '1-2': `視覺與表達（${score} 分）：視覺表達欠佳，需從版面、字級與配色重新設計以確保資訊可讀。`
        }
      };
      return templates[criterionKey][band];
    }

    const perCriterion = labels.map((label,i)=> bandText(scores[i], label));
    const strengths = advantagesList.length ? '優勢（自動/選取）：' + advantagesList.join('、') + '。' : '';
    const suggestions = weaknessesList.length ? '建議重點（自動/選取）：建議可針對 ' + weaknessesList.join('、') + ' 加強，並加入量化指標或案例以驗證推論。' : '若希望進一步提升，可在論述中加入更多具體數據與可衡量指標。';
    const footer = `總結：折算後得分 ${res.finalScore.toFixed(2)} / ${res.starget}（${res.percent.toFixed(2)}%）。期望持續精進。`;

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
