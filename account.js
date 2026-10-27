import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cfg=window.SUPABASE_CONFIG||{},supabase=cfg.url&&cfg.anonKey?createClient(cfg.url,cfg.anonKey):null;
const $=s=>document.querySelector(s);let mode="login";
function setMode(next){mode=next;$$(".auth-tab").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));$("#full-name-field").hidden=mode!=="signup";$("#full-name").required=mode==="signup";$("#auth-title").innerHTML=mode==="signup"?'MAKE IT<br>OFFICIAL<span class="dot">.</span>':'GOOD TO<br>SEE YOU<span class="dot">.</span>';$("#auth-description").textContent=mode==="signup"?"Create an account to save your details and make checkout easier.":"Sign in to manage your account and make checkout a little easier." ;$("#auth-submit").textContent=mode==="signup"?"CREATE ACCOUNT ↗":"SIGN IN ↗";$("#account-password").autocomplete=mode==="signup"?"new-password":"current-password";$("#auth-switch").innerHTML=mode==="signup"?'Already a member? <a href="#" data-switch="login">Sign in</a>':'New to the club? <a href="#" data-switch="signup">Create an account</a>';$("#auth-message").textContent=""}
function $$ (s){return [...document.querySelectorAll(s)]}
function showSignedIn(user){
  $("#auth-form-area").hidden=true;
  $("#auth-signed-in").hidden=false;
  const isDemo = user.isDemo || user.id === "demo-user-cacao-club";
  $("#signed-in-details").innerHTML=`You're signed in as <strong>${user.email}</strong> ${isDemo ? '<span style="background:var(--lime);color:var(--brown);padding:2px 7px;border-radius:3px;font-size:9px;margin-left:6px;font-family:var(--mono);font-weight:700;">DEMO TASTER</span>' : ''}. Your account is ready for your next chocolate order.`;
  $("#auth-title").innerHTML='YOU’RE IN<span class="dot">.</span>';
  $("#auth-description").textContent=isDemo ? "You are exploring in instant Demo Mode. No password or real sign-up needed." : "Welcome back to the club.";
}
async function checkSession(){
  const demoUser = JSON.parse(localStorage.getItem("cacao-demo-user") || "null");
  if(demoUser){
    showSignedIn(demoUser);
    return;
  }
  if(!supabase){
    $("#auth-message").textContent="Supabase isn't connected yet. You can use the Demo Account above to test without Supabase.";
    return;
  }
  const {data:{session}}=await supabase.auth.getSession();
  if(session)showSignedIn(session.user);
  supabase.auth.onAuthStateChange((_event,session)=>{
    if(localStorage.getItem("cacao-demo-user")) return;
    if(session)showSignedIn(session.user);
    else{$("#auth-form-area").hidden=false;$("#auth-signed-in").hidden=true;}
  });
}
$$(".auth-tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
document.addEventListener("click",e=>{
  const link=e.target.closest("[data-switch]");
  if(link){e.preventDefault();setMode(link.dataset.switch);}
  const demoBtn=e.target.closest("#demo-account-btn");
  if(demoBtn){
    const demoUser = {
      id: "demo-user-cacao-club",
      email: "demo@cacaoclub.com",
      user_metadata: { full_name: "Demo Taster" },
      isDemo: true
    };
    localStorage.setItem("cacao-demo-user", JSON.stringify(demoUser));
    showSignedIn(demoUser);
  }
});
$("#account-form").addEventListener("submit",async e=>{
  e.preventDefault();
  const msg=$("#auth-message"),btn=$("#auth-submit");
  msg.textContent="";
  if(!supabase){msg.textContent="Add your Supabase URL and anon/public key to enable account creation.";return;}
  const email=$("#account-email").value.trim().toLowerCase(),password=$("#account-password").value,fullName=$("#full-name").value.trim();
  btn.disabled=true;
  btn.textContent=mode==="signup"?"CREATING ACCOUNT...":"SIGNING IN...";
  try{
    if(mode==="signup"){
      const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});
      if(error)throw error;
      if(data.session){
        await supabase.from("profiles").upsert({id:data.user.id,full_name:fullName,email},{onConflict:"id"});
        showSignedIn(data.user);
        msg.textContent="Account created successfully.";
      }else{
        msg.textContent="Account created. Check your email to confirm your address, then sign in.";
        setMode("login");
      }
    }else{
      const {data,error}=await supabase.auth.signInWithPassword({email,password});
      if(error)throw error;
      const {error:profileError}=await supabase.from("profiles").upsert({id:data.user.id,full_name:data.user.user_metadata?.full_name||"",email},{onConflict:"id"});
      if(profileError)console.warn("Profile sync note:",profileError.message);
      showSignedIn(data.user);
      msg.textContent="You're signed in.";
    }
  }catch(err){
    msg.textContent=err.message||"Couldn't complete that request. Please try again.";
  }finally{
    btn.disabled=false;
    btn.textContent=mode==="signup"?"CREATE ACCOUNT ↗":"SIGN IN ↗";
  }
});
$("#sign-out").addEventListener("click",async()=>{
  localStorage.removeItem("cacao-demo-user");
  if(supabase)await supabase.auth.signOut();
  $("#auth-form-area").hidden=false;
  $("#auth-signed-in").hidden=true;
  setMode("login");
});
checkSession();
