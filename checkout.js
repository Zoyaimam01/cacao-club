import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cfg=window.SUPABASE_CONFIG||{};
const supabase=cfg.url&&cfg.anonKey?createClient(cfg.url,cfg.anonKey):null;
const products=[
{id:1,name:"72% Dark Chocolate Bar with Raspberry",price:8.5,weight:"85G"},
{id:2,name:"72% Dark Chocolate Clusters with Raspberry",price:11,weight:"120G"},
{id:3,name:"Mini 72% Dark Chocolate Bar with Raspberry",price:5.5,weight:"45G"},
{id:4,name:"Sea Salt Crunch Chocolate Bar",price:8,weight:"85G"},
{id:5,name:"Milk Chocolate Hazelnut Bites",price:10,weight:"120G"},
{id:6,name:"The Daily Pause Gift Box",price:28,weight:"6 PIECES"},
{id:7,name:"Salted Caramel Chocolate Bar",price:8.5,weight:"85G"},
{id:8,name:"Chocolate Discovery Box",price:34,weight:"12 PIECES"}
];
const $=s=>document.querySelector(s), money=n=>"$"+n.toFixed(2);
let cart=JSON.parse(localStorage.getItem("cacao-cart")||"{}"), currentUser=null;
function items(){return Object.entries(cart).map(([id,quantity])=>({product:products.find(p=>p.id===+id),quantity:+quantity})).filter(x=>x.product&&x.quantity>0)}
function render(){
  const list=items(),subtotal=list.reduce((sum,x)=>sum+x.product.price*x.quantity,0);
  $("#checkout-items").innerHTML=list.length?list.map(({product:p,quantity:q})=>`<div class="checkout-item"><img src="assets/chocolate-${p.id}.svg" alt="${p.name}"><div><h3>${p.name}</h3><p>QTY ${q} · ${p.weight}</p></div><strong>${money(p.price*q)}</strong></div>`).join(""):`<p>Your bag is empty. <a href="index.html#shop"><u>Find your flavour</u></a> or <button type="button" id="add-sample-btn" style="border:0;background:none;text-decoration:underline;cursor:pointer;font:inherit;font-weight:700;color:var(--brown);">add a sample bar to bag</button>.</p>`;
  $("#checkout-subtotal").textContent=money(subtotal);
  $("#checkout-total").textContent=money(subtotal);
  $("#order-now").disabled=!list.length;
  $("#order-now").style.opacity=list.length?"1":".5";
}
async function loadUser(){
  const demoUser = JSON.parse(localStorage.getItem("cacao-demo-user") || "null");
  if(demoUser){
    currentUser = demoUser;
    updateAuth();
    return;
  }
  if(!supabase){
    updateAuth();
    return;
  }
  const {data:{session}}=await supabase.auth.getSession();
  currentUser=session?.user||null;
  supabase.auth.onAuthStateChange((_event,session)=>{
    if(localStorage.getItem("cacao-demo-user")) return;
    currentUser=session?.user||null;
    updateAuth();
  });
  updateAuth();
}
function updateAuth(){
  const notice=$("#auth-notice");
  if(currentUser){
    const isDemo = currentUser.isDemo || currentUser.id === "demo-user-cacao-club";
    notice.innerHTML=`Signed in as <strong>${currentUser.email}</strong> ${isDemo ? '<span style="background:var(--lime);color:var(--brown);padding:2px 7px;border-radius:3px;font-size:9px;margin-left:4px;font-family:var(--mono);font-weight:700;">DEMO TASTER</span>' : ''}. Your order will be linked to this account. <button type="button" id="switch-account-btn" style="background:none;border:none;cursor:pointer;font:inherit;text-decoration:underline;margin-left:8px;color:var(--brown);">Sign out / switch</button>`;
    $("#checkout-email").value=currentUser.email||"";
    $("#checkout-email").readOnly=true;
    if(isDemo && !$("#first-name").value){
      $("#first-name").value = "Demo";
      $("#last-name").value = "Taster";
      $("#address").value = "123 Cocoa Blossom Way";
      $("#city").value = "Chocolate Town";
      $("#region").value = "NY";
      $("#postal").value = "10001";
      $("#country").value = "United States";
    }
  }else{
    notice.innerHTML='To place an order, <button type="button" id="demo-checkout-btn" style="background:none;border:none;cursor:pointer;font:inherit;font-weight:700;text-decoration:underline;color:var(--brown);padding:0;">⚡ Continue with Demo Account (1-Click)</button>, or <a href="account.html"><u>Sign in / Create account</u></a>.';
    $("#checkout-email").value="";
    $("#checkout-email").readOnly=false;
  }
}
document.addEventListener("click", e=>{
  const demoBtn = e.target.closest("#demo-checkout-btn");
  if(demoBtn){
    const demoUser = {
      id: "demo-user-cacao-club",
      email: "demo@cacaoclub.com",
      user_metadata: { full_name: "Demo Taster" },
      isDemo: true
    };
    localStorage.setItem("cacao-demo-user", JSON.stringify(demoUser));
    currentUser = demoUser;
    updateAuth();
    return;
  }
  const switchBtn = e.target.closest("#switch-account-btn");
  if(switchBtn){
    localStorage.removeItem("cacao-demo-user");
    if(supabase) supabase.auth.signOut();
    currentUser = null;
    updateAuth();
    return;
  }
  const sampleBtn = e.target.closest("#add-sample-btn");
  if(sampleBtn){
    cart[1] = (cart[1] || 0) + 1;
    localStorage.setItem("cacao-cart", JSON.stringify(cart));
    render();
    return;
  }
});
$("#checkout-form").addEventListener("submit",async e=>{
  e.preventDefault();
  const form = e.currentTarget;
  const msg=$("#checkout-message"),btn=$("#order-now");
  msg.textContent="";
  if(!items().length){
    msg.textContent="Your bag is empty. Add a chocolate before checking out.";
    return;
  }
  if(!currentUser){
    msg.textContent="Please choose Demo Account or sign in before placing your order.";
    return;
  }
  btn.disabled=true;
  btn.textContent="PLACING ORDER...";
  try{
    const f=new FormData(form);
    const customer={
      first_name:f.get("first_name").trim(),
      last_name:f.get("last_name").trim(),
      email:f.get("email").trim(),
      address:f.get("address").trim(),
      city:f.get("city").trim(),
      region:f.get("region").trim(),
      postal_code:f.get("postal_code").trim(),
      country:f.get("country"),
      notes:f.get("notes").trim()
    };
    const payload={customer,items:items().map(({product,quantity})=>({product_id:product.id,name:product.name,unit_price:product.price,quantity}))};

    if(!supabase){
      msg.textContent="Supabase is not configured. Add your project URL and anon key to supabase-config.js.";
      btn.disabled=false;
      btn.textContent="ORDER NOW ↗";
      return;
    }

    const {data,error}=await supabase.rpc("place_order",{order_payload:payload});
    if(error){
      if(error.message?.includes("Please sign in before placing an order")){
        throw new Error("Supabase requires updating the place_order function in your SQL Editor to allow guest/demo orders. See instructions below.");
      }
      throw error;
    }
    localStorage.removeItem("cacao-cart");
    cart={};
    render();
    if(form) form.reset();
    $("#checkout-email").value=currentUser.email||"";
    $("#checkout-email").readOnly=true;
    msg.innerHTML=`🎉 <strong>Order saved directly to Supabase!</strong><br>Your database order ID is <strong>#${data}</strong>. Open your Supabase Dashboard <code>orders</code> table to see it live!`;
    $("#auth-notice").innerHTML=`Order <strong>#${data}</strong> recorded in Supabase.`;
    btn.textContent="ORDER PLACED ✓";
  }catch(err){
    console.error(err);
    msg.innerHTML=err.message||"We couldn't save your order to Supabase. Please check your setup.";
    btn.textContent="ORDER NOW ↗";
    btn.disabled=false;
  }
});
render();
loadUser();
