import"../main.js";const f="http://localhost:4000",g=localStorage.getItem("authUser"),a=g?JSON.parse(g):null,y=document.getElementById("accountUserLine"),r=document.getElementById("accountStatus"),l=document.getElementById("accountCartItemsList"),p=document.getElementById("accountCartTotalSummary"),h=document.getElementById("accountCartCount"),d=document.getElementById("accountOrdersCount"),i=document.getElementById("accountOrdersList"),u=document.getElementById("accountCheckoutBtn");function m(t){return`₪ ${Number(t||0).toFixed(2)}`}function s(t,e="info"){r&&(r.className=`alert alert-${e} mb-4`,r.textContent=t,r.classList.remove("d-none"))}function v(){r&&(r.classList.add("d-none"),r.textContent="")}function I(t){const e=(t||[]).reduce((n,c)=>n+Number(c.quantity||0),0);document.querySelectorAll(".header-cart-count").forEach(n=>{n.textContent=String(e)})}function $(){y&&(y.textContent="כדי לצפות בסל ובהיסטוריית ההזמנות יש להתחבר למערכת."),l&&(l.innerHTML=`
      <li class="text-muted">אין גישה לסל ללא התחברות.</li>
    `),i&&(i.innerHTML=`
      <li class="text-muted">אין גישה להיסטוריית הזמנות ללא התחברות.</li>
    `),p&&(p.textContent=m(0)),h&&(h.textContent="0"),d&&(d.textContent="0"),u&&(u.disabled=!0),s("כדי לנהל סל והזמנות יש להתחבר למערכת.","warning")}function S(){document.querySelectorAll(".account-cart-increase").forEach(t=>{t.addEventListener("click",()=>{const e=Number(t.dataset.quantity||"1");w(t.dataset.productId,e+1)})}),document.querySelectorAll(".account-cart-decrease").forEach(t=>{t.addEventListener("click",()=>{const e=Number(t.dataset.quantity||"1");if(e<=1){C(t.dataset.productId);return}w(t.dataset.productId,e-1)})}),document.querySelectorAll(".account-cart-remove").forEach(t=>{t.addEventListener("click",()=>{C(t.dataset.productId)})})}async function L(){if(!a||!a.id)return $(),{items:[],total:0};const t=await fetch(`${f}/api/cart/${a.id}`),e=await t.json();if(!t.ok)throw new Error(e.message||"Failed to load cart");const n=e.items||[],c=Number(e.total||0);return l&&(n.length?l.innerHTML=n.map(o=>`
          <li class="border-bottom pb-3 mb-3">
            <div class="d-flex justify-content-between gap-3">
              <div>
                <div class="fw-semibold">${o.productName}</div>
                <div class="text-muted small">${m(o.price)} ליחידה</div>
              </div>
              <div class="fw-semibold">${m(o.price*o.quantity)}</div>
            </div>
            <div class="d-flex align-items-center gap-2 mt-3 flex-wrap">
              <button type="button" class="btn btn-outline-secondary btn-sm account-cart-decrease" data-product-id="${o.productId}" data-quantity="${o.quantity}">-</button>
              <span class="px-2">כמות: ${o.quantity}</span>
              <button type="button" class="btn btn-outline-secondary btn-sm account-cart-increase" data-product-id="${o.productId}" data-quantity="${o.quantity}">+</button>
              <button type="button" class="btn btn-outline-danger btn-sm me-auto account-cart-remove" data-product-id="${o.productId}">הסר</button>
            </div>
          </li>
        `).join(""):l.innerHTML='<li class="text-muted">הסל ריק כרגע.</li>'),p&&(p.textContent=m(c)),h&&(h.textContent=String(n.reduce((o,x)=>o+Number(x.quantity||0),0))),I(n),S(),{items:n,total:c}}async function w(t,e){if(!(!a||!a.id))try{const n=await fetch(`${f}/api/cart/update-quantity`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:a.id,productId:t,quantity:e})}),c=await n.json();if(!n.ok)throw new Error(c.message||"Failed to update quantity");v(),await b()}catch{s("לא ניתן לעדכן כמות כרגע.","danger")}}async function C(t){if(!(!a||!a.id))try{const e=await fetch(`${f}/api/cart/remove`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:a.id,productId:t})}),n=await e.json();if(!e.ok)throw new Error(n.message||"Failed to remove item");v(),await b()}catch{s("לא ניתן להסיר פריט כרגע.","danger")}}async function E(){if(!a||!a.id)return i&&(i.innerHTML='<li class="text-muted">התחבר כדי לצפות בהזמנות.</li>'),d&&(d.textContent="0"),[];const t=await fetch(`${f}/api/orders/${a.id}`),e=await t.json();if(!t.ok)throw new Error("Failed to load orders");return d&&(d.textContent=String(e.length)),i&&(e.length?i.innerHTML=e.map(n=>{const c=n.items.map(o=>`${o.productName} x${o.quantity}`).join(" · ");return`
            <li class="border-bottom pb-3 mb-3">
              <div class="d-flex justify-content-between gap-3">
                <div class="fw-semibold">הזמנה #${n.id}</div>
                <div class="fw-semibold">${m(n.totalAmount)}</div>
              </div>
              <div class="text-muted small mb-2">${new Date(n.createdAt).toLocaleString("he-IL")}</div>
              <div>${c}</div>
            </li>
          `}).join(""):i.innerHTML='<li class="text-muted">אין עדיין הזמנות.</li>'),e}async function q(){if(!a||!a.id){window.location.href="./login.html";return}try{const t=await fetch(`${f}/api/cart/checkout`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:a.id})}),e=await t.json();if(!t.ok)throw new Error(e.message||"Checkout failed");s(`הרכישה בוצעה בהצלחה. מספר הזמנה: ${e.order.id}`,"success"),await b()}catch{s("לא ניתן להשלים רכישה כרגע.","danger")}}async function b(){const t=await L();await E(),u&&(u.disabled=!t.items.length)}function N(){if(!a||!a.fullName){$();return}y&&(y.textContent=`מחובר כ-${a.fullName}${a.email?` · ${a.email}`:""}`),u&&u.addEventListener("click",q),s("כאן אפשר לנהל את הסל וההזמנות שלך במקום אחד.","info"),b().catch(()=>{s("שגיאה בטעינת נתוני האזור האישי. ודא שהשרת רץ.","danger")})}N();
