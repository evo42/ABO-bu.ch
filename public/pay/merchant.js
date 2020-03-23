let timeoutID1, timeoutID2;

function error(msg) {
    console.log('w3c-pr-api-error-merchant', msg);
    if (timeoutID1) {
        window.clearTimeout(timeoutID1)
    }
    if (timeoutID2) {
        window.clearTimeout(timeoutID2)
    }
    var el = document.getElementById('w3c-pr-msg');
    if (el && el.innerHTML) {
        el.innerHTML = msg;
        el.className = 'error';
        timeoutID1 = window.setTimeout(function () {
            if (el.className !== 'error') {
                return
            }
            el.className = 'error-hide';
            timeoutID2 = window.setTimeout(function () {
                el.innerHTML = '';
                el.className = ''
            }, 500)
        }, 10000)
    }
}

function info(msg) {
    console.log('w3c-pr-api-info-merchant', msg);
    var el = document.getElementById('w3c-pr-msg');
    if (el && el.innerHTML) {
        el.innerHTML = msg;
        el.className = 'info'
    }
}

function toDictionary(addr) {
    var dict = {};
    if (addr) {
        dict.country = addr.country;
        dict.region = addr.region;
        dict.city = addr.city;
        dict.dependentLocality = addr.dependentLocality;
        dict.addressLine = addr.addressLine;
        dict.postalCode = addr.postalCode;
        dict.sortingCode = addr.sortingCode;
        dict.languageCode = addr.languageCode;
        dict.organization = addr.organization;
        dict.recipient = addr.recipient;
        dict.careOf = addr.careOf;
        dict.phone = addr.phone
    }
    return dict
}

