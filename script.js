// === STORAGE ===
const STORAGE_OP = "family_ops";
const STORAGE_RATES = "family_rates";

const initialBalances = { RUB:100000, USD:1000, EUR:500, ARS:50000, BTC:0.05, ETH:1, USDT:300 };
let operations = JSON.parse(localStorage.getItem(STORAGE_OP))||[];

let defaultRates = JSON.parse(localStorage.getItem(STORAGE_RATES))||{
  RUB:0.013, EUR:1.08, ARS:0.0053, BTC:41000, ETH:3200, USDT:1
};

// ELEMENTS
const tabs = document.querySelectorAll(".nav button");
const sections = document.querySelectorAll(".tab");

const initialEl = document.getElementById("initialBalances");
const initialTotalUSD = document.getElementById("initialTotalUSD");

const operationsList = document.getElementById("operationsList");

const amountInput = document.getElementById("amount");
const currencySelect = document.getElementById("currency");
const typeSelect = document.getElementById("type");
const dateInput = document.getElementById("date");
const categorySelect = document.getElementById("category");
const addBtn = document.getElementById("addBtn");

const finalEl = document.getElementById("finalBalances");
const finalTotalUSD = document.getElementById("finalTotalUSD");
const exchangeList = document.getElementById("exchangeRates");
const saveRatesBtn = document.getElementById("saveRates");

const recInputs = document.getElementById("reconcileInputs");
const checkBtn = document.getElementById("checkBtn");
const recResults = document.getElementById("reconcileResults");
const applyBtn = document.getElementById("applyAdjustments");

// INIT
Object.keys(initialBalances).forEach(cur=>{
  const opt=document.createElement("option"); opt.value=cur; opt.textContent=cur; currencySelect.appendChild(opt);
});
["еда","путешествия","аренда","спорт","одежда","развлечения"].forEach(c=>{
  const o=document.createElement("option"); o.value=c; o.textContent=c; categorySelect.appendChild(o);
});
dateInput.valueAsDate=new Date();

// TABS
tabs.forEach(btn=>{
  btn.onclick=()=>{sections.forEach(s=>s.classList.add("hidden")); document.getElementById(btn.dataset.tab).classList.remove("hidden"); refreshAll();};
});
tabs[0].click();

// SHOW/HIDE CATEGORY
typeSelect.onchange = () => categorySelect.classList.toggle("hidden", typeSelect.value!=="expense");

// REFRESH
function refreshAll(){
  renderInitial(); renderOps(); renderFinal(); renderRates(); renderReconcileInputs();
}

// RENDER INITIAL
function renderInitial(){
  initialEl.innerHTML=""; let sumUSD=0;
  for(let cur in initialBalances){
    const val=initialBalances[cur]; const usd=convertToUSD(cur,val);
    const div=document.createElement("div"); div.className="balance-row";
    div.innerHTML=`<span class="cur">${cur}</span><span class="val">${val}</span><span class="usd">${usd.toFixed(2)} USD</span>`;
    initialEl.appendChild(div); sumUSD+=usd;
  }
  animateNumber(initialTotalUSD, sumUSD);
}

// RENDER OPERATIONS
function renderOps(){
  operationsList.innerHTML="";
  const grouped = groupByDate(operations);
  Object.keys(grouped).sort((a,b)=> new Date(b)-new Date(a)).forEach(date=>{
    const header=document.createElement("li"); header.innerHTML=`<b>${formatDateHeader(date)}</b>`; header.style.background="#f0f0f0";
    operationsList.appendChild(header);
    grouped[date].forEach((op,idx)=>{
      const li=document.createElement("li");
      li.className=op.category==="ручная корректировка"?"adjustment":op.type;
      li.innerHTML=`
        <div class="op-top">
          <span class="amount">${op.type==="income"?"+":"-"}${op.amount} ${op.currency}</span>
          <span class="type">${op.type==="income"?"📈":"📉"}</span>
        </div>
        <div class="op-bottom">
          <span class="date">${op.date}</span>
          <span class="category">${op.type==="expense"?`[${op.category}]`:''}</span>
          <div class="op-actions">
            <button data-id="${idx}" class="editBtn">✏️</button>
            <button data-id="${idx}" class="delBtn">🗑️</button>
          </div>
        </div>`;
      operationsList.appendChild(li);
    });
  });
  document.querySelectorAll(".delBtn").forEach(b=>b.onclick=e=>deleteOp(e.target.dataset.id));
  document.querySelectorAll(".editBtn").forEach(b=>b.onclick=e=>editOp(e.target.dataset.id));
}

