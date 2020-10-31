"use strict";
/* Create Secret Key between Accounts*/
const assert = require("assert");
const crypto = require("crypto");
const request = require("request");

let server = crypto.createDiffieHellman(1024);
let prime = server.getPrime();

console.log("Generate Richard's keys...");
let Richard = crypto.createDiffieHellman(prime);
let RichardPublicKey = Richard.generateKeys("base64");

console.log("Generate Pablo's keys...");
let Pablo = crypto.createDiffieHellman(prime);
let PabloPublicKey = Pablo.generateKeys("base64");

console.log("Generate xumm's keys...");
let xumm = crypto.createDiffieHellman(prime);
let xummPublicKey = xumm.generateKeys("base64");

console.log("Exchange and generate the secret...");
let RichardPabloSecret = Richard.computeSecret(PabloPublicKey, "base64");
let PabloRichardSecret = Pablo.computeSecret(RichardPublicKey, "base64");
let xummRichardSecret = xumm.computeSecret(RichardPublicKey, "base64");
let RichardxummSecret = Richard.computeSecret(xummPublicKey, "base64");

// console.log("RichardPublicKey", RichardPublicKey);
// console.log("PabloPublicKey", PabloPublicKey);
assert.notEqual(RichardPublicKey, PabloPublicKey); 
//console.log("RichardPublicKey and PabloPublicKey NOT equal");

console.log("RichardPabloSecret", RichardPabloSecret.toString("base64"));
console.log("PabloRichardSecret", PabloRichardSecret.toString("base64"));
assert.equal(RichardPabloSecret.toString("hex"), PabloRichardSecret.toString("hex")); 
//console.log("RichardPabloSecret and PabloRichardSecret equal");

/*xumm api key and secret*/
const apikey = '';
const apisecret = '';

/* Encrypt YOTI URL */
var secret = RichardPabloSecret.toString("base64")
var mykey = crypto.createCipher('aes-256-cbc', secret);
var mystr = mykey.update('YOTI URL INSERT HERE', 'utf8', 'hex') // YOTI KYCd Shared URL taken from send details in YOTI App

async function encrypt(){
	mystr += mykey.final('hex');
	//console.log(mystr); 
}
encrypt()

/* Create Xumm Payload*/
const Address = ""; // senders address, not needed with XUMM payment.
var DestinationAddress ="XRP ADDRESS HERE"; // user to share kyc'd details with. so Pablos Account in this example.
var PayloadUUID; // Payload UUID
var web; // Web URL
const value = "1" // 1 drop Min amount to send + 12 drop fee ,13 drops max.
var qr; //Qr URL
var dstTag = "100000" //Destination Tag


async function payload(){
    
var Note = await mystr;
var options = {
    method: 'POST',
    url: 'https://xumm.app/api/v1/platform/payload',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apikey,
      'x-api-secret': apisecret,
      authorization: 'Bearer' + apisecret
    },
    body: { 
                "options": {
                    "submit": true,
                    "return_url": {
                        "web": "",
                        "app": ""
                                }
                            },
"txjson": {
    "TransactionType": "Payment",
    "Destination": DestinationAddress, 
        "Amount": value,
        "DestinationTag": dstTag,
    "Fee": "12",
    "Memos": [
        {
          "Memo": {
            "MemoType": Buffer.from('KYC', 'utf8').toString('hex').toUpperCase(),
            "MemoData": Buffer.from(Note, 'utf8').toString('hex').toUpperCase()
          }
        }
      ]
  }
 
},
json: true,
};

request(options, async function (error, response, body) {
if (error) throw new Error(error);
web = body.next.always;
qr = body.refs.qr_png;
PayloadUUID = body.uuid;
console.log(web); // scan QR code on XUMM webpage.
console.log(qr); // URL to qr.png code only.
console.log(PayloadUUID); // Payload UUID.

})
}

setTimeout(payload, 5000)

let memo = ""; // Encrypted Memo taken from memo metadata from transaction.
let Note = ""; // Decrypted Memo.

/* Payload Status*/
async function status(){
    var data = String(PayloadUUID);

	var options = {
	  method: 'GET',
	  url: 'https://xumm.app/api/v1/platform/payload/' + data,
	  headers: {
	    'x-api-key': apikey,
	    'x-api-secret': apisecret,
	    'content-type': 'application/json'
	    
	  },
	};

	request(options, async function (error, response, body) {
	  if (error) throw new Error(error);

      var jsonBody = await JSON.parse(body)
      memo = jsonBody.payload.request_json.Memos[0].Memo.MemoData
      
     Note = await Buffer.from(memo, 'hex').toString('utf8')
	 //console.log(Note)
	
	});
}
setTimeout(status, 35000)
/*Decrypt Data*/
async function decrypt(){
    await Note;
    var secret1 = PabloRichardSecret.toString("base64")
var mykey = await crypto.createDecipher('aes-256-cbc', secret1);
var Data = await mykey.update(Note, 'hex', 'utf8')
Data += mykey.final('utf8');
console.log("Decypting Memo: ",Data); 
}
setTimeout(decrypt, 45000)
