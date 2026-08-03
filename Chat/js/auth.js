async function logout(){await supabase.auth.signOut();location='index.html';}
(async()=>{const {data}=await supabase.auth.getSession();if(!data.session)location='index.html';})();