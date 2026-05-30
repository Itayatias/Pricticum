import"../main.js";const d="http://localhost:4000",c=localStorage.getItem("authUser"),e=c?JSON.parse(c):null,i=document.getElementById("staffUserLine"),a=document.getElementById("staffStatus"),l=document.getElementById("inventoryTableBody"),s=document.getElementById("inventoryMovementsList"),u=document.getElementById("staffSkuCount"),f=document.getElementById("staffLowStockCount"),m=document.getElementById("staffOutOfStockCount"),g=document.getElementById("managerPanel");function r(n,t="info"){a&&(a.className=`alert alert-${t} mb-4`,a.textContent=n,a.classList.remove("d-none"))}function y(){a&&(a.classList.add("d-none"),a.textContent="")}function v(n,t){return n<=0?{label:"אזל",className:"badge bg-danger"}:n<=t?{label:"מלאי נמוך",className:"badge bg-warning text-dark"}:{label:"תקין",className:"badge bg-success"}}function S(){return!e||!["employee","manager"].includes(e.role)?(window.location.href="./login.html",!1):!0}function k(n){u&&(u.textContent=String(n.length)),f&&(f.textContent=String(n.filter(t=>t.stock>0&&t.stock<=t.min_stock).length)),m&&(m.textContent=String(n.filter(t=>t.stock<=0).length))}function w(){document.querySelectorAll("[data-adjust-stock]").forEach(n=>{n.addEventListener("click",()=>{const t=Number(n.dataset.adjustStock);x(n.dataset.productId,t)})})}function h(n){l&&(l.innerHTML=n.map(t=>{const o=v(t.stock,t.min_stock);return`
        <tr>
          <td>
            <div class="fw-semibold">${t.productName}</div>
            <div class="text-muted small">מיקום: ${t.location}</div>
          </td>
          <td>${t.category}</td>
          <td><span class="fw-semibold">${t.stock}</span></td>
          <td>${t.min_stock}</td>
          <td><span class="${o.className}">${o.label}</span></td>
          <td>
            <div class="d-flex gap-2 flex-wrap">
              <button type="button" class="btn btn-outline-secondary btn-sm" data-adjust-stock="+5" data-product-id="${t.productId}">+5</button>
              <button type="button" class="btn btn-outline-secondary btn-sm" data-adjust-stock="-5" data-product-id="${t.productId}">-5</button>
              <button type="button" class="btn btn-dark btn-sm" data-adjust-stock="+1" data-product-id="${t.productId}">+1</button>
            </div>
          </td>
        </tr>
      `}).join(""),k(n),w())}function $(n){if(s){if(!n.length){s.innerHTML='<li class="text-muted">אין עדיין תנועות מלאי.</li>';return}s.innerHTML=n.map(t=>`
        <li class="border-bottom pb-2 mb-2">
          <div class="d-flex justify-content-between gap-2">
            <span class="fw-semibold">${t.productId}</span>
            <span class="${t.delta>0?"text-success":"text-danger"}">${t.delta>0?"+":""}${t.delta}</span>
          </div>
          <div class="text-muted small">${t.reason}</div>
          <div class="text-muted small">${new Date(t.createdAt).toLocaleString("he-IL")}</div>
        </li>
      `).join("")}}async function I(){const n=await fetch(`${d}/api/inventory?userId=${e.id}`),t=await n.json();if(!n.ok)throw new Error(t.message||"Failed to load inventory");h(t)}async function L(){const n=await fetch(`${d}/api/inventory/movements?userId=${e.id}`),t=await n.json();if(!n.ok)throw new Error(t.message||"Failed to load movements");$(t)}async function x(n,t){try{const o=await fetch(`${d}/api/inventory/adjust`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:e.id,productId:n,delta:t,reason:"עדכון מלאי מהמערכת"})}),p=await o.json();if(!o.ok)throw new Error(p.message||"Failed to update inventory");y(),await b()}catch{r("לא ניתן לעדכן מלאי כרגע.","danger")}}async function b(){await I(),await L()}function j(){if(S()){if(i){const n=e.role==="manager"?"מנהל חנות":"עובד חנות";i.textContent=`מחובר כ-${e.fullName} · ${n}`}g&&e.role==="manager"&&g.classList.remove("d-none"),r("כאן אפשר לעדכן מלאי, לעקוב אחרי תנועות ולהמשיך להרחיב את שכבת הניהול.","info"),b().catch(()=>{r("שגיאה בטעינת נתוני המלאי. ודא שהשרת רץ ושהמשתמש הוא עובד/מנהל.","danger")})}}j();