function done(message, resp) {
    var shippingOption = resp.shippingOption ? 'shipping option: ' + resp.shippingOption + '<br/>' : '';
    var shippingAddress = resp.shippingAddress ? 'shipping address: ' + JSON.stringify(toDictionary(resp.shippingAddress), undefined, 2) + '<br/>' : '';
    var instrument = 'instrument:' + JSON.stringify(resp.details, undefined, 2) + '<br/>';
    var method = 'method: ' + resp.methodName + '<br/>';
    var email = resp.payerEmail ? 'email: ' + resp.payerEmail + '<br/>' : '';
    var phone = resp.payerPhone ? 'phone: ' + resp.payerPhone + '<br/>' : '';
    info(email + phone + shippingOption + shippingAddress + method + instrument)
}
class SEPAdigital {
    constructor() {
        const buyNowBtn = document.querySelector('.w3c-pr-btn-checkout') || document.querySelector('.w3c-pr-btn-donate');
        try {
            buyNowBtn.addEventListener('click', () => this.buyNowClick())
        } catch (e) {
            error("SEPAdigital Error: '" + e + "'")
        }
    }
    _createPaymentRequest() {
        window.SEPAdigitalTxId = $('#txRef').val();
        const displayItemsFromUI = [{
            label: '1 x Popcornkorn',
            amount: {
                currency: 'EUR',
                value: 0.12
            }
        }];
        const supportedCardNetworks = [];
        const basicCards = {
            supportedMethods: ['basic-card'],
            data: {
                supportedNetworks: supportedCardNetworks
            }
        };
        const supportedInstruments = [basicCards, {
            supportedMethods: "https://SEPA.digital",
            data: {
                supportedNetworks: ["SEPA"],
                supportedTypes: ["credit", "debit", "SCTInst", "SDD", "SCT"],
                merchantIdentifier: "XXXX-SEPA-DIGITAL",
                payerAccount: "FR761751590000",
                payerName: "Sue Buyer",
                payerEmail: "s.buyer@foo.bar",
                payeeAccountNumber: "AT123456789",
                payeeName: "Foo Bar Shop Inc.",
                payeePaymentIdentificationHumanReadable: "Foo42",
                payeePaymentIdentifierMachineReadable: "abcdefgh123456789",
                txReference: "Foo42",
                txId: window.SEPAdigitalTxId,
                txDateTime: "instant",
                txContract: "XXXXXX-SEPA-CHAIN",
                txIpnHook: "https://api.shop.com"
            }
        }];
        const totalLabelValue = 'Gesamt (inkl. Steuern)';
        const totalCurrencyValue = 'EUR';
        const totalAmountValue = 0.42;
        const totalFromUI = {
            label: totalLabelValue || 'Total',
            amount: {
                currency: totalCurrencyValue || 'EUR',
                value: totalAmountValue || 0
            }
        };
        const shippingOptionsFromUI = [];
        const options = {
            requestPayerName: true,
            requestPayerPhone: false,
            requestPayerEmail: true,
            requestShipping: false
        };
        const details = {
            id: '--id--',
            txId: window.SEPAdigitalTxId,
            displayItems: displayItemsFromUI,
            total: totalFromUI,
            shippingOptions: shippingOptionsFromUI
        };
        const paymentRequest = new PaymentRequest(supportedInstruments, details, options);
        return paymentRequest
    }
    _createConnectRequest() {
        const totalFromUI = {
            label: totalLabelValue || 'Total',
            amount: {
                currency: totalCurrencyValue || 'EUR',
                value: totalAmountValue || 0
            }
        };
        const shippingOptionsFromUI = [];
        const options = {
            requestPayerName: false,
            requestPayerPhone: false,
            requestPayerEmail: false,
            requestShipping: false
        };
        const details = {
            id: '--id--',
            displayItems: displayItemsFromUI,
            total: totalFromUI,
            shippingOptions: shippingOptionsFromUI
        };
        var request = null;
        try {
            request = new PaymentRequest(supportedInstruments, details, options);
            if (request.canMakePayment) {
                request.canMakePayment().then(function (result) {
                    info(result ? 'Can make SEPAdigital payment' : 'Can not make SEPAdigital payment')
                }).catch(function (err) {
                    error(err)
                })
            }
        } catch (e) {
            error("SEPAdigital mistake: '" + e + "'")
        }
        return request
    }
    buyNowClick() {
        var countReg = 0;
        registerPaymentAppServiceWorker();
        if (!window.txSendAwaiting) {
            window.prInitTx()
        }
        window.SEPAdigitalTxId = $('#txRef').val();
        setTimeout(function () {
            var w3cPay = $('body').data('w3c-pr-api-not-supported') || null;
            if (w3cPay) {
                var win = window.open('https://sepa.digital/pay/#' + window.SEPAdigitalTxId, '_blank');
                if (win) {
                    win.focus()
                } else {
                    alert('Unable to open payment page. Allow pop-ups for: https://SEPA.digital/pay')
                }
            }
        }, 1000);
        var paymentRequest = this._createPaymentRequest();
        var $btn = $('.w3c-pr-btn-checkout i'),
            $msg = $('.w3c-pr-api-result');
        $btn.removeClass('fa-cash-register fa-check-circle fa-ban fa-exclamation-triangle').addClass('fa-clock');
        $msg.html('Waiting for payment.');
        paymentRequest.show().then((result) => {
            const data = {};
            data.methodName = result.methodName;
            data.details = result.details;
            console.group('w3c-pr-api-show');
            console.log('Data: ', JSON.stringify(data, null, 2));
            console.log('Result: ', result);
            console.groupEnd();
            $btn.removeClass('fa-cash-register fa-clock fa-ban fa-exclamation-triangle').addClass('fa-check-circle');
            $msg.html('Payment received from ' + result.payerName + '.');
            return result.complete('success')
        }).catch((err) => {
            console.group('The promise from `paymentRequest.show()` was rejected.');
            console.warn('This is normally due to the user closing or cancelling the payment request UI.');
            console.warn(`The error message received was: '${err.message }'`);
            console.groupEnd();
            $btn.removeClass('fa-cash-register fa-clock fa-check-circle fa-ban').addClass('fa-exclamation-triangle');
            $msg.html('Payment canceled.')
        })
    }
}
window.addEventListener('load', function () {
    if (window.PaymentRequest) {
        new SEPAdigital()
    } else {
        console.log('w3c-pr-api-error-not-supported')
    }
});