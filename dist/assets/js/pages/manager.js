import"../main.js";const d="http://localhost:4000",g=localStorage.getItem("authUser"),s=g?JSON.parse(g):null,p=document.getElementById("managerUserLine"),r=document.getElementById("managerStatus"),y=document.getElementById("managerTotalUsers"),w=document.getElementById("managerTotalOrders"),$=document.getElementById("managerTotalRevenue"),b=document.getElementById("managerLowStock"),S=document.getElementById("managerCustomers"),h=document.getElementById("managerEmployees"),v=document.getElementById("managerManagers"),E=document.getElementById("managerRecentOrders"),C=document.getElementById("managerCriticalStock"),x=document.getElementById("managerUsersTable");function l(e,t="info"){r&&(r.className=`alert alert-${t} mb-4`,r.textContent=e,r.classList.remove("d-none"))}function I(){r&&(r.classList.add("d-none"),r.textContent="")}function U(e){return`₪ ${Number(e||0).toFixed(2)}`}function k(){return!s||s.role!=="manager"?(window.location.href="./login.html",!1):!0}function L(e){var t,a,o,c,m,u,f;y&&(y.textContent=String(((t=e.users)==null?void 0:t.totalUsers)||0)),w&&(w.textContent=String(((a=e.orders)==null?void 0:a.totalOrders)||0)),$&&($.textContent=U(((o=e.orders)==null?void 0:o.totalRevenue)||0)),b&&(b.textContent=String(((c=e.inventory)==null?void 0:c.lowStockCount)||0)),S&&(S.textContent=String(((m=e.users)==null?void 0:m.customerCount)||0)),h&&(h.textContent=String(((u=e.users)==null?void 0:u.employeeCount)||0)),v&&(v.textContent=String(((f=e.users)==null?void 0:f.managerCount)||0)),E&&(E.innerHTML=(e.recentOrders||[]).map(n=>`
          <li class="border-bottom pb-2 mb-2">
            <div class="d-flex justify-content-between gap-2">
              <span class="fw-semibold">הזמנה #${n.id}</span>
              <span>${U(n.totalAmount)}</span>
            </div>
            <div class="text-muted small">${new Date(n.createdAt).toLocaleString("he-IL")}</div>
          </li>
        `).join("")||'<li class="text-muted">אין הזמנות אחרונות.</li>'),C&&(C.innerHTML=(e.criticalStock||[]).map(n=>`
          <li class="border-bottom pb-2 mb-2">
            <div class="fw-semibold">${n.productName}</div>
            <div class="text-muted small">${n.category} · מלאי ${n.stock} · מינימום ${n.minStock}</div>
          </li>
        `).join("")||'<li class="text-muted">אין פריטים קריטיים כרגע.</li>')}function T(e){x&&(x.innerHTML=e.map(t=>`
        <tr>
          <td><input class="form-control form-control-sm" data-field="fullName" data-user-id="${t.id}" value="${t.fullName||""}"></td>
          <td><input class="form-control form-control-sm" data-field="email" data-user-id="${t.id}" value="${t.email||""}"></td>
          <td>
            <select class="form-select form-select-sm" data-field="role" data-user-id="${t.id}">
              <option value="customer" ${t.role==="customer"?"selected":""}>לקוח</option>
              <option value="employee" ${t.role==="employee"?"selected":""}>עובד</option>
              <option value="manager" ${t.role==="manager"?"selected":""}>מנהל</option>
            </select>
          </td>
          <td><input class="form-control form-control-sm" data-field="password" data-user-id="${t.id}" value="${t.password||""}"></td>
          <td>
            <button type="button" class="btn btn-dark btn-sm" data-save-user="${t.id}">שמור</button>
          </td>
        </tr>
      `).join(""),N())}function N(){document.querySelectorAll("[data-save-user]").forEach(e=>{e.addEventListener("click",()=>O(e.dataset.saveUser))})}function i(e,t){const a=`[data-field="${t}"][data-user-id="${e}"]`,o=document.querySelector(a);return o?o.value:""}async function O(e){try{const t={userId:s.id,fullName:i(e,"fullName").trim(),email:i(e,"email").trim(),role:i(e,"role"),password:i(e,"password").trim()},a=await fetch(`${d}/api/admin/users/${e}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),o=await a.json();if(!a.ok)throw new Error(o.message||"Failed to update user");I(),await B()}catch{l("לא ניתן לעדכן משתמש כרגע.","danger")}}async function j(){const e=await fetch(`${d}/api/admin/dashboard?userId=${s.id}`),t=await e.json();if(!e.ok)throw new Error(t.message||"Failed to load dashboard");L(t)}async function M(){const e=await fetch(`${d}/api/admin/users?userId=${s.id}`),t=await e.json();if(!e.ok)throw new Error(t.message||"Failed to load users");T(t)}async function B(){await j(),await M()}function R(){k()&&(p&&(p.textContent=`מחובר כ-${s.fullName} · מנהל מערכת`),l("כאן אפשר לערוך משתמשים ולראות תמונת מצב מלאה של המערכת.","info"),B().catch(()=>{l("שגיאה בטעינת לוח המנהל. ודא שהשרת רץ ושהמשתמש מוגדר כמנהל.","danger")}))}R();