// RENDER FINAL
function renderFinal(){
  finalEl.innerHTML=""; let sumUSD=0;
  const finalBal={...initialBalances};
  operations.forEach(o=>finalBal[o.currency]+=(o.type==="income"?o.amount:-o.amount));
  for(let cur in finalBal){
    const usd=convertToUSD(cur,finalBal[cur]);
    const div=document.createElement("div"); div.className="balance-row";
    div.innerHTML=`<span class="cur">${cur}</span><span class="val">${finalBal[cur]}</span><span class="usd">${usd.toFixed(2)} USD</span>`;
    finalEl.appendChild(div); sumUSD+=usd;
  }
  animateNumber(finalTotalUSD, sumUSD);
}

// RATES
function renderRates(){
  exchangeList.innerHTML="";
  for(let cur in defaultRates){
    const div=document.createElement("div");
    div.innerHTML=`${cur}: <input data-cur="${cur}" type="number" value="${defaultRates[cur]}" step="0.0001">`;
    exchangeList.appendChild(div);
  }
}

// RECONCILE
function renderReconcileInputs(){
  recInputs.innerHTML="";
  for(let cur in initialBalances){
    recInputs.innerHTML+=`${cur}: <input data-cur="${cur}" type="number" placeholder="факт ${cur}"><br>`;
  }
}

// CRUD
addBtn.onclick=()=>{
  const op={amount:Number(amountInput.value), currency:currencySelect.value, type:typeSelect.value, date:dateInput.value, category:typeSelect.value==="expense"?categorySelect.value:""};
  operations.push(op); localStorage.setItem(STORAGE_OP, JSON.stringify(operations)); refreshAll();
};
function deleteOp(i){ operations.splice(i,1); localStorage.setItem(STORAGE_OP, JSON.stringify(operations)); refreshAll(); }
function editOp(i){
  const op=operations[i]; amountInput.value=op.amount; currencySelect.value=op.currency; typeSelect.value=op.type; dateInput.value=op.date; categorySelect.value=op.category; typeSelect.onchange(); deleteOp(i);
}

// RECONCILE LOGIC
checkBtn.onclick=()=>{
  const diffs=[]; const factual={};
  recInputs.querySelectorAll("input").forEach(i=>factual[i.dataset.cur]=Number(i.value)||0);
  const finalBal={...initialBalances}; operations.forEach(o=>finalBal[o.currency]+=(o.type==="income"?o.amount:-o.amount));
  recResults.innerHTML=""; let hasDiff=false;
  for(let cur in finalBal){
    const d=factual[cur]-finalBal[cur]; if(d!==0){ recResults.innerHTML+=`${cur}: разница ${d}<br>`; diffs.push({currency:cur,diff:d}); hasDiff=true; }
  }
  applyBtn.classList.toggle("hidden",!hasDiff);
  applyBtn.onclick=()=>{ diffs.forEach(d=>operations.push({amount:Math.abs(d.diff),currency:d.currency,type:d.diff>0?"income":"expense",date:new Date().toISOString().slice(0,10),category:"ручная корректировка"})); localStorage.setItem(STORAGE_OP,JSON.stringify(operations)); refreshAll(); };
};

// UTIL
function convertToUSD(cur,val){ if(cur==="USD")return val; return val*(defaultRates[cur]||0); }
saveRatesBtn.onclick=()=>{ document.querySelectorAll("#exchangeRates input").forEach(i=>defaultRates[i.dataset.cur]=Number(i.value)); localStorage.setItem(STORAGE_RATES,JSON.stringify(defaultRates)); refreshAll(); };

function animateNumber(el,num){ let current=Number(el.textContent)||0; const step=(num-current)/10; let i=0;
  const interval=setInterval(()=>{ if(i>=10){ el.textContent=num.toFixed(2); clearInterval(interval); } else { el.textContent=(current+step*i).toFixed(2); i++; } },30);
}

function groupByDate(arr){ const res={}; arr.forEach(o=>{ if(!res[o.date]) res[o.date]=[]; res[o.date].push(o); }); return res; }
function formatDateHeader(dateStr){ const d=new Date(dateStr); const today=new Date(); const yesterday=new Date(); yesterday.setDate(today.getDate()-1);
  if(d.toDateString()===today.toDateString()) return "Сегодня";
  if(d.toDateString()===yesterday.toDateString()) return "Вчера"; return d.toLocaleDateString();
}