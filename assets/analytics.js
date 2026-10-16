/* Loaded only by builds with a validated public tag ID. No settings/seed are read. */
(() => {
 'use strict';
 if(window.GalleryAnalytics)return;
 const script=document.querySelector('script[data-google-tag-id]'),id=script?.dataset.googleTagId;
 if(!/^(G|GT)-[A-Z0-9]{6,20}$/.test(id||''))return;
 const canonical=document.querySelector('link[rel=canonical]')?.href;
 if(!canonical)return;
 const clean=new URL(canonical);clean.search='';clean.hash='';
 window.dataLayer=window.dataLayer||[];
 function gtag(){window.dataLayer.push(arguments);}
 gtag('js',new Date());
 gtag('set',{page_location:clean.href,page_referrer:'',page_title:document.title});
 gtag('config',id,{send_page_view:false,page_location:clean.href,page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false});
 gtag('event','page_view',{page_location:clean.href,page_referrer:'',page_title:document.title});
 const events=new Set(['download_svg','download_png','share_link','share_native','share_image','share_social']);
 const methods=new Set(['svg','png','copy','native','x','line','facebook']);
 window.GalleryAnalytics=Object.freeze({track:(event,method)=>{if(events.has(event)&&methods.has(method))gtag('event',event,{method,page_location:clean.href,page_referrer:''});}});
 const remote=document.createElement('script');remote.async=true;remote.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.append(remote);
})();
