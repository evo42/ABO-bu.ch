const SERVICE_WORKER_URL='https://SEPA.digital/pay.js';let w3cPR=false;function addInstruments(registration){registration.paymentManager.userHint="pay@sepa.digital";return Promise.all([registration.paymentManager.instruments.set("SEPA.digital",{name:"SEPA.digital Bank Account",icons:[{src:"https://SEPA.digital/pay/icon-sepa.png",sizes:"32x32",type:"image/png"}],method:"https://SEPA.digital"})])};function registerPaymentAppServiceWorker(){navigator.serviceWorker.register(SERVICE_WORKER_URL).then(function(registration){if(!registration||!registration.paymentManager){prApiError('W3C Payment Request API not available. Use Google Chrome / Microsoft Edge / Brave Browser.');return}addInstruments(registration).then(function(){$('body').data('w3c-pr-api-not-supported',false);prStatus(true);w3cPR=true})}).catch((error)=>{w3cPR=false;prError(error)})}function unregisterPaymentAppServiceWorker(){navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL).then(function(registration){if(!registration||!registration.paymentManager){prApiError('W3C Payment Request API not available. Use Google Chrome / Microsoft Edge / Brave Browser.');return}registration.unregister().then((success)=>{$('body').data('w3c-pr-api-not-supported',true);prStatus(!success)})})}function prApiError(errorMessage){var enabled=true,buttonText=enabled?'<i style="color: green" class="fas fa-check-circle"></i> &nbsp; S€PA.digital is active':'<i style="color: blue" class="fas fa-plus-circle"></i> &nbsp; S€PA.digital activate',btnActivate=document.getElementById("w3c-pr-api-btn-sepa-install");if(btnActivate&&btnActivate.innerHTML){btnActivate.innerHTML=buttonText}$('body').data('w3c-pr-api-not-supported',true);}function prError(errorMessage){console.log('w3c-pr-api-error',errorMessage);let el=document.getElementById('pr-error');if(el&&errorMessage){el.innerHTML=errorMessage.toString()}else{return false}}function prStatus(enabled){console.log('w3c-pr-api-status',enabled);prError(false);var buttonText=enabled?'<i style="color: green" class="fas fa-check-circle"></i> &nbsp; S€PA.digital is active':'<i style="color: blue" class="fas fa-plus-circle"></i> &nbsp; S€PA.digital activate',btnActivate=document.getElementById("w3c-pr-api-btn-sepa-install");if(btnActivate.innerHTML&&btnActivate.innerHTML){btnActivate.innerHTML=buttonText}fnUnReg=function(){unregisterPaymentAppServiceWorker();};fnReg=function(){registerPaymentAppServiceWorker();};if(enabled){try{btnActivate.removeEventListener('click',fnReg);btnActivate.addEventListener('click',fnUnReg)}catch(e){console.log(e)}}else{try{btnActivate.removeEventListener('click',fnUnReg);btnActivate.addEventListener('click',fnReg)}catch(e){console.log(e)}}}navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL).then(function(registration){console.log('w3c-pr-api-status','Load service worker ...');if(registration){if(registration.paymentManager){console.log('w3c-pr-api-status','OK. Update PR API service worker.');$('body').data('w3c-pr-api-not-supported',false);w3cPR=true;registration.update()}else{console.log('w3c-pr-api-status','OK. Unregister PR API service worker.');$('body').data('w3c-pr-api-not-supported',true);w3cPR=false;unregisterPaymentAppServiceWorker()}}else{console.log('w3c-pr-api-status','Error. PR API service worker not loaded.');$('body').data('w3c-pr-api-not-supported',true);w3cPR=false}prStatus(!!registration)});window.w3cPR=w3cPR;