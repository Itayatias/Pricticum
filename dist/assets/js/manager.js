const f="http://localhost:4000",C=localStorage.getItem("authUser"),u=C?JSON.parse(C):null,U=document.getElementById("managerUserLine"),$=document.getElementById("managerStatus"),o={totalUsers:document.getElementById("managerTotalUsers"),totalOrders:document.getElementById("managerTotalOrders"),totalRevenue:document.getElementById("managerTotalRevenue"),lowStock:document.getElementById("managerLowStock"),suppliers:document.getElementById("managerSuppliers"),purchaseOrders:document.getElementById("managerPurchaseOrders"),customers:document.getElementById("managerCustomers"),employees:document.getElementById("managerEmployees"),managers:document.getElementById("managerManagers"),recentOrders:document.getElementById("managerRecentOrders"),criticalStock:document.getElementById("managerCriticalStock"),categorySales:document.getElementById("managerCategorySales"),monthlyRevenue:document.getElementById("managerMonthlyRevenue")},a={form:document.getElementById("managerUserForm"),table:document.getElementById("managerUsersTable"),fullName:document.getElementById("managerUserFullName"),email:document.getElementById("managerUserEmail"),password:document.getElementById("managerUserPassword"),role:document.getElementById("managerUserRole"),customerType:document.getElementById("managerUserCustomerType"),saveBtn:document.getElementById("managerUserSaveBtn")},l={form:document.getElementById("managerSupplierForm"),table:document.getElementById("managerSuppliersTable"),lowStock:document.getElementById("managerSupplierLowStock"),purchaseOrders:document.getElementById("managerPurchaseOrdersTable"),name:document.getElementById("managerSupplierName"),email:document.getElementById("managerSupplierEmail"),phone:document.getElementById("managerSupplierPhone"),notes:document.getElementById("managerSupplierNotes"),saveBtn:document.getElementById("managerSupplierSaveBtn")},g={buttons:document.querySelectorAll("[data-report-kind]"),title:document.getElementById("managerReportTitle"),meta:document.getElementById("managerReportMeta"),tableHead:document.getElementById("managerReportHead"),tableBody:document.getElementById("managerReportBody"),exportBtn:document.getElementById("managerReportExportBtn")};let j=[],v=[],E=[],S=null,I=null,A=null;function c(e,t="info"){$&&($.className=`alert alert-${t} mb-4`,$.textContent=e,$.classList.remove("d-none"))}function T(e){return`₪ ${Number(e||0).toFixed(2)}`}function B(e){return e?new Date(e).toLocaleString("he-IL"):"--"}function M(e){return e?new Date(e).toLocaleDateString("he-IL"):"--"}function s(e){return String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}async function y(e,t){const n=await fetch(e,t),r=await n.json();if(!n.ok)throw new Error(r.message||"Request failed");return r}function F(){return!u||u.role!=="manager"?(window.location.href="./login.html",!1):!0}function J(e){const t={workHours:{title:'דו"ח שעות עובדים',endpoint:`${f}/api/admin/reports/work-hours?userId=${u.id}`,columns:["עובד","תאריך","כניסה","יציאה","משך","הערות"],csvName:"work-hours-report.csv",renderRow:n=>[n.fullName||"",M(n.checkIn),new Date(n.checkIn).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"}),n.checkOut?new Date(n.checkOut).toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"}):"פעילה",_(n.checkIn,n.checkOut),n.notes||""]},customers:{title:'דו"ח לקוחות',endpoint:`${f}/api/admin/reports/customers?userId=${u.id}`,columns:["שם","אימייל","סוג לקוח","תאריך יצירה"],csvName:"customers-report.csv",renderRow:n=>[n.fullName||"",n.email||"",n.customerType||"",M(n.createdAt)]},products:{title:'דו"ח מוצרים',endpoint:`${f}/api/admin/reports/products?userId=${u.id}`,columns:["מוצר","קטגוריה","מלאי","מינימום","ספק","מחיר","עודכן"],csvName:"products-report.csv",renderRow:n=>[n.productName||"",n.category||"",String(n.stock??0),String(n.minStock??0),n.supplierName||"",T(n.price),B(n.updatedAt)]},purchaseOrders:{title:'דו"ח הזמנות רכש מספקים',endpoint:`${f}/api/admin/reports/purchase-orders?userId=${u.id}`,columns:["ספק","סטטוס","נושא","נוצר על ידי","תאריך"],csvName:"purchase-orders-report.csv",renderRow:n=>[n.supplierName||"",n.status||"",n.subject||"",n.createdBy||"",B(n.createdAt)]}};return t[e]||t.workHours}function _(e,t){if(!e)return"--";const n=new Date(e).getTime(),r=t?new Date(t).getTime():Date.now(),i=Math.max(0,Math.floor((r-n)/6e4)),d=Math.floor(i/60),m=i%60;return`${d}:${String(m).padStart(2,"0")}`}function V(e,t){return[t,...e].map(r=>r.map(i=>`"${String(i??"").replaceAll('"','""')}"`).join(",")).join(`
`)}function Q(e,t,n){const r=new Blob([V(t,n)],{type:"text/csv;charset=utf-8;"}),i=URL.createObjectURL(r),d=document.createElement("a");d.href=i,d.download=e,d.click(),URL.revokeObjectURL(i)}function P(e,t,n,r){if(!e)return;if(!t.length){e.innerHTML='<div class="text-muted small">אין נתונים להצגה.</div>';return}const i=Math.max(...t.map(d=>Number(d[n]||0)),1);e.innerHTML=t.map(d=>{const m=Math.max(6,Number(d[n]||0)/i*100);return`
        <div class="mb-3">
          <div class="d-flex justify-content-between gap-3 small mb-1">
            <span class="fw-semibold">${s(d[r])}</span>
            <span>${s(d[n])}</span>
          </div>
          <div class="progress" style="height: 12px;">
            <div class="progress-bar bg-dark" role="progressbar" style="width: ${m}%"></div>
          </div>
        </div>
      `}).join("")}function z(e){var t,n,r,i,d,m,h,L,R;if(o.totalUsers&&(o.totalUsers.textContent=String(((t=e.users)==null?void 0:t.totalUsers)||0)),o.totalOrders&&(o.totalOrders.textContent=String(((n=e.orders)==null?void 0:n.totalOrders)||0)),o.totalRevenue&&(o.totalRevenue.textContent=T(((r=e.orders)==null?void 0:r.totalRevenue)||0)),o.lowStock&&(o.lowStock.textContent=String(((i=e.inventory)==null?void 0:i.lowStockCount)||0)),o.suppliers&&(o.suppliers.textContent=String(((d=e.suppliers)==null?void 0:d.totalSuppliers)||0)),o.purchaseOrders&&(o.purchaseOrders.textContent=String(((m=e.purchaseOrders)==null?void 0:m.openPurchaseOrders)||0)),o.customers&&(o.customers.textContent=String(((h=e.users)==null?void 0:h.customerCount)||0)),o.employees&&(o.employees.textContent=String(((L=e.users)==null?void 0:L.employeeCount)||0)),o.managers&&(o.managers.textContent=String(((R=e.users)==null?void 0:R.managerCount)||0)),o.recentOrders&&(o.recentOrders.innerHTML=(e.recentOrders||[]).map(p=>`
          <li class="border-bottom pb-2 mb-2">
            <div class="d-flex justify-content-between gap-2">
              <span class="fw-semibold">הזמנה #${s(p.id)}</span>
              <span>${T(p.totalAmount)}</span>
            </div>
            <div class="text-muted small">${s(p.customerName||"לקוח כללי")}</div>
            <div class="text-muted small">${B(p.createdAt)}</div>
          </li>
        `).join("")||'<li class="text-muted">אין הזמנות אחרונות.</li>'),o.criticalStock&&(o.criticalStock.innerHTML=(e.criticalStock||[]).map(p=>`
          <li class="border-bottom pb-2 mb-2">
            <div class="fw-semibold">${s(p.productName)}</div>
            <div class="text-muted small">
              ${s(p.category)} · מלאי ${s(p.stock)} · מינימום ${s(p.minStock)}
              ${p.supplierName?` · ספק ${s(p.supplierName)}`:""}
            </div>
          </li>
        `).join("")||'<li class="text-muted">אין מוצרים קריטיים כרגע.</li>'),P(o.categorySales,e.categorySales||[],"revenue","category"),o.monthlyRevenue){const p=(e.monthlyRevenue||[]).map(b=>({label:b.month,value:b.revenue}));P(o.monthlyRevenue,p.map(b=>({...b,monthLabel:b.label})),"value","label")}}function N(e=null){I=e?e.id:null,a.form&&(a.form.dataset.mode=e?"edit":"create"),a.saveBtn&&(a.saveBtn.textContent=e?"שמירת שינויים":"הוספת משתמש"),a.fullName&&(a.fullName.value=(e==null?void 0:e.fullName)||""),a.email&&(a.email.value=(e==null?void 0:e.email)||""),a.password&&(a.password.value=""),a.role&&(a.role.value=(e==null?void 0:e.role)||"customer"),a.customerType&&(a.customerType.value=(e==null?void 0:e.customerType)||"private",a.customerType.disabled=((e==null?void 0:e.role)||"customer")!=="customer")}function H(){!a.customerType||!a.role||(a.customerType.disabled=a.role.value!=="customer",a.role.value!=="customer"&&(a.customerType.value="private"))}function G(e){j=e,a.table&&(a.table.innerHTML=e.map(t=>`
        <tr>
          <td><input class="form-control form-control-sm" data-user-field="fullName" data-user-id="${t.id}" value="${s(t.fullName||"")}"></td>
          <td><input class="form-control form-control-sm" data-user-field="email" data-user-id="${t.id}" value="${s(t.email||"")}"></td>
          <td>
            <select class="form-select form-select-sm" data-user-field="role" data-user-id="${t.id}">
              <option value="customer" ${t.role==="customer"?"selected":""}>לקוח</option>
              <option value="employee" ${t.role==="employee"?"selected":""}>עובד</option>
              <option value="manager" ${t.role==="manager"?"selected":""}>מנהל</option>
            </select>
          </td>
          <td>
            <select class="form-select form-select-sm" data-user-field="customerType" data-user-id="${t.id}" ${t.role!=="customer"?"disabled":""}>
              <option value="private" ${t.customerType==="private"?"selected":""}>פרטי</option>
              <option value="business" ${t.customerType==="business"?"selected":""}>עסקי</option>
              <option value="contractor" ${t.customerType==="contractor"?"selected":""}>קבלן</option>
            </select>
          </td>
          <td><input type="password" class="form-control form-control-sm" data-user-field="password" data-user-id="${t.id}" placeholder="השאר ריק אם לא משנים"></td>
          <td>
            <div class="d-flex gap-2 flex-wrap">
              <button type="button" class="btn btn-dark btn-sm" data-user-save="${t.id}">שמור</button>
              <button type="button" class="btn btn-outline-secondary btn-sm" data-user-edit="${t.id}">טען לעריכה</button>
            </div>
          </td>
        </tr>
      `).join(""),document.querySelectorAll("[data-user-save]").forEach(t=>{t.addEventListener("click",()=>X(t.dataset.userSave))}),document.querySelectorAll("[data-user-edit]").forEach(t=>{t.addEventListener("click",()=>{const n=j.find(r=>String(r.id)===String(t.dataset.userEdit));n&&N(n)})}))}function w(e,t){const n=document.querySelector(`[data-user-field="${t}"][data-user-id="${e}"]`);return n?n.value:""}async function k(){const e=await y(`${f}/api/admin/users?userId=${u.id}`);G(e)}async function W(e){var t,n,r,i,d;e.preventDefault();try{const m={userId:u.id,fullName:String(((t=a.fullName)==null?void 0:t.value)||"").trim(),email:String(((n=a.email)==null?void 0:n.value)||"").trim(),role:String(((r=a.role)==null?void 0:r.value)||"customer"),customerType:String(((i=a.customerType)==null?void 0:i.value)||"private")},h=String(((d=a.password)==null?void 0:d.value)||"").trim();if(!m.fullName||!m.email){c("יש למלא שם ואימייל.","warning");return}if(!I&&!h){c("יש להזין סיסמה עבור משתמש חדש.","warning");return}h&&(m.password=h),I?(await y(`${f}/api/admin/users/${I}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(m)}),c("המשתמש עודכן בהצלחה.","success")):(await y(`${f}/api/admin/users`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(m)}),c("המשתמש נוסף בהצלחה.","success")),N(null),await k()}catch{c("לא ניתן לשמור משתמש כרגע.","danger")}}async function X(e){try{const t={userId:u.id,fullName:String(w(e,"fullName")).trim(),email:String(w(e,"email")).trim(),role:String(w(e,"role")),customerType:String(w(e,"customerType")||"private"),password:String(w(e,"password")).trim()};await y(`${f}/api/admin/users/${e}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),c("המשתמש עודכן בהצלחה.","success"),await k()}catch{c("לא ניתן לעדכן משתמש כרגע.","danger")}}function x(e){if(v=e,l.table&&(l.table.innerHTML=e.map(t=>`
          <tr>
            <td class="fw-semibold">${s(t.supplierName)}</td>
            <td>${s(t.supplierCode||"--")}</td>
            <td>${s(t.email)}</td>
            <td>${s(t.phone||"--")}</td>
            <td>${t.totalProducts}</td>
            <td><span class="badge bg-warning text-dark">${t.lowStockCount}</span></td>
            <td>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-dark btn-sm" data-supplier-edit="${t.supplierId}">ערוך</button>
                <a class="btn btn-outline-primary btn-sm" href="${t.mailtoHref}">פתח דוא"ל</a>
                <button type="button" class="btn btn-outline-secondary btn-sm" data-supplier-order="${t.supplierId}">שמור הזמנה</button>
              </div>
            </td>
          </tr>
        `).join("")),l.lowStock){const t=e.flatMap(n=>n.lowStockProducts.map(r=>({...r,supplierName:n.supplierName,supplierId:n.supplierId})));l.lowStock.innerHTML=t.length?t.map(n=>`
              <li class="border-bottom pb-2 mb-2">
                <div class="d-flex justify-content-between gap-3">
                  <span class="fw-semibold">${s(n.productName)}</span>
                  <span class="text-muted small">${s(n.supplierName)}${n.supplierCode?` · ${s(n.supplierCode)}`:""}</span>
                </div>
                <div class="text-muted small">
                  מלאי ${s(n.stock)} · מינימום ${s(n.minStock)} · הזמנה מוצעת ${s(n.suggestedQuantity)}
                </div>
              </li>
            `).join(""):'<li class="text-muted">אין מוצרים במלאי נמוך.</li>'}l.purchaseOrders&&(l.purchaseOrders.innerHTML=E.length?E.map(t=>`
              <tr>
                <td>${s(t.supplierName)}</td>
                <td>${s(t.status)}</td>
                <td>${s(t.subject)}</td>
                <td>${s(t.createdBy)}</td>
                <td>${B(t.createdAt)}</td>
              </tr>
            `).join(""):'<tr><td colspan="5" class="text-muted">אין עדיין הזמנות רכש.</td></tr>'),document.querySelectorAll("[data-supplier-edit]").forEach(t=>{t.addEventListener("click",()=>{const n=v.find(r=>String(r.supplierId)===String(t.dataset.supplierEdit));n&&O(n)})}),document.querySelectorAll("[data-supplier-order]").forEach(t=>{t.addEventListener("click",()=>K(t.dataset.supplierOrder))})}function O(e=null){A=e?e.supplierId:null,l.saveBtn&&(l.saveBtn.textContent=e?"שמירת ספק":"הוספת ספק"),l.name&&(l.name.value=(e==null?void 0:e.supplierName)||""),l.email&&(l.email.value=(e==null?void 0:e.email)||""),l.phone&&(l.phone.value=(e==null?void 0:e.phone)||""),l.notes&&(l.notes.value=(e==null?void 0:e.notes)||"")}async function Y(e){var t,n,r,i;e.preventDefault();try{const d={userId:u.id,supplierId:A,supplierName:String(((t=l.name)==null?void 0:t.value)||"").trim(),email:String(((n=l.email)==null?void 0:n.value)||"").trim(),phone:String(((r=l.phone)==null?void 0:r.value)||"").trim(),notes:String(((i=l.notes)==null?void 0:i.value)||"").trim()};if(!d.supplierName||!d.email){c("יש למלא שם ספק ואימייל.","warning");return}await y(`${f}/api/admin/suppliers`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}),c("הספק נשמר בהצלחה.","success"),O(null),await D()}catch{c("לא ניתן לשמור ספק כרגע.","danger")}}async function D(){v=await y(`${f}/api/admin/suppliers?userId=${u.id}`),x(v)}async function Z(){E=await y(`${f}/api/admin/purchase-orders?userId=${u.id}`),x(v)}async function K(e){try{const t=v.find(i=>String(i.supplierId)===String(e));if(!t)return;const r=(await y(`${f}/api/admin/purchase-orders`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:u.id,supplierId:t.supplierId,status:"sent"})})).order;E=[{supplierName:r.supplierName,status:r.status,subject:r.subject,createdBy:u.fullName,createdAt:new Date().toISOString()},...E],x(v),c(`הזמנת רכש נוצרה עבור ${t.supplierName}.`,"success"),window.location.href=t.mailtoHref}catch{c("לא ניתן ליצור הזמנת רכש כרגע.","danger")}}async function ee(){const e=await y(`${f}/api/admin/dashboard?userId=${u.id}`);z(e)}function te(e,t){!g.tableHead||!g.tableBody||(g.tableHead.innerHTML=`
    <tr>
      ${t.columns.map(n=>`<th>${n}</th>`).join("")}
    </tr>
  `,g.tableBody.innerHTML=e.length?e.map(n=>`<tr>${t.renderRow(n).map(i=>`<td>${s(i)}</td>`).join("")}</tr>`).join(""):`<tr><td colspan="${t.columns.length}" class="text-muted">אין נתונים להצגה.</td></tr>`)}async function q(e){const t=J(e),n=await y(t.endpoint);S={...t,kind:e,data:n},g.title&&(g.title.textContent=t.title),g.meta&&(g.meta.textContent=`ייצוא מהיר ל-${t.csvName}`),te(n,t)}function ne(){g.buttons.forEach(e=>{e.addEventListener("click",()=>{q(e.dataset.reportKind).catch(()=>{c('לא ניתן לטעון את הדו"ח כרגע.',"danger")})})}),g.exportBtn&&g.exportBtn.addEventListener("click",()=>{if(!S){c('יש לבחור דו"ח לפני הייצוא.',"warning");return}Q(S.csvName,S.data.map(e=>S.renderRow(e)),S.columns),c('הדו"ח יוצא בהצלחה.',"success")})}function ae(){a.form&&a.form.addEventListener("submit",W),a.role&&a.role.addEventListener("change",H),a.customerType&&a.customerType.addEventListener("change",H),l.form&&l.form.addEventListener("submit",Y),ne()}async function re(){await ee()}async function oe(){N(null),await k()}async function se(){O(null),await D(),await Z()}async function le(){await q("workHours")}function ie(){if(!F()||(U&&(U.textContent=`מחובר כ-${u.fullName} · הרשאת מנהל מלאה`),!$))return;c('ברוך הבא לאזור הניהולי. כאן אפשר לנהל ספקים, משתמשים, מלאי ודו"חות.',"info"),ae();const e=[];(o.totalUsers||o.totalOrders||o.totalRevenue)&&e.push(re()),(a.table||a.form)&&e.push(oe()),(l.table||l.form||l.lowStock)&&e.push(se()),(g.tableBody||g.buttons.length)&&e.push(le()),Promise.all(e).catch(()=>{c("שגיאה בטעינת אזור המנהל. ודא שהשרת רץ ושהמשתמש מוגדר כמנהל.","danger")})}ie();
