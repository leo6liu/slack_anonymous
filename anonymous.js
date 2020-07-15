// file: anonymous.js
// author: Leo Battalora
//
// description: an express app to handle a Slack slash command (/anonymous)
//
// instructions:
//   1) place anonymous.js in an empty directory
//   2) cd into the new directory
//   3) modify the values of slackToken and slackSigningSecret in anonymous.js
//   4) $ npm install express xmlhttprequest qs
//   5) create an app with a slash command with the Request URL:
//      http://server.url:port/anonymous
//   6) make sure app has Bot Token Scopes: chat:write, commands
//   6) add the app to workspace
//   7) $ node anonymous.js
//
// tested on: node v10.21.0, npm v6.14.4, express v4.17.1, qs v6.9.4,
//            xmlhttprequest v1.8.0
//
// modification history:
//   20200615 (LB): initial version
//

// set port and credentials
//
const port = 8080; // specify port to listen on
const slackToken = 'BOT_USER_OAUTH_ACCESS_TOKEN';
const slackSigningSecret = 'SIGNING_SECRET';

// include modules
//
const express = require('express');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const crypto = require('crypto');
const qs = require('qs');

// create express app to listen for events
//
const app = express(); // create express app
app.use(express.urlencoded({ extended: true }));

// handle post requests
//
app.post('/anonymous', (req, res) => {
    // print request body to terminal
    //
    console.log('\nrequest body: \n', req.body);

    // validate request is from Slack
    // https://api.slack.com/authentication/verifying-requests-from-slack
    //
    const slackSignature = req.headers['x-slack-signature'];
    const requestBody = qs.stringify(req.body, { format: 'RFC1738' });
    const timestamp = req.headers['x-slack-request-timestamp'];
    const time = Math.floor(new Date().getTime()/1000); // time in seconds
    if (Math.abs(time - timestamp) > 300) {
	return res.status(400).send('Ignore this request.');
	console.log('Ignore this request.');
    }
    const sigBasestring = 'v0:' + timestamp + ':' + requestBody;
    const signature = 'v0=' + crypto.createHmac('sha256', slackSigningSecret)
          .update(sigBasestring, 'utf8')
          .digest('hex');
    if (crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(slackSignature, 'utf8'))) {
	console.log('Verification succeeded');
    } else {
	console.log('Verification failed');
	return res.status(400).send('Verification failed');
    }
    
    // create chat.postMessage request body
    //
    const body = JSON.stringify({
	channel: req.body.channel_id,
	text: req.body.text
    });

    // create and send chat.postMessage POST request
    //
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://slack.com/api/chat.postMessage', true);
    xhr.setRequestHeader('Authorization', 'Bearer '.concat(slackToken));
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
	channel: req.body.channel_id,
	text: req.body.text
    }));
    
    // end response
    //
    res.end();
    console.log('\nWaiting for next request...');
});

// listen indefinitely on port 8080
//
app.listen(port, '0.0.0.0');

//
// end of file
