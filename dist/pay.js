$(document).ready(function ($) {
  var userSlug,
    txInit,
    userDisplayName,
    userName,
    userId,
    txAmount = 0,
    txCheckInt,
    txCheckCount = 0,
    txSendAwaiting,
    icon = $('.w3c-pr-btn-checkout i'),
    currentTs = Math.floor(Date.now() / 1000),
    timeoutID1,
    timeoutID2,
    sd,
    txCheckCount = 0,
    that,
    txAwaiting = JSON.parse(localStorage.getItem('txAwaiting'));

  window.SEPAdigitalTxId = false;

  // check for awaiting tx
  if (txAwaiting && txAwaiting.id != '') {
    if (txCheckInt) {
      clearInterval(txCheckInt);
    }
    txCheckInt = setInterval(function () {
      txAwaitingCheck(txAwaiting);
    }, 3 * 1000);

    if (txAwaiting.status == 'payment_settled' || txAwaiting.status == 'payment_signed') {
      console.log('-- tx success from localstorage');
      clearInterval(txCheckInt);

      $('#payment-section').hide();

      localStorage.removeItem('txAwaiting');
      localStorage.setItem('txLastPaid', JSON.stringify(txAwaiting));
    } else if (txAwaiting.status == 'created') {

      $('#payment-section').show();
      $('#sepa-qr-code').hide();
      $('#sepa-pay-success').show();

      $('#sepa-pay-success i').removeClass().addClass('fas fa-circle-notch fa-spin');
      $('.hide-while-txAwaitReload').hide();
      // $('.show-while-txAwaitReload').show();

      if (icon.length > 0) {
        icon.removeClass().addClass('fas fa-circle-notch fa-spin');
      }
    }

  } else {
    /*
    txSendAwaiting = setTimeout(function() {
        console.log('AUTO TRIGGER txAwaiting');
        // if (!txSendAwaiting) {
        txAwaitingSend();
        // }
    }, 20 * 1000);
    */
  }

  function startAboInitRequest() {
    // var icon = $('#btn-sepa-pay i'),
    var currentTs = Math.floor(Date.now() / 1000),
      email,
      phone;

    window.SEPAdigitalTxId = false;

    if (icon.length > 0) {
      icon.removeClass().addClass('fas fa-circle-notch fa-spin'); /* fas fa-clock */
    }

    if ($('#userId').length > 0 && $('#userId').val().trim().indexOf('@')) {
      email = $('#userId').val().trim();
    } else if ($('#userId').length > 0 && $('#userId').val().trim().indexOf('+')) {
      phone = $('#userId').val().trim();
    }

    window.SEPAdigitalTxId = false;
    let amountInput = $('#amount').val() || 1;
    let amount = parseFloat(parseFloat(amountInput + ''.replace(',', '.').trim(), 10).toFixed(2), 10),
      ibanTo = window.SEPAdigital.to.iban.replace(/\s/g, '') || '',
      bicTo = window.SEPAdigital.to.bic || '',
      nameTo = window.SEPAdigital.to.recipient.alternateName || '',
      ref = window.SEPAdigital.to.reason || '';

    txAwaiting = {
      correlationId: 'A-bu.ch-' + ibanTo + '-' + ref.replace(/\W+/g, '') + '-' + currentTs,
      iban: ibanTo,
      bic: bicTo,
      amount: amount,
      name: nameTo,
      customerId: '',
      reference: ref,
      userPhone: phone,
      userEmail: email,
      // shortId: $('#txRef').val().trim(),
      // ipn: "https://api.sepa.digital/v1/tx/inbox",
      // tip: parseFloat(($('#txTip') && $('#txTip').val() && $('#txTip').val().replace(',', '.').replace('€', '').trim()) || 0, 10),
      // ipn: "https://webhook.site/cf3f287f-ae8c-4ece-8ddd-6a519341ffcd"
    };

    l('send awaiting tx', txAwaiting);

    /* store before send and update after receiving data */
    localforage.setItem('txAwaiting', JSON.stringify(txAwaiting));
    if (window.txCheckInt) {
      clearInterval(window.txCheckInt);
    }

    let xhr = new XMLHttpRequest();
    xhr.open("POST", 'https://api.sepa.digital/credit-transfer');
    xhr.send(JSON.stringify(txAwaiting));
    xhr.responseType = 'json';

    xhr.onload = function () {
      // process response
      l('--- response awaiting tx', xhr.response || 'ERROR no response data');
      // clearInterval(window.txCheckInt);
      var pr = xhr.response;
      var that = this;

      l(' *** new tx data', pr['_links']);

      window.SEPAdigitalTxId = pr.uuid;

      if (pr && pr['_links'] && pr['_links'].payment) {

        this.tx = this.txSent = this.txAwaiting = pr;
        this.qrcodeUrl = pr['_links'].qrcodeUrl;

        localforage.setItem('txAwaiting', JSON.stringify(pr));

        window.txCheckInt = setInterval(function () {
          txAwaitingCheck(pr);
        }, 1500);

        var clipboard = new ClipboardJS('#txShortUrl', {
          text: function (trigger) {
            // return trigger.innerText;
            return pr['_links'].shortUrl
          }
        });

        clipboard.on('success', function (e) {
          l('-- ', pr['uuid'], e)

          // e.clearSelection();
        });

        $('#SEPAdigitalPRform').hide();
        $('#SEPAdigitalPRcode').show();

        /*const fm = new FormatMoney({
            decimals: 2
        });*/

        $('#SEPAdigitalPRcode img').attr('src', pr['_links'].qrcode);
        $('#SEPAdigitalPRcode h2').text('📚   ' + pr['name_to']);
        $('#SEPAdigitalPRcode h1').html('💶   € ' + parseFloat(pr['amount'], 10).toFixed(2).replace('.', ',') + ' <i class="fas fa-circle-notch fa-spin has-text-info"></i>');
        $('#SEPAdigitalPRcode h3').text('💳   ' + pr['iban_to']);
        $('#SEPAdigitalPRcode h4').html('🌐   <a href="https://SEPA.id/091D1D14" target="_blank">https://SEPA.id/' + pr['shortId'] + '</a>');
      } else {
        l('**** ERROR on create payment request ***')
      }
    };

    xhr.onerror = function () {
      l('ERROR init EPC QR', error);
      // v.loader = false;
    };
  }

  // on blur check for eIDAS ID (email)
  $('#userId').on('blur', function (e) {
    var userId = $(this).val().trim();
    var icon = $('#btn-sepa-instant-pay i');

    icon.removeClass().addClass('fas fa-chevron-circle-right');
    $('#btn-sepa-eu-pay').hide();
    $('#btn-sepa-instant-pay').show();

    $('#userName').attr('disabled', false);
  });

  $('#userName').on('keyup', function (e) {
    userSlug = slugify($(this).val());
    // console.log('username entered: ' + userSlug);

    if (userSlug.length < 3) {
      $('#userId').val('');
      $('#eSEPA').text('');
    }
  });

  function txAwaitingCheck(tx) {
    // return;

    let that = this;

    console.log('### txAwaitingCheck', tx);
    
    if (txCheckCount > 250) {
      clearInterval(txCheckInt);
      return;
    }

    if (!tx.uuid) {
      clearInterval(txCheckInt);
      localStorage.removeItem('txAwaiting');
      return;
    }

    let xhr = new XMLHttpRequest();
    xhr.open("GET", 'https://api.sepa.digital/v1/tx/' + tx.uuid);
    xhr.send();
    xhr.responseType = 'json';

    xhr.onload = function () {

      // process response
      // clearInterval(window.txCheckInt);
      var pr = xhr.response,
        d = pr,
        s = xhr.status;

      l('response awaiting tx', pr);

      l('- tx check', txCheckCount, s, d);
      txCheckCount++;

      //if (s == 'success') {

      if (d.status == 'payment_settled' || d.status == 'payment_signed') {
        console.log('-- tx success');
        clearInterval(that.txCheckInt);

        this.tx = pr;

        localforage.removeItem('txAwaiting');
        localforage.setItem('txLastPaid', JSON.stringify(txAwaiting));

        $('#SEPAdigitalPRform').hide();
        $('#SEPAdigitalPRcode').hide();
        $('#SEPAdigitalPRsuccess').show();
        $('#SEPAdigitalPRcode h1 i').removeClass().addClass('far fa-check-circle has-text-success');
      } else if (d.status == 'created') {
        // todo
      } else {

        // localforage.removeItem('txAwaiting');
        // localforage.setItem('txLastPaid', JSON.stringify(txAwaiting));    
      }
      // } else {
      // l('tx check error');
      // clearInterval(txCheckInt);
      // localforage.removeItem('txAwaiting');
      //}

    };

    xhr.onerror = function () {
      l('ERROR get TX status', xhr.error);
      // v.loader = false;
    };
    // tx.uuid
    /*
    var res = $.getJSON('//api.sepa.digital/v1/tx/' + tx.uuid, function (d, s, xhr) {
      console.log('- tx check', txCheckCount, s, d);
      txCheckCount++;

      if (s == 'success') {

        if (d.status == 'payment_settled' || d.status == 'payment_signed') {
          console.log('-- tx success');
          clearInterval(txCheckInt);

          if (icon.length > 0) {
            icon.removeClass().addClass('far fa-check-circle');
          }

          $('#sepa-qr-code').hide();
          $('#sepa-pay-success').show();
          $('#sepa-pay-awaiting').hide();

          $('#sepa-pay-success i').removeClass().addClass('far fa-check-circle');

          localStorage.removeItem('txAwaiting');
          localStorage.setItem('txLastPaid', JSON.stringify(txAwaiting));
        } else if (d.status == 'created') {
          // todo
        } else {

          // localStorage.removeItem('txAwaiting');
          // localStorage.setItem('txLastPaid', JSON.stringify(txAwaiting));    
        }

        // alert('Payment successful');
      } else {
        console.log('tx check error');
        // clearInterval(txCheckInt);
        // localStorage.removeItem('txAwaiting');
      }
    }).fail(function () {
      console.log('tx check error');
      clearInterval(txCheckInt);
      localStorage.removeItem('txAwaiting');
    });
    */

    /*console.log(res.type);
    if (res) {
        console.log('api ok');
    } else {
        console.log('api error');
    }*/
  }


  $('.btn-tx').on('focus', function () {
    var that = this;
    var clipboard = new ClipboardJS('#' + $(this).attr('id'), {
      text: function (trigger) {
        return $(trigger).val().replace('€ ', '');
      }
    });

    clipboard.on('success', function (e) {
      var tt = tippy('#' + $(that).attr('id'), {
        content: '✓ &nbsp;"' + e.text + '" copied.'
      });

      setTimeout(() => {
        const button = document.querySelector('#' + $(that).attr('id'))
        const instance = button._tippy
        instance.show();

        setTimeout(() => {
          instance.destroy(true);
        }, 2000);
      })

      e.clearSelection();
    });
  });

  window.prInitTx = function () {
    // txAwaitingSend()
    startAboInitRequest()
  };
  window.txSendAwaiting = txSendAwaiting;
});

function slugify(string) {
  const a = 'àáäâãåèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;'
  const b = 'aaaaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return string.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}