$(document).ready(function ($) {
  var userSlug,
    txInit,
    userDisplayName,
    userName,
    userEmail,
    txAmount = 0,
    txCheckInt,
    txCheckCount = 0,
    txSendAwaiting,
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

      var icon = $('#btn-sepa-instant-pay i'),
        currentTs = Math.floor(Date.now() / 1000);

      icon.removeClass().addClass('fas fa-circle-notch fa-spin');
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

  function txAwaitingSend() {
    // var icon = $('#btn-sepa-pay i'),
    var icon = $('#btn-sepa-instant-pay i'),
      currentTs = Math.floor(Date.now() / 1000),
      eidasId;

    window.SEPAdigitalTxId = false;

    icon.removeClass().addClass('fas fa-circle-notch fa-spin'); /* fas fa-clock */

    if ($('#userEmail').val().trim() == 'rene.kapusta@eesti.ee') {
      eidasId = 'rene.kapusta@eesti.ee';
    }

    txAwaiting = {
      correlationId: ($('#receiverIban').val() + '.' + $('#txRef').val() + '.' + currentTs).replace(/\s+/g, '').trim(),
      iban: $('#receiverIban').val().replace(/\s+/g, '').trim(),
      bic: $('#receiverBic').val().trim(),
      amount: parseFloat($('#txAmount').val().replace(',', '.').replace('€', '').trim(), 10),
      name: $('#receiverName').val().trim(),
      customerId: $('#userEmail').val().trim(),
      eidas: eidasId || '',
      // reference: $('#txRef').val().trim(),
      // shortId: $('#txRef').val().trim(),
      // ipn: "https://api.sepa.digital/v1/tx/inbox",
      // tip: parseFloat(($('#txTip') && $('#txTip').val() && $('#txTip').val().replace(',', '.').replace('€', '').trim()) || 0, 10),
      // ipn: "https://webhook.site/cf3f287f-ae8c-4ece-8ddd-6a519341ffcd"
      // userPhone: $('#userPhone').val().trim(),
    };

    /* store before send and update after receiving data */
    localStorage.setItem('txAwaiting', JSON.stringify(txAwaiting));
    if (txCheckInt) {
      clearInterval(txCheckInt);
    }

    $.post('//api.sepa.digital/credit-transfer', JSON.stringify(txAwaiting), function (response) {
      // process response
      console.log('response awaiting tx', response);
      // clearInterval(txCheckInt);
      var pr = response;

      window.SEPAdigitalTxId = pr.uuid;

      if (response && response['_links'] && response['_links'].payment) {
        $('.cd-sepa-digital-code').attr('src', pr['_links'].qrcode);

        $('#link-sepa-digital').attr('href', pr['_links'].payment)
        $('#link-bankapp').attr('href', pr['_links'].bankapp)

        $('#txRef').val(pr['shortId'])

        $('#payment-section').show();

        if (pr.eidas != '') {
          // start payment request background process 
          // curl https://api.sepa.digital/v1/credit-transfer/raiffeisen.at -d '{"toIban": "", "toName": "", "fromIban": "", "eidas": "", "amount": 0, "reference": "", "token": "", "uuid": ""}'
          txInit = {
            toIban: pr.iban_to,
            toBic: pr.bic_to,
            toName: pr.name_to,
            eidas: pr.eidas,
            amount: pr.amount,
            reference: pr.reference,
            uuid: pr.uuid
          }

          $.post('//api.sepa.digital/v1/credit-transfer/raiffeisen.at', JSON.stringify(txInit), function (txSend) {

            if (txSend.status == 'success') {
              $('#sepa-pay-awaiting').hide();
              $('#sepa-pay-success').show();
            } else {
              // TODO reauth
              // TODO error
            }
          });
        }

        txSendAwaiting = pr;
        localStorage.setItem('txAwaiting', JSON.stringify(response));
        txCheckInt = setInterval(function () {
          txAwaitingCheck(txSendAwaiting);
        }, 1500);
      } else {
        console.log('**** ERROR on create payment request ***')
      }

    })
  }

  // on blur check for eIDAS ID (email)
  $('#userEmail').on('blur', function (e) {
    var userEmail = $(this).val().trim();
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
      $('#userEmail').val('');
      $('#eSEPA').text('');
    }
  });

  function txAwaitingCheck(tx) {
    // return;

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

    // tx.uuid
    // var res = $.getJSON('//api.sepa.digital/v1/tx/' + tx.id + '?callback=?', function(d, s, xhr) {
    var res = $.getJSON('//api.sepa.digital/v1/tx/' + tx.uuid, function (d, s, xhr) {
      console.log('- tx check', txCheckCount, s, d);
      txCheckCount++;

      if (s == 'success') {

        if (d.status == 'payment_settled' || d.status == 'payment_signed') {
          console.log('-- tx success');
          clearInterval(txCheckInt);


          var icon = $('#btn-sepa-instant-pay i');
          icon.removeClass().addClass('far fa-check-circle');

          $('#sepa-qr-code').hide();
          $('#sepa-pay-success').show();
          $('#sepa-pay-awaiting').hide();

          $('#sepa-pay-success i').removeClass().addClass('far fa-check-circle');

          localStorage.removeItem('txAwaiting');
          localStorage.setItem('txLastPaid', JSON.stringify(txAwaiting));

          /* fas fa-check-circle */
          /*
          var icon = $('#btn-sepa-pay i');
          icon.removeClass().addClass('far fa-check-circle'); 

          initModal('modal-trigger'); // PAYMENT SUCCESS
          */
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
    txAwaitingSend()
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